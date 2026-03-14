const DEFAULT_SNAPSHOT = {
  movementScore: 1,
  isStill: false,
  hasFace: false,
  earVisible: false,
  bodyInFrame: false,
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

export class MediaPipeStillDetector {
  #faceLandmarker = null;
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
    const { FaceLandmarker, FilesetResolver } = module;
    const wasmRoot = new URL("../vendor/mediapipe/wasm", import.meta.url).href;
    const modelAssetPath = new URL("../vendor/mediapipe/face_landmarker.task", import.meta.url).href;
    const vision = await FilesetResolver.forVisionTasks(wasmRoot);
    this.#faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath },
      numFaces: 1,
      runningMode: "VIDEO",
    });

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
        const result = this.#faceLandmarker.detectForVideo(this.#video, performance.now());
        this.#snapshot = this.#buildSnapshot(result);
        this.#emit();
      }
    }

    this.#rafId = requestAnimationFrame(this.#loop);
  };

  #buildSnapshot(result) {
    const landmarks = result?.faceLandmarks?.[0];
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

  #calculateMovementScore() {
    if (this.#positions.length < 6) {
      return 1;
    }

    return (
      variance(this.#positions.map((frame) => frame.nose.x)) +
      variance(this.#positions.map((frame) => frame.nose.y)) +
      variance(this.#positions.map((frame) => frame.leftEye.x)) +
      variance(this.#positions.map((frame) => frame.leftEye.y)) +
      variance(this.#positions.map((frame) => frame.rightEye.x)) +
      variance(this.#positions.map((frame) => frame.rightEye.y))
    ) / 6;
  }
}

function normalize(point, faceWidth) {
  return {
    x: point.x / faceWidth,
    y: point.y / faceWidth,
  };
}

function variance(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
