const DEFAULT_SNAPSHOT = {
  movementScore: 1,
  isStill: false,
  hasFace: false,
  earVisible: false,
  bodyInFrame: false,
  headInFrame: false,
  topFootInFrame: false,
  bottomFootInFrame: false,
  yawRatio: 1,
  source: "mediapipe",
  providerLabel: "AI FaceMesh",
};

const NOSE_TIP_INDEX = 1;
const LEFT_EYE_OUTER_INDEX = 33;
const RIGHT_EYE_OUTER_INDEX = 263;
const LEFT_FACE_SIDE_INDEX = 234;
const RIGHT_FACE_SIDE_INDEX = 454;
const BODY_IN_FRAME_FACE_WIDTH_MAX = 0.28;
const YAW_LEFT_MAX = 0.68;
const YAW_RIGHT_MIN = 1.47;
const HISTORY_LIMIT = 24;
const POSE_MODEL_ASSET_PATH = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const LEFT_ANKLE_INDEX = 27;
const RIGHT_ANKLE_INDEX = 28;
const LEFT_HEEL_INDEX = 29;
const RIGHT_HEEL_INDEX = 30;
const LEFT_FOOT_INDEX = 31;
const RIGHT_FOOT_INDEX = 32;
const POSE_NOSE_INDEX = 0;
const POSE_VISIBILITY_MIN = 0.35;
const POSE_PRESENCE_MIN = 0.35;
const ECG_FRAME_MARGIN = 0.02;
const ECG_MIN_HEAD_FOOT_SEPARATION_X = 0.18;
const ECG_MIN_FOOT_SEPARATION_Y = 0.12;
const ECG_MAX_HEAD_TO_FEET_CENTER_OFFSET_Y = 0.32;
const ECG_MIN_TRIANGLE_AREA = 0.015;

export class MediaPipeStillDetector {
  #faceLandmarker = null;
  #poseLandmarker = null;
  #lastVideoTime = -1;
  #listeners = new Set();
  #positions = [];
  #rafId = 0;
  #running = false;
  #snapshot = DEFAULT_SNAPSHOT;
  #video;
  #examType;

  constructor({ video, examType }) {
    this.#video = video;
    this.#examType = examType || "naika";
  }

