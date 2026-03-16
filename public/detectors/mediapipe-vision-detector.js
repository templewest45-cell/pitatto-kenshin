const DEFAULT_SNAPSHOT = {
  hasFace: false,
  leftEyeRatio: 0,
  rightEyeRatio: 0,
  rawLeftEyeRatio: 0,
  rawRightEyeRatio: 0,
  leftEyeVisibilityScore: 0,
  rightEyeVisibilityScore: 0,
  leftEyeMeanLuma: 0,
  rightEyeMeanLuma: 0,
  leftEyeDarkRatio: 0,
  rightEyeDarkRatio: 0,
  source: "mediapipe",
  providerLabel: "AI detector",
};

// MediaPipe Face Landmarker uses 33-133 for the subject's right eye
// and 362-263 for the subject's left eye.
const LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144];

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
    this.analysisCanvas = document.createElement("canvas");
    this.analysisContext = this.analysisCanvas.getContext("2d", { willReadFrequently: true });
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
    const eyeImageMetrics = this.computeEyeImageMetrics(landmarks);

    return {
      hasFace: true,
      leftEyeRatio: this.smoothedLeftEyeRatio,
      rightEyeRatio: this.smoothedRightEyeRatio,
      rawLeftEyeRatio,
      rawRightEyeRatio,
      leftEyeVisibilityScore: eyeImageMetrics.left.visibilityScore,
      rightEyeVisibilityScore: eyeImageMetrics.right.visibilityScore,
      leftEyeMeanLuma: eyeImageMetrics.left.meanLuma,
      rightEyeMeanLuma: eyeImageMetrics.right.meanLuma,
      leftEyeDarkRatio: eyeImageMetrics.left.darkRatio,
      rightEyeDarkRatio: eyeImageMetrics.right.darkRatio,
      eyeClosedThreshold: this.eyeClosedThreshold,
      source: "mediapipe",
      providerLabel: "AI detector",
    };
  }

  computeEyeImageMetrics(landmarks) {
    const videoWidth = this.video.videoWidth || 0;
    const videoHeight = this.video.videoHeight || 0;
    if (!this.analysisContext || videoWidth <= 0 || videoHeight <= 0) {
      return {
        left: { visibilityScore: 0, meanLuma: 0 },
        right: { visibilityScore: 0, meanLuma: 0 },
      };
    }

    if (this.analysisCanvas.width !== videoWidth || this.analysisCanvas.height !== videoHeight) {
      this.analysisCanvas.width = videoWidth;
      this.analysisCanvas.height = videoHeight;
    }

    this.analysisContext.drawImage(this.video, 0, 0, videoWidth, videoHeight);
    return {
      left: analyzeEyeRegion(this.analysisContext, videoWidth, videoHeight, landmarks, LEFT_EYE_INDICES),
      right: analyzeEyeRegion(this.analysisContext, videoWidth, videoHeight, landmarks, RIGHT_EYE_INDICES),
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

function analyzeEyeRegion(context, videoWidth, videoHeight, landmarks, indices) {
  const box = computeEyeBounds(landmarks, indices, videoWidth, videoHeight);
  if (!box) {
      return { visibilityScore: 0, meanLuma: 0, darkRatio: 0 };
  }

  const imageData = context.getImageData(box.x, box.y, box.width, box.height);
  const data = imageData.data;
  if (!data.length) {
    return { visibilityScore: 0, meanLuma: 0, darkRatio: 0 };
  }

  let sum = 0;
  let sumSquares = 0;
  let count = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  let darkCount = 0;
  const strideX = Math.max(1, Math.floor(box.width / 18));
  const strideY = Math.max(1, Math.floor(box.height / 12));

  for (let y = 0; y < box.height; y += strideY) {
    for (let x = 0; x < box.width; x += strideX) {
      const index = (y * box.width + x) * 4;
      const luma = rgbToLuma(data[index], data[index + 1], data[index + 2]);
      sum += luma;
      sumSquares += luma * luma;
      count += 1;
      if (luma < 52) {
        darkCount += 1;
      }

      if (x + strideX < box.width) {
        const rightIndex = (y * box.width + (x + strideX)) * 4;
        const rightLuma = rgbToLuma(data[rightIndex], data[rightIndex + 1], data[rightIndex + 2]);
        edgeSum += Math.abs(luma - rightLuma);
        edgeCount += 1;
      }
      if (y + strideY < box.height) {
        const lowerIndex = ((y + strideY) * box.width + x) * 4;
        const lowerLuma = rgbToLuma(data[lowerIndex], data[lowerIndex + 1], data[lowerIndex + 2]);
        edgeSum += Math.abs(luma - lowerLuma);
        edgeCount += 1;
      }
    }
  }

  const meanLuma = count ? sum / count : 0;
  const variance = count ? Math.max(sumSquares / count - meanLuma * meanLuma, 0) : 0;
  const contrastScore = Math.sqrt(variance) / 255;
  const edgeScore = edgeCount ? edgeSum / edgeCount / 255 : 0;
  const darkRatio = count ? darkCount / count : 0;
  return {
    visibilityScore: contrastScore * 0.55 + edgeScore * 0.45,
    meanLuma,
    darkRatio,
  };
}

function computeEyeBounds(landmarks, indices, videoWidth, videoHeight) {
  const points = indices.map((index) => landmarks[index]);
  if (points.some((point) => !point)) {
    return null;
  }

  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  points.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const padX = Math.max(width * 0.9, 0.025);
  const padY = Math.max(height * 2.4, 0.035);
  const x = clamp(Math.floor((minX - padX) * videoWidth), 0, videoWidth - 1);
  const y = clamp(Math.floor((minY - padY) * videoHeight), 0, videoHeight - 1);
  const right = clamp(Math.ceil((maxX + padX) * videoWidth), x + 1, videoWidth);
  const bottom = clamp(Math.ceil((maxY + padY) * videoHeight), y + 1, videoHeight);
  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y),
  };
}

function rgbToLuma(r, g, b) {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
