import { MockStillDetector } from "./mock-still-detector.js";

const INIT_TIMEOUT_MS = 4000;

export async function createStillDetector({ button, video, examType, onStatus }) {
  onStatus && onStatus("Loading AI still detector.");

  try {
    const module = await withTimeout(
      import("./mediapipe-still-detector.js"),
      INIT_TIMEOUT_MS,
      "Timed out while loading MediaPipe still module.",
    );
    const MediaPipeStillDetector = module.MediaPipeStillDetector;
    if (!MediaPipeStillDetector) {
      throw new Error("MediaPipe still detector export was not found.");
    }

    const detector = new MediaPipeStillDetector({ video: video, examType: examType });
    await withTimeout(
      detector.initialize(),
      INIT_TIMEOUT_MS,
      "Timed out while starting MediaPipe still detector.",
    );
    onStatus && onStatus("AI still detector is running.");
    return detector;
  } catch (error) {
    const message = error instanceof Error ? error.message : "MediaPipe still detector failed.";
    onStatus && onStatus("Falling back to mock still detector. " + message);
    return new MockStillDetector(button);
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
