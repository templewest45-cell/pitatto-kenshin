export class MockStillDetector {
  constructor(button) {
    this.still = false;
    this.listeners = new Set();

    var self = this;
    var pressStart = function (event) {
      event.preventDefault();
      self.setStill(true);
    };
    var pressEnd = function () {
      self.setStill(false);
    };

    button.addEventListener("pointerdown", pressStart);
    button.addEventListener("pointerup", pressEnd);
    button.addEventListener("pointercancel", pressEnd);
    button.addEventListener("pointerleave", pressEnd);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return {
      movementScore: this.still ? 0 : 1,
      isStill: this.still,
      hasFace: true,
      earVisible: this.still,
      bodyInFrame: this.still,
      source: "mock",
      providerLabel: "Mock detector",
    };
  }

  setStill(nextValue) {
    if (this.still === nextValue) {
      return;
    }

    this.still = nextValue;
    var snapshot = this.snapshot();
    this.listeners.forEach(function (listener) {
      listener(snapshot);
    });
  }
}
