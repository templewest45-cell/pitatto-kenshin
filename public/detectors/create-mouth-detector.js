import { MockMouthDetector } from "./mock-mouth-detector.js";

const INIT_TIMEOUT_MS = 4000;

export async function createMouthDetector({ button, video, onStatus }) {
  onStatus && onStatus("Loading AI mouth detector.");

  try {
    const module = await withTimeout(
      import("./mediapipe-mouth-detector.js"),
      INIT_TIMEOUT_MS,
      "Timed out while loading MediaPipe module.",
    );
    const MediaPipeMouthDetector = module.MediaPipeMouthDetector;
    if (!MediaPipeMouthDetector) {
      throw new Error("MediaPipe mouth detector export was not found.");
    }

    const detector = new MediaPipeMouthDetector({ video: video });
    await withTimeout(
      detector.initialize(),
      INIT_TIMEOUT_MS,
      "Timed out while starting MediaPipe mouth detector.",
    );
    onStatus && onStatus("AI detector is running.");
    return detector;
  } catch (error) {
    const message = error instanceof Error ? error.message : "MediaPipe mouth detector failed.";
    onStatus && onStatus("Falling back to mock detector. " + message);
    return new MockMouthDetector(button);
  }
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(function () {
        reject(new Error(message));
      }, timeoutMs);
    }),
  ]);
}
