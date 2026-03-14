const DEFAULT_SNAPSHOT = {
  mouthRatio: 0,
  rawMouthRatio: 0,
  mouthWidthRatio: 0,
  lipGapRatio: 0,
  isOpen: false,
  isEee: false,
  hasFace: false,
  source: "mediapipe",
  providerLabel: "AI 判定",
};

const UPPER_LIP_INDEX = 13;
const LOWER_LIP_INDEX = 14;
const LEFT_MOUTH_INDEX = 61;
const RIGHT_MOUTH_INDEX = 291;
const LEFT_FACE_INDEX = 234;
const RIGHT_FACE_INDEX = 454;

export class MediaPipeMouthDetector {
  #faceLandmarker = null;
  #lastVideoTime = -1;
  #listeners = new Set();
  #rafId = 0;
  #running = false;
  #sampleCount = 0;
  #smoothedRatio = 0;
  #snapshot = DEFAULT_SNAPSHOT;
  #video;

  constructor({ video }) {
    this.#video = video;
  }

  async initialize() {
    const moduleUrl = "../vendor/mediapipe/vision_bundle.mjs";
    let module;

    try {
      module = await import(moduleUrl);
    } catch {
      throw new Error(
        "MediaPipe 資産が未配置です。`public/vendor/mediapipe/` に同梱してください。",
      );
    }

    const { FaceLandmarker, FilesetResolver } = module;
    if (!FaceLandmarker || !FilesetResolver) {
      throw new Error("MediaPipe Face Landmarker API を読み込めませんでした。");
    }

    const wasmRoot = new URL("../vendor/mediapipe/wasm", import.meta.url).href;
    const modelAssetPath = new URL(
      "../vendor/mediapipe/face_landmarker.task",
      import.meta.url,
    ).href;

    const vision = await FilesetResolver.forVisionTasks(wasmRoot);
    this.#faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath,
      },
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
        const result = this.#faceLandmarker.detectForVideo(
          this.#video,
          performance.now(),
        );
        this.#snapshot = this.#buildSnapshot(result);
        this.#emit();
      }
    }

    this.#rafId = requestAnimationFrame(this.#loop);
  };

  #buildSnapshot(result) {
    const landmarks = result?.faceLandmarks?.[0];
    if (!landmarks) {
      return {
        mouthRatio: 0,
        rawMouthRatio: 0,
        mouthWidthRatio: 0,
        lipGapRatio: 0,
        isOpen: false,
        isEee: false,
        hasFace: false,
        source: "mediapipe",
        providerLabel: this.#sampleCount < 8 ? "AI 準備中" : "AI 判定",
      };
    }

    const upperLip = landmarks[UPPER_LIP_INDEX];
    const lowerLip = landmarks[LOWER_LIP_INDEX];
    const leftMouth = landmarks[LEFT_MOUTH_INDEX];
    const rightMouth = landmarks[RIGHT_MOUTH_INDEX];
    const leftFace = landmarks[LEFT_FACE_INDEX];
    const rightFace = landmarks[RIGHT_FACE_INDEX];

    if (!upperLip || !lowerLip || !leftMouth || !rightMouth || !leftFace || !rightFace) {
      return DEFAULT_SNAPSHOT;
    }

    const lipGap = Math.max(Math.abs(upperLip.y - lowerLip.y), 0.001);
    const mouthWidth = Math.max(Math.abs(leftMouth.x - rightMouth.x), 0.001);
    const faceWidth = Math.max(Math.abs(leftFace.x - rightFace.x), 0.001);
    const rawRatio = Math.min((lipGap / mouthWidth) * 3.2, 1.4);
    const mouthWidthRatio = Math.min(mouthWidth / faceWidth, 1.2);
    const lipGapRatio = Math.min(lipGap / faceWidth, 1.2);
    this.#sampleCount += 1;
    const smoothing = this.#sampleCount < 8 ? 0.2 : 0.34;
    this.#smoothedRatio += (rawRatio - this.#smoothedRatio) * smoothing;

    return {
      mouthRatio: this.#smoothedRatio,
      rawMouthRatio: rawRatio,
      mouthWidthRatio,
      lipGapRatio,
      isOpen: this.#smoothedRatio >= 0.56,
      isEee: mouthWidthRatio >= 0.38 && lipGapRatio >= 0.1,
      hasFace: true,
      source: "mediapipe",
      providerLabel: this.#sampleCount < 8 ? "AI 準備中" : "AI 判定",
    };
  }
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
