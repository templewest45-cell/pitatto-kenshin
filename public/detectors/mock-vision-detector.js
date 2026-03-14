export class MockVisionDetector {
  constructor(button) {
    this.button = button;
    this.listeners = new Set();
    this.closed = false;
    this.onStart = this.onStart.bind(this);
    this.onEnd = this.onEnd.bind(this);
    button.addEventListener("pointerdown", this.onStart);
    button.addEventListener("pointerup", this.onEnd);
    button.addEventListener("pointercancel", this.onEnd);
    button.addEventListener("pointerleave", this.onEnd);
  }

  onStart(event) {
    event.preventDefault();
    this.closed = true;
    this.emit();
  }

  onEnd() {
    this.closed = false;
    this.emit();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    const leftEyeRatio = this.closed ? 0.1 : 0.3;
    const rightEyeRatio = 0.3;
    return {
      hasFace: true,
      leftEyeRatio,
      rightEyeRatio,
      rawLeftEyeRatio: leftEyeRatio,
      rawRightEyeRatio: rightEyeRatio,
      source: "mock",
      providerLabel: "れんしゅう",
    };
  }

  emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  destroy() {
    this.button.removeEventListener("pointerdown", this.onStart);
    this.button.removeEventListener("pointerup", this.onEnd);
    this.button.removeEventListener("pointercancel", this.onEnd);
    this.button.removeEventListener("pointerleave", this.onEnd);
    this.listeners.clear();
  }
}
