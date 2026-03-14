const DEFAULT_SNAPSHOT = {
  hasFace: false,
  leftEyeRatio: 0,
  rightEyeRatio: 0,
  rawLeftEyeRatio: 0,
  rawRightEyeRatio: 0,
  source: "mediapipe",
  providerLabel: "AI detector",
};

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

export class MediaPipeVisionDetector {
  constructor({ video, eyeClosedThreshold }) {
    this.video = video;
    this.eyeClosedThreshold = eyeClosedThreshold;
    this.faceLandmarker = null;
    this.lastVideoTime = -1;
    this.listeners = new Set();
    this.rafId = 0;
    this.running = false;
    this.currentSnapshot = { ...DEFAULT_SNAPSHOT };
    this.smoothedLeftEyeRatio = 0;
    this.smoothedRightEyeRatio = 0;
    this.loop = this.loop.bind(this);
  }

  async initialize() {
    const module = await import("../vendor/mediapipe/vision_bundle.mjs");
    const { FaceLandmarker, FilesetResolver } = module;
    const wasmRoot = new URL("../vendor/mediapipe/wasm", import.meta.url).href;
    const modelAssetPath = new URL("../vendor/mediapipe/face_landmarker.task", import.meta.url).href;
    const vision = await FilesetResolver.forVisionTasks(wasmRoot);
    this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath },
      numFaces: 1,
      runningMode: "VIDEO",
    });

    this.running = true;
    this.loop();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return this.currentSnapshot;
  }

  destroy() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
    }
    this.listeners.clear();
  }

  emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  loop() {
    if (!this.running) {
      return;
    }

    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const nextVideoTime = this.video.currentTime;
      if (nextVideoTime !== this.lastVideoTime) {
        this.lastVideoTime = nextVideoTime;
        const result = this.faceLandmarker.detectForVideo(this.video, performance.now());
        this.currentSnapshot = this.buildSnapshot(result);
        this.emit();
      }
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  buildSnapshot(result) {
    const landmarks = result?.faceLandmarks?.[0];
    if (!landmarks) {
      this.smoothedLeftEyeRatio = 0;
      this.smoothedRightEyeRatio = 0;
      return { ...DEFAULT_SNAPSHOT };
    }

    const rawLeftEyeRatio = computeEyeRatio(landmarks, LEFT_EYE_INDICES);
    const rawRightEyeRatio = computeEyeRatio(landmarks, RIGHT_EYE_INDICES);
    this.smoothedLeftEyeRatio = smoothEyeRatio(this.smoothedLeftEyeRatio, rawLeftEyeRatio);
    this.smoothedRightEyeRatio = smoothEyeRatio(this.smoothedRightEyeRatio, rawRightEyeRatio);

    return {
      hasFace: true,
      leftEyeRatio: this.smoothedLeftEyeRatio,
      rightEyeRatio: this.smoothedRightEyeRatio,
      rawLeftEyeRatio,
      rawRightEyeRatio,
      eyeClosedThreshold: this.eyeClosedThreshold,
      source: "mediapipe",
      providerLabel: "AI detector",
    };
  }
}

function smoothEyeRatio(previousValue, nextValue) {
  if (previousValue <= 0) {
    return nextValue;
  }
  return previousValue * 0.65 + nextValue * 0.35;
}

function computeEyeRatio(landmarks, indices) {
  const points = indices.map((index) => landmarks[index]);
  if (points.some((point) => !point)) {
    return 0;
  }

  const horizontal = distance(points[0], points[3]);
  const verticalA = distance(points[1], points[5]);
  const verticalB = distance(points[2], points[4]);
  return (verticalA + verticalB) / Math.max(2 * horizontal, 0.0001);
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
