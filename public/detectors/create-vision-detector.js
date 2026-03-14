import { MockVisionDetector } from "./mock-vision-detector.js";

const INIT_TIMEOUT_MS = 4000;

export async function createVisionDetector({ button, video, eyeClosedThreshold, onStatus }) {
  onStatus && onStatus("Loading vision detector.");

  try {
    const module = await withTimeout(
      import("./mediapipe-vision-detector.js"),
      INIT_TIMEOUT_MS,
      "Timed out while loading MediaPipe vision detector.",
    );
    const MediaPipeVisionDetector = module.MediaPipeVisionDetector;
    if (!MediaPipeVisionDetector) {
      throw new Error("MediaPipe vision detector export was not found.");
    }

    const detector = new MediaPipeVisionDetector({ video, eyeClosedThreshold });
    await withTimeout(
      detector.initialize(),
      INIT_TIMEOUT_MS,
      "Timed out while starting MediaPipe vision detector.",
    );
    onStatus && onStatus("AI vision detector is running.");
    return detector;
  } catch (error) {
    const message = error instanceof Error ? error.message : "MediaPipe vision detector failed.";
    onStatus && onStatus("Falling back to mock vision detector. " + message);
    return new MockVisionDetector(button);
  }
}

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(message));
      }, timeoutMs);
    }),
  ]);
}