  async initialize() {
    const module = await import("../vendor/mediapipe/vision_bundle.mjs");
    const { FaceLandmarker, FilesetResolver, PoseLandmarker } = module;
    const wasmRoot = new URL("../vendor/mediapipe/wasm", import.meta.url).href;
    const modelAssetPath = new URL("../vendor/mediapipe/face_landmarker.task", import.meta.url).href;
    const vision = await FilesetResolver.forVisionTasks(wasmRoot);
    this.#faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath },
      numFaces: 1,
      runningMode: "VIDEO",
    });
    if (this.#examType === "shindenzu") {
      this.#poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL_ASSET_PATH },
        numPoses: 1,
        runningMode: "VIDEO",
      });
    }

    this.#running = true;
    this.#loop();
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    listener(this.snapshot());
    return () => this.#listeners.delete(listener);
  }

  snapshot() {
    return this.#snapshot;
  }

  destroy() {
    this.#running = false;
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
    }
    this.#faceLandmarker?.close();
    this.#poseLandmarker?.close();
  }

  #emit() {
    if (!this.#running) {
      return;
    }

    const snapshot = this.snapshot();
    for (const listener of this.#listeners) {
      listener(snapshot);
    }
  }

  #loop = () => {
    if (!this.#running) {
      return;
    }

    if (this.#video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const nextVideoTime = this.#video.currentTime;
      if (nextVideoTime !== this.#lastVideoTime) {
        this.#lastVideoTime = nextVideoTime;
        const now = performance.now();
        const faceResult = this.#faceLandmarker.detectForVideo(this.#video, now);
        const poseResult = this.#poseLandmarker ? this.#poseLandmarker.detectForVideo(this.#video, now) : null;
        this.#snapshot = this.#buildSnapshot(faceResult, poseResult);
        this.#emit();
      }
    }

    this.#rafId = requestAnimationFrame(this.#loop);
  };

  #buildSnapshot(faceResult, poseResult) {
    const landmarks = faceResult?.faceLandmarks?.[0];
    const poseLandmarks = poseResult?.landmarks?.[0] || null;
    if (this.#examType === "shindenzu") {
      const faceNose = landmarks?.[NOSE_TIP_INDEX] || null;
      return this.#buildEcgSnapshot({
        nose: faceNose,
        poseLandmarks,
      });
    }

    if (!landmarks) {
      this.#positions = [];
      return { ...DEFAULT_SNAPSHOT };
    }

    const nose = landmarks[NOSE_TIP_INDEX];
    const leftEye = landmarks[LEFT_EYE_OUTER_INDEX];
    const rightEye = landmarks[RIGHT_EYE_OUTER_INDEX];
    const leftFaceSide = landmarks[LEFT_FACE_SIDE_INDEX];
    const rightFaceSide = landmarks[RIGHT_FACE_SIDE_INDEX];
    if (!nose || !leftEye || !rightEye || !leftFaceSide || !rightFaceSide) {
      this.#positions = [];
      return { ...DEFAULT_SNAPSHOT };
    }

    const faceWidth = Math.max(distance(leftFaceSide, rightFaceSide), 0.001);
    this.#positions.push({
      nose: normalize(nose, faceWidth),
      leftEye: normalize(leftEye, faceWidth),
      rightEye: normalize(rightEye, faceWidth),
    });
    if (this.#positions.length > HISTORY_LIMIT) {
      this.#positions.shift();
    }

    const movementScore = this.#calculateMovementScore();
    const yawRatio =
      Math.abs(nose.x - leftFaceSide.x) / Math.max(Math.abs(nose.x - rightFaceSide.x), 0.001);
    const earVisible = yawRatio <= YAW_LEFT_MAX || yawRatio >= YAW_RIGHT_MIN;
    const bodyInFrame = faceWidth <= BODY_IN_FRAME_FACE_WIDTH_MAX;

    return {
      movementScore,
      isStill: movementScore <= 0.018,
      hasFace: true,
      earVisible,
      bodyInFrame,
      yawRatio,
      source: "mediapipe",
      providerLabel: this.#examType === "shindenzu" ? "AI FaceMesh ECG" : "AI FaceMesh",
    };
  }

  #buildEcgSnapshot({ nose, poseLandmarks }) {
    if (!poseLandmarks) {
      this.#positions = [];
      return {
        ...DEFAULT_SNAPSHOT,
        hasFace: true,
        providerLabel: "AI FaceMesh + Pose ECG",
      };
    }

    const footPair = getOrderedFootPair(poseLandmarks);
    if (!footPair) {
      this.#positions = [];
      return {
        ...DEFAULT_SNAPSHOT,
        hasFace: true,
        providerLabel: "AI FaceMesh + Pose ECG",
      };
    }

    const headPoint = nose || getPoseHeadPoint(poseLandmarks);
    if (!headPoint) {
      this.#positions = [];
      return {
        ...DEFAULT_SNAPSHOT,
        hasFace: true,
        providerLabel: "AI FaceMesh + Pose ECG",
      };
    }

    const scale = Math.max(
      distance2d(headPoint, footPair.topFoot),
      distance2d(headPoint, footPair.bottomFoot),
      distance2d(footPair.topFoot, footPair.bottomFoot),
      0.001,
    );

    this.#positions.push({
      head: normalizeByScale(headPoint, scale),
      topFoot: normalizeByScale(footPair.topFoot, scale),
      bottomFoot: normalizeByScale(footPair.bottomFoot, scale),
    });
    if (this.#positions.length > HISTORY_LIMIT) {
      this.#positions.shift();
    }

    const movementScore = this.#calculateMovementScore();
    const frameState = getEcgFrameState(headPoint, footPair.topFoot, footPair.bottomFoot);

    return {
      movementScore,
      isStill: movementScore <= 0.018,
      hasFace: true,
      earVisible: false,
      bodyInFrame: frameState.bodyInFrame,
      headInFrame: frameState.headInFrame,
      topFootInFrame: frameState.topFootInFrame,
      bottomFootInFrame: frameState.bottomFootInFrame,
      yawRatio: 1,
      source: "mediapipe",
      providerLabel: "AI FaceMesh + Pose ECG",
    };
  }

  #calculateMovementScore() {
    if (this.#positions.length < 6) {
      return 1;
    }
    const pointKeys = Object.keys(this.#positions[0]);
    let total = 0;
    let count = 0;
    pointKeys.forEach((key) => {
      total += variance(this.#positions.map((frame) => frame[key].x));
      total += variance(this.#positions.map((frame) => frame[key].y));
      count += 2;
    });
    return count ? total / count : 1;
  }
}

function normalize(point, faceWidth) {
  return {
    x: point.x / faceWidth,
    y: point.y / faceWidth,
  };
}

function normalizeByScale(point, scale) {
  return {
    x: point.x / scale,
    y: point.y / scale,
  };
}

function variance(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function getOrderedFootPair(landmarks) {
  const firstFoot = averagePosePoints(landmarks, [LEFT_ANKLE_INDEX, LEFT_HEEL_INDEX, LEFT_FOOT_INDEX]);
  const secondFoot = averagePosePoints(landmarks, [RIGHT_ANKLE_INDEX, RIGHT_HEEL_INDEX, RIGHT_FOOT_INDEX]);
  if (!firstFoot || !secondFoot) {
    return null;
  }

  const points = [firstFoot, secondFoot].sort((a, b) => a.y - b.y);
  return {
    topFoot: points[0],
    bottomFoot: points[1],
  };
}

function averagePosePoints(landmarks, indices) {
  const points = indices
    .map((index) => landmarks[index])
    .filter(
      (point) =>
        point &&
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        Number(point.visibility ?? 1) >= POSE_VISIBILITY_MIN &&
        Number(point.presence ?? 1) >= POSE_PRESENCE_MIN,
    );

  if (!points.length) {
    return null;
  }

  const sum = points.reduce(
    (acc, point) => {
      acc.x += point.x;
      acc.y += point.y;
      return acc;
    },
    { x: 0, y: 0 },
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

function getPoseHeadPoint(landmarks) {
  const nose = landmarks?.[POSE_NOSE_INDEX];
  if (
    !nose ||
    !Number.isFinite(nose.x) ||
    !Number.isFinite(nose.y) ||
    Number(nose.visibility ?? 1) < POSE_VISIBILITY_MIN ||
    Number(nose.presence ?? 1) < POSE_PRESENCE_MIN
  ) {
    return null;
  }

  return {
    x: nose.x,
    y: nose.y,
  };
}

function getEcgFrameState(headPoint, topFoot, bottomFoot) {
  const headVisible = isInsideFrame(headPoint);
  const topFootVisible = isInsideFrame(topFoot);
  const bottomFootVisible = isInsideFrame(bottomFoot);
  const feetCenter = {
    x: (topFoot.x + bottomFoot.x) / 2,
    y: (topFoot.y + bottomFoot.y) / 2,
  };
  const headFootSeparationX = Math.abs(headPoint.x - feetCenter.x);
  const footSeparationY = Math.abs(topFoot.y - bottomFoot.y);
  const centerOffsetY = Math.abs(headPoint.y - feetCenter.y);
  const triangleArea = Math.abs(
    headPoint.x * (topFoot.y - bottomFoot.y) +
      topFoot.x * (bottomFoot.y - headPoint.y) +
      bottomFoot.x * (headPoint.y - topFoot.y),
  ) / 2;

  const bodyInFrame =
    headVisible &&
    topFootVisible &&
    bottomFootVisible &&
    headFootSeparationX >= ECG_MIN_HEAD_FOOT_SEPARATION_X &&
    footSeparationY >= ECG_MIN_FOOT_SEPARATION_Y &&
    centerOffsetY <= ECG_MAX_HEAD_TO_FEET_CENTER_OFFSET_Y &&
    triangleArea >= ECG_MIN_TRIANGLE_AREA;

  return {
    bodyInFrame,
    headInFrame: headVisible,
    topFootInFrame: topFootVisible,
    bottomFootInFrame: bottomFootVisible,
  };
}

function isInsideFrame(point) {
  return (
    point.x >= ECG_FRAME_MARGIN &&
    point.x <= 1 - ECG_FRAME_MARGIN &&
    point.y >= ECG_FRAME_MARGIN &&
    point.y <= 1 - ECG_FRAME_MARGIN
  );
}

function distance2d(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
