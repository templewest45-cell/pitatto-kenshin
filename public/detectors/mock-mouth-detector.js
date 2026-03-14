export class MockMouthDetector {
  constructor(button) {
    this.open = false;
    this.listeners = new Set();

    var self = this;
    var pressStart = function (event) {
      event.preventDefault();
      self.setOpen(true);
    };
    var pressEnd = function () {
      self.setOpen(false);
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
      mouthRatio: this.open ? 1 : 0,
      mouthWidthRatio: this.open ? 0.34 : 0.62,
      lipGapRatio: this.open ? 0.3 : 0.06,
      isOpen: this.open,
      isEee: !this.open,
      hasFace: true,
      source: "mock",
      providerLabel: "Mock detector",
    };
  }

  setOpen(nextValue) {
    if (this.open === nextValue) {
      return;
    }

    this.open = nextValue;
    var snapshot = this.snapshot();
    this.listeners.forEach(function (listener) {
      listener(snapshot);
    });
  }
}
