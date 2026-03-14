window.__appModuleLoaded = true;

const CACHE_NAME = "kenshin-dekitayo-v98";
const SETTINGS_KEY = "kenshin-dekitayo.settings";
const MOUTH_EEE_GAP_THRESHOLD_MIN = 0.1;
const SUCCESS_MESSAGE = "じょうずに できた すごい！";
const DEFAULT_STILL_PROMPT_IMAGES = {
  naika: "./assets/still-default-naika.png",
  jibika: "./assets/still-default-jibika.png",
  ganka: "./assets/still-default-ganka.png",
  shindenzu: "./assets/still-default-shindenzu.png",
};
const DEFAULT_SETTINGS = {
  targetSeconds: 5,
  ecgTargetSeconds: 10,
  mouthThreshold: 0.56,
  mouthMode: "open",
  mouthEeeWidthThreshold: 0.38,
  mouthEeeGapThreshold: 0.1,
  stillThreshold: 0.018,
  eyeClosedThreshold: 0.19,
  muted: false,
  hideCamera: false,
  examType: "naika",
  stillPromptImage: "",
};
const LEFT_EYE_CLOSED_DELTA = 0.035;
const RIGHT_EYE_CLOSED_DELTA = 0.012;
const EYE_OPEN_FLOOR = 0.16;
const RIGHT_EYE_OPEN_FLOOR = 0.135;
const RIGHT_EYE_THRESHOLD_BONUS = 0.045;
const VISION_EYE_CONFIRM_HOLD_MS = 2000;
const STILL_FRONT_YAW_MIN = 0.72;
const STILL_FRONT_YAW_MAX = 1.34;
const STILL_SIDE_YAW_LEFT_MAX = 0.48;
const STILL_SIDE_YAW_RIGHT_MIN = 2.05;
const SCREEN_NAMES = ["home", "mouth", "still", "vision"];

const ui = {
  appError: document.getElementById("app-error"),
  networkStatus: document.getElementById("network-status"),
  cacheStatus: document.getElementById("cache-status"),
  readinessStatus: document.getElementById("readiness-status"),
  settingsDialog: document.getElementById("settings-dialog"),
  closeSettings: document.getElementById("close-settings"),
  saveSettings: document.getElementById("save-settings"),
  resetProgress: document.getElementById("reset-progress"),
  targetSeconds: document.getElementById("setting-target-seconds"),
  targetSecondsValue: document.getElementById("setting-target-seconds-value"),
  ecgTargetSeconds: document.getElementById("setting-ecg-target-seconds"),
  ecgTargetSecondsValue: document.getElementById("setting-ecg-target-seconds-value"),
  mouthThreshold: document.getElementById("setting-mouth-threshold"),
  mouthThresholdValue: document.getElementById("setting-mouth-threshold-value"),
  mouthEeeWidthThreshold: document.getElementById("setting-mouth-eee-width-threshold"),
  mouthEeeWidthThresholdValue: document.getElementById("setting-mouth-eee-width-threshold-value"),
  mouthEeeGapThreshold: document.getElementById("setting-mouth-eee-gap-threshold"),
  mouthEeeGapThresholdValue: document.getElementById("setting-mouth-eee-gap-threshold-value"),
  stillThreshold: document.getElementById("setting-still-threshold"),
  stillThresholdValue: document.getElementById("setting-still-threshold-value"),
  eyeThreshold: document.getElementById("setting-eye-threshold"),
  eyeThresholdValue: document.getElementById("setting-eye-threshold-value"),
  examType: document.getElementById("setting-exam-type"),
  stillImage: document.getElementById("setting-still-image"),
  stillImagePreview: document.getElementById("setting-still-image-preview"),
  clearStillImage: document.getElementById("clear-still-image"),
  hideCamera: document.getElementById("setting-hide-camera"),
  muted: document.getElementById("setting-muted"),
  stillHeroCopy: document.getElementById("still-hero-copy"),
  stillExamChooser: document.getElementById("still-exam-chooser"),
  stillLayout: document.getElementById("still-layout"),
  stillExamChoiceButtons: Array.from(document.querySelectorAll("[data-exam-choice]")),
  examIconShape: document.getElementById("exam-icon-shape"),
  stillCustomImage: document.getElementById("still-custom-image"),
  startMouthMode: document.getElementById("start-mouth-mode"),
  startStillMode: document.getElementById("start-still-mode"),
  startVisionMode: document.getElementById("start-vision-mode"),
  backHomeMouth: document.getElementById("back-home-mouth"),
  backHomeStill: document.getElementById("back-home-still"),
  backHomeVision: document.getElementById("back-home-vision"),
  settingsTriggerMouth: document.getElementById("settings-trigger-mouth"),
  settingsTriggerStill: document.getElementById("settings-trigger-still"),
  settingsTriggerVision: document.getElementById("settings-trigger-vision"),
  mouth: {
    video: document.getElementById("camera"),
    cameraState: document.getElementById("camera-state"),
    cameraHelp: document.getElementById("camera-help"),
    cameraMask: document.getElementById("camera-mask"),
    detectorState: document.getElementById("detector-state"),
    providerChip: document.getElementById("provider-chip"),
    providerHelp: document.getElementById("provider-help"),
    manualTrigger: document.getElementById("manual-trigger"),
    progressLabel: document.getElementById("progress-label"),
    progressFill: document.getElementById("progress-fill"),
    timerLabel: document.getElementById("timer-label"),
    scoreLabel: document.getElementById("ratio-label"),
    promptText: document.getElementById("prompt-text"),
    celebration: document.getElementById("celebration"),
    face: document.getElementById("mouth-face"),
    mouthShape: document.getElementById("illustration-mouth"),
    modeButtons: Array.from(document.querySelectorAll("[data-mouth-mode]")),
  },
  still: {
    video: document.getElementById("still-camera"),
    cameraState: document.getElementById("still-camera-state"),
    cameraHelp: document.getElementById("still-camera-help"),
    cameraMask: document.getElementById("still-camera-mask"),
    heartFaceFrame: document.getElementById("still-heart-face-frame"),
    guideFrame: document.querySelector("#still-screen .guide-frame"),
    guideBody: document.querySelector("#still-screen .guide-body"),
    detectorState: document.getElementById("still-detector-state"),
    providerChip: document.getElementById("still-provider-chip"),
    providerHelp: document.getElementById("still-provider-help"),
    manualTrigger: document.getElementById("still-manual-trigger"),
    progressLabel: document.getElementById("still-progress-label"),
    progressFill: document.getElementById("still-progress-fill"),
    timerLabel: document.getElementById("still-timer-label"),
    scoreLabel: document.getElementById("still-score-label"),
    promptText: document.getElementById("still-prompt-text"),
    celebration: document.getElementById("still-celebration"),
  },
  vision: {
    video: document.getElementById("vision-camera"),
    cameraState: document.getElementById("vision-camera-state"),
    cameraHelp: document.getElementById("vision-camera-help"),
    cameraMask: document.getElementById("vision-camera-mask"),
    detectorState: document.getElementById("vision-detector-state"),
    providerChip: document.getElementById("vision-provider-chip"),
    providerHelp: document.getElementById("vision-provider-help"),
    manualTrigger: document.getElementById("vision-manual-trigger"),
    progressLabel: document.getElementById("vision-progress-label"),
    progressFill: document.getElementById("vision-progress-fill"),
    timerLabel: document.getElementById("vision-timer-label"),
    scoreLabel: document.getElementById("vision-score-label"),
    debugLabel: document.getElementById("vision-debug-label"),
    promptText: document.getElementById("vision-prompt-text"),
    celebration: document.getElementById("vision-celebration"),
    eyeCoach: document.getElementById("vision-eye-coach"),
    landolt: document.getElementById("vision-landolt"),
    answerGrid: document.getElementById("vision-answer-grid"),
    answerButtons: Array.from(document.querySelectorAll("#vision-answer-grid .answer-button")),
  },
};

ui.settingFields = {
  targetSeconds: ui.targetSeconds ? ui.targetSeconds.closest(".field") : null,
  ecgTargetSeconds: ui.ecgTargetSeconds ? ui.ecgTargetSeconds.closest(".field") : null,
  mouthThreshold: ui.mouthThreshold ? ui.mouthThreshold.closest(".field") : null,
  mouthEeeWidthThreshold: ui.mouthEeeWidthThreshold ? ui.mouthEeeWidthThreshold.closest(".field") : null,
  mouthEeeGapThreshold: ui.mouthEeeGapThreshold ? ui.mouthEeeGapThreshold.closest(".field") : null,
  stillThreshold: ui.stillThreshold ? ui.stillThreshold.closest(".field") : null,
  eyeThreshold: ui.eyeThreshold ? ui.eyeThreshold.closest(".field") : null,
  examType: ui.examType ? ui.examType.closest(".field") : null,
  stillImage: ui.stillImage ? ui.stillImage.closest(".field") : null,
};

const modeStates = {
  mouth: createBaseState(),
  still: createBaseState(),
  vision: createVisionState(),
};

let currentMode = "home";
let sharedCameraStream = null;
let pendingStillImageDataUrl = null;
let audioContext = null;

function createBaseState() {
  return {
    detector: null,
    unsubscribe: null,
    started: false,
    loading: false,
    snapshot: null,
    progressSeconds: 0,
    completed: false,
    lastTickAt: 0,
    rafId: 0,
    statusMessage: "",
    settings: readSettings(),
    examSelectionPending: false,
    stillPhase: "single",
    celebrationPlayed: false,
  };
}

function createVisionState() {
  return {
    ...createBaseState(),
    questionDirections: createVisionQuestionSet(),
    questionIndex: 0,
    selectedAnswer: "",
    successLocked: false,
    eyeConfirmed: false,
    instructionStartedAt: 0,
    confirmStartedAt: 0,
    lastTargetEye: "left",
    requiresNeutralBeforeConfirm: false,
  };
}

class LocalMockMouthDetector {
  constructor(button) {
    this.button = button;
    this.listeners = new Set();
    this.open = false;
    this.onStart = this.onStart.bind(this);
    this.onEnd = this.onEnd.bind(this);
    button.addEventListener("pointerdown", this.onStart);
    button.addEventListener("pointerup", this.onEnd);
    button.addEventListener("pointercancel", this.onEnd);
    button.addEventListener("pointerleave", this.onEnd);
  }

  onStart(event) {
    event.preventDefault();
    this.open = true;
    this.emit();
  }

  onEnd() {
    this.open = false;
    this.emit();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return {
      hasFace: true,
      mouthRatio: this.open ? 1 : 0.1,
      mouthWidthRatio: this.open ? 0.62 : 0.34,
      lipGapRatio: this.open ? 0.3 : 0.06,
      isEee: !this.open,
      source: "mock",
      providerLabel: "mock",
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

class LocalMockStillDetector {
  constructor(button) {
    this.button = button;
    this.listeners = new Set();
    this.still = false;
    this.onStart = this.onStart.bind(this);
    this.onEnd = this.onEnd.bind(this);
    button.addEventListener("pointerdown", this.onStart);
    button.addEventListener("pointerup", this.onEnd);
    button.addEventListener("pointercancel", this.onEnd);
    button.addEventListener("pointerleave", this.onEnd);
  }

  onStart(event) {
    event.preventDefault();
    this.still = true;
    this.emit();
  }

  onEnd() {
    this.still = false;
    this.emit();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return {
      hasFace: true,
      movementScore: this.still ? 0 : 1,
      source: "mock",
      providerLabel: "mock",
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

class LocalMockVisionDetector {
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
      providerLabel: "mock",
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

function readSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const settings = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    if (settings.mouthEeeWidthThreshold === 0.52 || settings.mouthEeeWidthThreshold === 0.42) {
      settings.mouthEeeWidthThreshold = DEFAULT_SETTINGS.mouthEeeWidthThreshold;
    }
    if (
      settings.mouthEeeGapThreshold === 0.12 ||
      settings.mouthEeeGapThreshold === 0.18 ||
      settings.mouthEeeGapThreshold === 0.22 ||
      settings.mouthEeeGapThreshold === 0.24
    ) {
      settings.mouthEeeGapThreshold = DEFAULT_SETTINGS.mouthEeeGapThreshold;
    }
    settings.mouthEeeGapThreshold = Math.max(
      Number(settings.mouthEeeGapThreshold) || DEFAULT_SETTINGS.mouthEeeGapThreshold,
      MOUTH_EEE_GAP_THRESHOLD_MIN,
    );
    return settings;
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function setText(node, value) {
  if (node) {
    node.textContent = value;
  }
}

function setWidth(node, value) {
  if (node) {
    node.style.width = value;
  }
}

function playSuccessFanfare() {
  const settings = readSettings();
  if (settings.muted) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return;
  }

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const now = audioContext.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.11);
    gain.gain.setValueAtTime(0.0001, now + index * 0.11);
    gain.gain.exponentialRampToValueAtTime(0.16, now + index * 0.11 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.11 + 0.24);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now + index * 0.11);
    oscillator.stop(now + index * 0.11 + 0.26);
  });
}

function syncCompletionEffects(panel, state) {
  panel.celebration.classList.toggle("hidden", !state.completed);
  if (state.completed && !state.celebrationPlayed) {
    state.celebrationPlayed = true;
    playSuccessFanfare();
  } else if (!state.completed) {
    state.celebrationPlayed = false;
  }
}

function applySuccessCopy() {
  setText(document.querySelector("#celebration span"), SUCCESS_MESSAGE);
  setText(document.querySelector("#still-celebration span"), SUCCESS_MESSAGE);
  setText(document.querySelector("#vision-celebration span"), SUCCESS_MESSAGE);
}

function ensureStillHeartGuideSvg() {
  if (!ui.still.guideFrame) {
    return null;
  }
  let node = ui.still.guideFrame.querySelector(".guide-heart-svg-wrap");
  if (!node) {
    ui.still.guideFrame.insertAdjacentHTML("beforeend", '<div class="guide-heart-svg-wrap hidden" aria-hidden="true"></div>');
    node = ui.still.guideFrame.querySelector(".guide-heart-svg-wrap");
  }
  if (node && !node.innerHTML.trim()) {
    node.innerHTML = getStillHeartGuideSvg();
  }
  return node;
}

function getStillHeartGuideSvg() {
  return [
    '<svg class="guide-heart-svg" viewBox="0 0 300 180" aria-hidden="true">',
    '  <rect x="10" y="18" width="280" height="144" rx="34" fill="rgba(15,23,42,0.10)" stroke="rgba(255,255,255,0.96)" stroke-width="6" stroke-dasharray="10 8"></rect>',
    '  <circle cx="72" cy="90" r="42" fill="rgba(250,204,21,0.16)" stroke="#facc15" stroke-width="10"></circle>',
    '  <circle cx="72" cy="90" r="28" fill="none" stroke="rgba(255,255,255,0.96)" stroke-width="5" stroke-dasharray="8 5"></circle>',
    '  <rect x="116" y="62" width="116" height="56" rx="28" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" stroke-width="6"></rect>',
    '  <line x1="232" y1="76" x2="270" y2="62" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"></line>',
    '  <line x1="232" y1="104" x2="270" y2="118" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"></line>',
    '  <line x1="152" y1="62" x2="136" y2="36" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"></line>',
    '  <line x1="152" y1="118" x2="136" y2="144" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"></line>',
    '  <text x="72" y="148" text-anchor="middle" fill="#f8fafc" font-size="20" font-weight="800">かお</text>',
    '  <text x="252" y="148" text-anchor="middle" fill="#f8fafc" font-size="18" font-weight="700">あし</text>',
    "</svg>",
  ].join("");
}

function renderStillGuideFrame(examType, stillPhase) {
  if (!ui.still.guideFrame) {
    return;
  }

  if (examType === "shindenzu") {
    ui.still.guideFrame.innerHTML = "";
    ui.still.guideBody = ui.still.guideFrame.querySelector(".guide-body");
    ui.still.guideFrame.classList.add("guide-heart-mode");
    return;
  }

  ui.still.guideFrame.innerHTML = '<div class="guide-body"></div>';
  ui.still.guideBody = ui.still.guideFrame.querySelector(".guide-body");
  if (ui.still.guideFrame) {
    ui.still.guideFrame.classList.toggle("guide-ear-mode", examType === "jibika" && stillPhase === "ear");
    ui.still.guideFrame.classList.toggle("guide-heart-mode", false);
  }
  if (ui.still.guideBody) {
    ui.still.guideBody.classList.toggle("guide-ear-shape", examType === "jibika" && stillPhase === "ear");
    ui.still.guideBody.classList.toggle("guide-heart-shape", false);
    ui.still.guideBody.classList.remove("hidden");
  }
}

function ensureVisionEyeCoach() {
  const illustration = document.querySelector(".vision-illustration");
  if (!illustration) {
    return;
  }
  let coach = document.getElementById("vision-eye-coach");
  if (!coach) {
    illustration.insertAdjacentHTML("afterbegin", '<div id="vision-eye-coach" class="vision-eye-coach target-left" aria-hidden="true"></div>');
    coach = document.getElementById("vision-eye-coach");
  }
  if (coach && !coach.innerHTML.trim()) {
    coach.innerHTML = getVisionCoachSvg("left");
  }
  ui.vision.eyeCoach = coach;
  ui.vision.answerGrid = document.getElementById("vision-answer-grid");
  ui.vision.landolt = document.getElementById("vision-landolt");
  if (ui.vision.landolt) {
    ui.vision.landolt.classList.remove("is-visible");
  }
  if (ui.vision.answerGrid) {
    ui.vision.answerGrid.classList.remove("is-visible");
  }
}

function clearServiceWorkerCaches() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => caches.keys())
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => {
        setText(ui.cacheStatus, "cache cleared");
      })
      .catch(() => {
        setText(ui.cacheStatus, "cache clear failed");
      });
  });
}

function getVisionCoachSvg(targetEye) {
  const handX = targetEye === "left" ? 54 : 130;
  const handRotate = targetEye === "left" ? -12 : 12;
  const coveredEyeX = targetEye === "left" ? 76 : 124;
  return [
    '<div class="vision-coach-copy">' + (targetEye === "left" ? "ひだりめを かくそう" : "みぎめを かくそう") + "</div>",
    '<svg class="vision-coach-svg" viewBox="0 0 200 200" aria-hidden="true">',
    '  <rect x="8" y="8" width="184" height="184" rx="28" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="4"></rect>',
    '  <circle cx="100" cy="108" r="58" fill="#fdba74"></circle>',
    '  <path d="M52 92 C60 48, 140 40, 148 92 L148 72 C136 34, 64 34, 52 72 Z" fill="#334155"></path>',
    '  <line x1="76" y1="106" x2="92" y2="106" stroke="#0f172a" stroke-width="6" stroke-linecap="round"></line>',
    '  <line x1="108" y1="106" x2="124" y2="106" stroke="#0f172a" stroke-width="6" stroke-linecap="round"></line>',
    '  <path d="M86 136 Q100 148 114 136" fill="none" stroke="#7c2d12" stroke-width="5" stroke-linecap="round"></path>',
    '  <g transform="translate(' + handX + ' 82) rotate(' + handRotate + ')">',
    '    <rect x="0" y="0" width="44" height="58" rx="16" fill="#fed7aa" stroke="#fb923c" stroke-width="3"></rect>',
    '    <rect x="6" y="-12" width="8" height="24" rx="4" fill="#fed7aa" stroke="#fb923c" stroke-width="2"></rect>',
    '    <rect x="16" y="-14" width="8" height="26" rx="4" fill="#fed7aa" stroke="#fb923c" stroke-width="2"></rect>',
    '    <rect x="26" y="-12" width="8" height="24" rx="4" fill="#fed7aa" stroke="#fb923c" stroke-width="2"></rect>',
    "  </g>",
    '  <circle cx="' + coveredEyeX + '" cy="106" r="18" fill="rgba(255,255,255,0.18)"></circle>',
    "</svg>",
  ].join("");
}

function chooseLandoltDirection() {
  const directions = ["up", "right", "down", "left"];
  return directions[Math.floor(Math.random() * directions.length)];
}

function createVisionQuestionSet() {
  return Array.from({ length: 8 }, () => chooseLandoltDirection());
}

function getVisionTargetDirection(state) {
  return state.questionDirections[state.questionIndex] || state.questionDirections[state.questionDirections.length - 1] || "right";
}

function getVisionTargetEye(state) {
  return state.questionIndex < 4 ? "left" : "right";
}

function getVisionAnsweredCount(state) {
  return Math.min(state.questionIndex, state.questionDirections.length);
}

function showError(message) {
  const text = message instanceof Error ? message.message : String(message);
  console.error(text);
  if (ui.appError) {
    ui.appError.textContent = "app.js error: " + text;
    ui.appError.classList.remove("hidden");
  }
}

function clearError() {
  if (ui.appError) {
    ui.appError.textContent = "";
    ui.appError.classList.add("hidden");
  }
}

function fillSettingsForm(settings) {
  ui.targetSeconds.value = String(settings.targetSeconds);
  ui.targetSecondsValue.value = String(settings.targetSeconds);
  ui.ecgTargetSeconds.value = String(settings.ecgTargetSeconds);
  ui.ecgTargetSecondsValue.value = String(settings.ecgTargetSeconds);
  ui.mouthThreshold.value = String(settings.mouthThreshold);
  ui.mouthThresholdValue.value = Number(settings.mouthThreshold).toFixed(2);
  ui.mouthEeeWidthThreshold.value = String(settings.mouthEeeWidthThreshold);
  ui.mouthEeeWidthThresholdValue.value = Number(settings.mouthEeeWidthThreshold).toFixed(2);
  ui.mouthEeeGapThreshold.value = String(settings.mouthEeeGapThreshold);
  ui.mouthEeeGapThresholdValue.value = Number(settings.mouthEeeGapThreshold).toFixed(2);
  ui.stillThreshold.value = String(settings.stillThreshold);
  ui.stillThresholdValue.value = Number(settings.stillThreshold).toFixed(3);
  ui.eyeThreshold.value = String(settings.eyeClosedThreshold);
  ui.eyeThresholdValue.value = Number(settings.eyeClosedThreshold).toFixed(2);
  if (ui.examType) {
    ui.examType.value = settings.examType;
  }
  ui.stillImage.value = "";
  ui.hideCamera.checked = settings.hideCamera;
  ui.muted.checked = settings.muted;
  updateStillImagePreview(resolveStillPromptImage(settings, pendingStillImageDataUrl));
}

function getDefaultStillPromptImage(examType) {
  return DEFAULT_STILL_PROMPT_IMAGES[examType] || DEFAULT_STILL_PROMPT_IMAGES.naika;
}

function resolveStillPromptImage(settings, pendingValue) {
  if (pendingValue !== null && pendingValue !== undefined) {
    return pendingValue || getDefaultStillPromptImage(settings.examType || DEFAULT_SETTINGS.examType);
  }
  return settings.stillPromptImage || getDefaultStillPromptImage(settings.examType || DEFAULT_SETTINGS.examType);
}

function applyTeacherSettingsLabels() {
  setFieldLabel(ui.targetSeconds, "静止秒数");
  setFieldLabel(ui.ecgTargetSeconds, "心電図 静止秒数");
  setFieldLabel(ui.mouthThreshold, "アー 縦開きしきい値");
  setFieldLabel(ui.mouthEeeWidthThreshold, "イー 横広がりしきい値");
  setFieldLabel(ui.mouthEeeGapThreshold, "イー 縦開き下限");
  setFieldLabel(ui.stillThreshold, "静止しきい値");
  setFieldLabel(ui.eyeThreshold, "片目閉じしきい値");
  setFieldLabel(ui.examType, "検査種類");
  setFieldLabel(ui.stillImage, "静止モード画像");
  setCheckboxLabel(ui.hideCamera, "カメラを隠す");
  setCheckboxLabel(ui.muted, "音を出さない");
  setText(document.querySelector("#settings-dialog .settings-header h2"), "設定");
  setText(ui.closeSettings, "閉じる");
  setText(ui.saveSettings, "設定を保存");
  setText(ui.resetProgress, "判定とゲージをリセット");
  [ui.settingsTriggerMouth, ui.settingsTriggerStill, ui.settingsTriggerVision].forEach((button) => {
    if (button) {
      button.textContent = "⚙";
      button.setAttribute("aria-label", "設定");
      button.setAttribute("title", "設定");
    }
  });
  setText(ui.clearStillImage, "標準に戻す");
}

function setFieldLabel(input, text) {
  const span = input?.closest(".field")?.querySelector("span");
  setText(span, text);
}

function setCheckboxLabel(input, text) {
  const span = input?.closest(".checkbox-field")?.querySelector("span");
  setText(span, text);
}

function readSettingsForm() {
  return {
    targetSeconds: Number(ui.targetSeconds.value) || DEFAULT_SETTINGS.targetSeconds,
    ecgTargetSeconds: Number(ui.ecgTargetSeconds.value) || DEFAULT_SETTINGS.ecgTargetSeconds,
    mouthThreshold: Number(ui.mouthThreshold.value) || DEFAULT_SETTINGS.mouthThreshold,
    mouthMode: readSettings().mouthMode || DEFAULT_SETTINGS.mouthMode,
    mouthEeeWidthThreshold:
      Number(ui.mouthEeeWidthThreshold.value) || DEFAULT_SETTINGS.mouthEeeWidthThreshold,
    mouthEeeGapThreshold:
      Math.max(
        Number(ui.mouthEeeGapThreshold.value) || DEFAULT_SETTINGS.mouthEeeGapThreshold,
        MOUTH_EEE_GAP_THRESHOLD_MIN,
      ),
    stillThreshold: Number(ui.stillThreshold.value) || DEFAULT_SETTINGS.stillThreshold,
    eyeClosedThreshold: Number(ui.eyeThreshold.value) || DEFAULT_SETTINGS.eyeClosedThreshold,
    examType: (ui.examType && ui.examType.value) || readSettings().examType || DEFAULT_SETTINGS.examType,
    stillPromptImage: pendingStillImageDataUrl === null ? readSettings().stillPromptImage || "" : pendingStillImageDataUrl,
    hideCamera: Boolean(ui.hideCamera.checked),
    muted: Boolean(ui.muted.checked),
  };
}

function syncSettingsVisibility(settings) {
  const examType = settings.examType || DEFAULT_SETTINGS.examType;
  const isStillMode = currentMode === "still";
  const isMouthMode = currentMode === "mouth";
  const isVisionMode = currentMode === "vision";

  toggleHidden(ui.settingFields.targetSeconds, !(isMouthMode || (isStillMode && examType !== "shindenzu")));
  toggleHidden(ui.settingFields.ecgTargetSeconds, !(isStillMode && examType === "shindenzu"));
  toggleHidden(ui.settingFields.mouthThreshold, !isMouthMode);
  toggleHidden(ui.settingFields.mouthEeeWidthThreshold, !isMouthMode);
  toggleHidden(ui.settingFields.mouthEeeGapThreshold, !isMouthMode);
  toggleHidden(ui.settingFields.stillThreshold, !isStillMode);
  toggleHidden(ui.settingFields.eyeThreshold, !isVisionMode);
  toggleHidden(ui.settingFields.examType, true);
  toggleHidden(ui.settingFields.stillImage, !isStillMode);
}

function toggleHidden(node, hidden) {
  if (node) {
    node.classList.toggle("hidden", hidden);
  }
}

function updateStillImagePreview(src) {
  if (!ui.stillImagePreview) {
    return;
  }
  const hasImage = Boolean(src);
  ui.stillImagePreview.classList.toggle("hidden", !hasImage);
  if (hasImage) {
    ui.stillImagePreview.src = src;
  } else {
    ui.stillImagePreview.removeAttribute("src");
  }
}

function applySettingsVisuals(settings) {
  [ui.mouth.cameraMask, ui.still.cameraMask, ui.vision.cameraMask].forEach((node) => {
    node.classList.toggle("hidden", !settings.hideCamera);
  });

  const stillPromptImage = resolveStillPromptImage(settings, null);

  if (ui.examIconShape) {
    ui.examIconShape.className = "exam-icon-shape exam-" + settings.examType;
    ui.examIconShape.classList.toggle("hidden", Boolean(stillPromptImage));
  }

  if (ui.stillCustomImage) {
    const hasStillImage = Boolean(stillPromptImage);
    ui.stillCustomImage.classList.toggle("hidden", !hasStillImage);
    if (hasStillImage) {
      ui.stillCustomImage.src = stillPromptImage;
    } else {
      ui.stillCustomImage.removeAttribute("src");
    }
  }

  if (ui.stillHeroCopy) {
    ui.stillHeroCopy.textContent = "けんさに あわせて、じっと してみましょう。";
  }
}

function refreshSettings() {
  const settings = readSettings();
  modeStates.mouth.settings = settings;
  modeStates.still.settings = settings;
  modeStates.vision.settings = settings;
  applySettingsVisuals(settings);
  fillSettingsForm(settings);
  syncSettingsVisibility(settings);
  syncMouthModeButtons(settings.mouthMode || DEFAULT_SETTINGS.mouthMode);
  renderAll();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error || new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

function syncMouthModeButtons(mode) {
  ui.mouth.modeButtons.forEach((button) => {
    const active = (button.dataset.mouthMode || "open") === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setMouthMode(nextMode) {
  const mouthMode = nextMode === "eee" ? "eee" : "open";
  const settings = { ...readSettings(), mouthMode };
  saveSettings(settings);
  refreshSettings();
  if (currentMode === "mouth") {
    restartCurrentMode();
  }
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load selected image."));
    image.src = src;
  });
}

async function optimizeStillImageDataUrl(dataUrl) {
  if (!dataUrl) {
    return "";
  }

  const image = await loadImageElement(dataUrl);
  const maxDimension = 640;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.82;
  let optimized = canvas.toDataURL("image/jpeg", quality);
  while (optimized.length > 900000 && quality > 0.45) {
    quality -= 0.08;
    optimized = canvas.toDataURL("image/jpeg", quality);
  }
  return optimized;
}

function updateNetworkStatus() {
  setText(ui.networkStatus, navigator.onLine ? "オンライン" : "オフライン");
}

async function updateCacheStatus() {
  if (!("caches" in window)) {
    setText(ui.cacheStatus, "cache つかえません");
    return;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match("./index.html");
    setText(ui.cacheStatus, cached ? "cache OK" : "cache なし");
  } catch (error) {
    setText(ui.cacheStatus, "cache ふめい");
  }
}

function updateReadinessStatus() {
  const anyReady =
    Boolean(modeStates.mouth.snapshot?.hasFace) ||
    Boolean(modeStates.still.snapshot?.hasFace) ||
    Boolean(modeStates.vision.snapshot?.hasFace);
  setText(ui.readinessStatus, anyReady ? "AI じゅんび OK" : "AI じゅんびちゅう");
}

function openSettings() {
  pendingStillImageDataUrl = null;
  const settings = readSettings();
  fillSettingsForm(settings);
  syncSettingsVisibility(settings);
  ui.settingsDialog.showModal();
}

function closeSettings() {
  pendingStillImageDataUrl = null;
  if (ui.settingsDialog.open) {
    ui.settingsDialog.close();
  }
}

function cameraPanels() {
  return {
    mouth: ui.mouth,
    still: ui.still,
    vision: ui.vision,
  };
}

async function ensureCamera(mode) {
  const panel = cameraPanels()[mode];
  if (!panel || !panel.video) {
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setText(panel.cameraState, "かめら つかえない");
    setText(panel.cameraHelp, "この ぶらうざでは かめらが つかえません。");
    return;
  }

  try {
    if (!sharedCameraStream) {
      sharedCameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
    }

    Object.values(cameraPanels()).forEach((target) => {
      if (target.video && target.video.srcObject !== sharedCameraStream) {
        target.video.srcObject = sharedCameraStream;
      }
    });

    setText(panel.cameraState, "かめら OK");
    setText(panel.cameraHelp, "かおが わくに おさまるように して ください。");
  } catch (error) {
    setText(panel.cameraState, "かめら しっぱい");
    setText(panel.cameraHelp, "かめらを ゆるしてから もういちど おためしください。");
  }
}

function stopMode(mode, keepVisualState) {
  const state = modeStates[mode];
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }
  if (state.unsubscribe) {
    state.unsubscribe();
    state.unsubscribe = null;
  }
  if (state.detector && typeof state.detector.destroy === "function") {
    state.detector.destroy();
  }
  state.detector = null;
  state.started = false;
  state.loading = false;
  state.lastTickAt = 0;

  if (!keepVisualState) {
    state.snapshot = null;
    state.progressSeconds = 0;
    state.completed = false;
    state.statusMessage = "";
    state.stillPhase = "single";
    if (mode === "vision") {
      state.selectedAnswer = "";
      state.questionDirections = createVisionQuestionSet();
      state.questionIndex = 0;
      state.successLocked = false;
      state.eyeConfirmed = false;
      state.instructionStartedAt = 0;
      state.confirmStartedAt = 0;
      state.lastTargetEye = "left";
      state.requiresNeutralBeforeConfirm = false;
    }
  }
}

function restartCurrentMode() {
  if (currentMode === "home") {
    renderAll();
    return;
  }

  stopMode(currentMode, false);
  renderAll();
  window.setTimeout(() => startMode(currentMode), 0);
}

function resetAllProgress() {
  stopMode("mouth", false);
  stopMode("still", false);
  stopMode("vision", false);
  renderAll();
  if (currentMode !== "home") {
    window.setTimeout(() => startMode(currentMode), 0);
  }
}

function openMode(mode) {
  currentMode = mode;
  ["mouth", "still", "vision"].forEach((name) => {
    if (name !== mode) {
      stopMode(name, false);
    }
  });

  SCREEN_NAMES.forEach((name) => {
    const node = document.getElementById(name + "-screen");
    if (node) {
      node.classList.toggle("hidden", name !== mode);
    }
  });

  if (mode === "home") {
    window.location.hash = "#home";
    return;
  }

  window.location.hash = "#" + mode;
  if (mode === "still") {
    modeStates.still.examSelectionPending = true;
    renderAll();
    return;
  }
  ensureCamera(mode).then(() => startMode(mode)).catch(showError);
}

function mouthActive(state) {
  if (!state.snapshot?.hasFace) {
    return false;
  }

  const mode = state.settings.mouthMode || DEFAULT_SETTINGS.mouthMode;
  if (mode === "eee") {
    const widthRatio = Number(state.snapshot?.mouthWidthRatio || 0);
    const lipGapRatio = Number(state.snapshot?.lipGapRatio || 0);
    return (
      widthRatio >= Number(state.settings.mouthEeeWidthThreshold || DEFAULT_SETTINGS.mouthEeeWidthThreshold) &&
      lipGapRatio >= Number(state.settings.mouthEeeGapThreshold || DEFAULT_SETTINGS.mouthEeeGapThreshold)
    );
  }

  return Number(state.snapshot?.mouthRatio || 0) >= state.settings.mouthThreshold;
}

function getStillTotalSeconds(state) {
  if (state.settings.examType === "jibika") {
    return getStillTargetSeconds(state) * 2;
  }
  return getStillTargetSeconds(state);
}

function getStillTargetSeconds(state) {
  return state.settings.examType === "shindenzu"
    ? Number(state.settings.ecgTargetSeconds || DEFAULT_SETTINGS.ecgTargetSeconds)
    : Number(state.settings.targetSeconds || DEFAULT_SETTINGS.targetSeconds);
}

function getStillPhaseSeconds(state) {
  if (state.settings.examType !== "jibika") {
    return state.progressSeconds;
  }
  return state.stillPhase === "front"
    ? Math.min(state.progressSeconds, getStillTargetSeconds(state))
    : Math.max(0, state.progressSeconds - getStillTargetSeconds(state));
}

function isStillFrontFacing(state) {
  const yawRatio = Number(state.snapshot?.yawRatio || 0);
  return Boolean(state.snapshot?.hasFace) && yawRatio >= STILL_FRONT_YAW_MIN && yawRatio <= STILL_FRONT_YAW_MAX;
}

function isStillEarFacing(state) {
  const yawRatio = Number(state.snapshot?.yawRatio || 0);
  return (
    Boolean(state.snapshot?.hasFace) &&
    !isStillFrontFacing(state) &&
    (yawRatio <= STILL_SIDE_YAW_LEFT_MAX || yawRatio >= STILL_SIDE_YAW_RIGHT_MIN)
  );
}

function stillActive(state) {
  const hasFace = Boolean(state.snapshot?.hasFace);
  const movementOk = Number(state.snapshot?.movementScore || 1) <= state.settings.stillThreshold;
  const examType = state.settings.examType || DEFAULT_SETTINGS.examType;

  if (!hasFace) {
    return false;
  }
  if (examType === "jibika") {
    if (state.stillPhase === "front") {
      return movementOk;
    }
    return movementOk && isStillEarFacing(state);
  }
  if (examType === "shindenzu") {
    return movementOk && Boolean(state.snapshot?.bodyInFrame);
  }
  return movementOk;
}

function getVisionEyeState(snapshot, settings) {
  const leftEyeRatio = Number(snapshot?.leftEyeRatio || 0);
  const rightEyeRatio = Number(snapshot?.rightEyeRatio || 0);
  const rawLeftEyeRatio = Number(snapshot?.rawLeftEyeRatio || leftEyeRatio || 0);
  const rawRightEyeRatio = Number(snapshot?.rawRightEyeRatio || rightEyeRatio || 0);
  const threshold = Number(settings.eyeClosedThreshold || DEFAULT_SETTINGS.eyeClosedThreshold);
  const leftThreshold = threshold;
  const rightThreshold = threshold + RIGHT_EYE_THRESHOLD_BONUS;
  const leftCloseCandidate = Math.min(leftEyeRatio, rawLeftEyeRatio);
  const rightCloseCandidate = Math.min(rightEyeRatio, rawRightEyeRatio);
  const leftOpenCandidate = Math.max(leftEyeRatio, rawLeftEyeRatio);
  const rightOpenCandidate = Math.max(rightEyeRatio, rawRightEyeRatio);
  const leftClosed =
    leftCloseCandidate > 0 &&
    leftCloseCandidate < leftThreshold &&
    rightOpenCandidate > Math.max(threshold, EYE_OPEN_FLOOR) - 0.02 &&
    rightOpenCandidate - leftCloseCandidate > LEFT_EYE_CLOSED_DELTA;
  const rightClosed =
    rightCloseCandidate > 0 &&
    rightCloseCandidate < rightThreshold &&
    leftOpenCandidate > Math.max(threshold, RIGHT_EYE_OPEN_FLOOR) - 0.02 &&
    leftOpenCandidate - rightCloseCandidate > RIGHT_EYE_CLOSED_DELTA;
  const oneEyeClosed = (leftClosed && !rightClosed) || (rightClosed && !leftClosed);
  let closedEye = "none";
  if (leftClosed && !rightClosed) {
    closedEye = "left";
  } else if (rightClosed && !leftClosed) {
    closedEye = "right";
  }
  return {
    leftEyeRatio,
    rightEyeRatio,
    rawLeftEyeRatio,
    rawRightEyeRatio,
    leftCloseCandidate,
    rightCloseCandidate,
    leftOpenCandidate,
    rightOpenCandidate,
    threshold,
    leftThreshold,
    rightThreshold,
    leftClosed,
    rightClosed,
    oneEyeClosed,
    closedEye,
  };
}

function canCompleteVision(state) {
  const eyeState = getVisionEyeState(state.snapshot, state.settings);
  return (
    Boolean(state.snapshot?.hasFace) &&
    eyeState.oneEyeClosed &&
    eyeState.closedEye === getVisionTargetEye(state) &&
    state.selectedAnswer === getVisionTargetDirection(state)
  );
}

function isVisionEyeInstructionConfirmed(state) {
  const eyeState = getVisionEyeState(state.snapshot, state.settings);
  const targetEye = getVisionTargetEye(state);
  const relaxedThreshold = eyeState.threshold + 0.07;
  const occludedThreshold = 0.02;

  if (!state.snapshot?.hasFace) {
    return false;
  }

  if (eyeState.closedEye === targetEye) {
    return true;
  }

  if (targetEye === "left") {
    return (
      ((eyeState.leftCloseCandidate > 0 && eyeState.leftCloseCandidate < relaxedThreshold) ||
        eyeState.rawLeftEyeRatio <= occludedThreshold) &&
      eyeState.rightOpenCandidate > 0.08
    );
  }

  return (
    ((eyeState.rightCloseCandidate > 0 && eyeState.rightCloseCandidate < relaxedThreshold) ||
      eyeState.rawRightEyeRatio <= occludedThreshold) &&
    eyeState.leftOpenCandidate > 0.08
  );
}

function updateVisionCompletion() {
  const state = modeStates.vision;
  const eyeState = getVisionEyeState(state.snapshot, state.settings);
  const targetEye = getVisionTargetEye(state);

  if (state.lastTargetEye !== targetEye) {
    state.lastTargetEye = targetEye;
    state.eyeConfirmed = false;
    state.confirmStartedAt = 0;
    state.requiresNeutralBeforeConfirm = true;
  }

  if (state.requiresNeutralBeforeConfirm && !eyeState.oneEyeClosed) {
    state.requiresNeutralBeforeConfirm = false;
  }

  const canConfirmEye = !state.requiresNeutralBeforeConfirm;
  const confirmationDetected = canConfirmEye && isVisionEyeInstructionConfirmed(state);
  if (!state.eyeConfirmed && confirmationDetected) {
    if (!state.confirmStartedAt) {
      state.confirmStartedAt = Date.now();
    }
    if (Date.now() - state.confirmStartedAt >= VISION_EYE_CONFIRM_HOLD_MS) {
      state.eyeConfirmed = true;
    }
  } else if (!confirmationDetected) {
    state.confirmStartedAt = 0;
    state.eyeConfirmed = false;
  }
  const success = canCompleteVision(state);

  if (success && !state.successLocked) {
    state.successLocked = true;
    state.selectedAnswer = "";
    state.questionIndex += 1;
    state.eyeConfirmed = false;
    state.confirmStartedAt = 0;
    if (state.questionIndex >= state.questionDirections.length) {
      state.completed = true;
      state.progressSeconds = state.settings.targetSeconds;
      return;
    }
  }

  if (!success) {
    state.successLocked = false;
  }

  state.completed = state.questionIndex >= state.questionDirections.length;
  state.progressSeconds =
    (Math.min(state.questionIndex, state.questionDirections.length) / state.questionDirections.length) *
    state.settings.targetSeconds;
}

function tickMode(mode, now) {
  const state = modeStates[mode];
  if (!state.started) {
    return;
  }

  if (mode === "still" && state.settings.examType === "jibika") {
    const active = stillActive(state);
    const phaseSeconds = getStillTargetSeconds(state);
    const totalSeconds = getStillTotalSeconds(state);

    if (!state.lastTickAt) {
      state.lastTickAt = now;
    }

    if (state.stillPhase === "front") {
      if (active && !state.completed) {
        state.progressSeconds += (now - state.lastTickAt) / 1000;
        if (state.progressSeconds >= phaseSeconds) {
          state.progressSeconds = phaseSeconds;
          state.stillPhase = "ear";
        }
      } else if (!state.completed) {
        state.progressSeconds = 0;
      }
    } else {
      if (active && !state.completed) {
        state.progressSeconds += (now - state.lastTickAt) / 1000;
        if (state.progressSeconds >= totalSeconds) {
          state.progressSeconds = totalSeconds;
          state.completed = true;
        }
      } else if (!state.completed) {
        state.progressSeconds = phaseSeconds;
      }
    }

    state.lastTickAt = now;
    renderAll();
    state.rafId = requestAnimationFrame((nextNow) => tickMode(mode, nextNow));
    return;
  }

  const active = mode === "mouth" ? mouthActive(state) : stillActive(state);

  if (!state.lastTickAt) {
    state.lastTickAt = now;
  }

  if (active && !state.completed) {
    state.progressSeconds += (now - state.lastTickAt) / 1000;
    const targetSeconds = mode === "still" ? getStillTargetSeconds(state) : state.settings.targetSeconds;
    if (state.progressSeconds >= targetSeconds) {
      state.progressSeconds = targetSeconds;
      state.completed = true;
    }
  } else if (!state.completed) {
    state.progressSeconds = 0;
  }

  state.lastTickAt = now;
  renderAll();
  state.rafId = requestAnimationFrame((nextNow) => tickMode(mode, nextNow));
}

function updateProgress(panel, state) {
  const total = Math.max(state.settings.targetSeconds, 0.1);
  const progressValue = state === modeStates.still && state.settings.examType === "jibika" ? getStillPhaseSeconds(state) : state.progressSeconds;
  const percent = Math.max(0, Math.min(100, Math.round((progressValue / total) * 100)));
  setText(panel.progressLabel, percent + "%");
  setText(panel.timerLabel, progressValue.toFixed(1) + " / " + total + " 秒");
  setWidth(panel.progressFill, percent + "%");
  syncCompletionEffects(panel, state);
}

function updateProgressV2(panel, state) {
  const total = Math.max(state === modeStates.still ? getStillTargetSeconds(state) : state.settings.targetSeconds, 0.1);
  const progressValue = state === modeStates.still && state.settings.examType === "jibika" ? getStillPhaseSeconds(state) : state.progressSeconds;
  const percent = Math.max(0, Math.min(100, Math.round((progressValue / total) * 100)));
  setText(panel.progressLabel, percent + "%");
  setText(panel.timerLabel, progressValue.toFixed(1) + " / " + total + " 秒");
  setWidth(panel.progressFill, percent + "%");
  syncCompletionEffects(panel, state);
}

function renderMouth() {
  renderMouthV2();
}

function renderMouthV2() {
  const state = modeStates.mouth;
  const mode = state.settings.mouthMode || DEFAULT_SETTINGS.mouthMode;
  const ratio = Number(state.snapshot?.mouthRatio || 0);
  const widthRatio = Number(state.snapshot?.mouthWidthRatio || 0);
  const gapRatio = Number(state.snapshot?.lipGapRatio || 0);
  const hasFace = Boolean(state.snapshot?.hasFace);
  const isMock = state.snapshot?.source === "mock";
  const active = mouthActive(state);
  const widthOk = widthRatio >= Number(state.settings.mouthEeeWidthThreshold || DEFAULT_SETTINGS.mouthEeeWidthThreshold);
  const gapOk = gapRatio >= Number(state.settings.mouthEeeGapThreshold || DEFAULT_SETTINGS.mouthEeeGapThreshold);
  const almost =
    mode === "eee"
      ? hasFace &&
        widthRatio >= Number(state.settings.mouthEeeWidthThreshold || DEFAULT_SETTINGS.mouthEeeWidthThreshold) * 0.84 &&
        gapRatio >= Number(state.settings.mouthEeeGapThreshold || DEFAULT_SETTINGS.mouthEeeGapThreshold) * 0.8
      : hasFace && ratio >= state.settings.mouthThreshold * 0.7;

  setText(ui.mouth.providerChip, state.loading ? "じゅんびちゅう" : state.snapshot?.providerLabel || "じゅんびOK");
  setText(ui.mouth.providerHelp, "");
  setText(
    ui.mouth.detectorState,
    state.completed
      ? "じょうず"
      : !hasFace
        ? "かおまち"
        : active
          ? mode === "eee"
            ? "イー OK"
            : "アー OK"
          : almost
            ? "あとすこし"
            : isMock
              ? "れんしゅう"
              : "みつけた",
  );
  setText(
    ui.mouth.promptText,
    state.loading
      ? "おくち の AI を じゅんびしています。"
      : state.completed
        ? SUCCESS_MESSAGE
        : !hasFace
          ? "かおを わくに あわせてください。"
          : active
            ? mode === "eee"
              ? "はを みせて イー を そのまま きーぷ。"
              : "そのまま きーぷ。"
            : isMock
              ? mode === "eee"
                ? "ぼたんを はなすと イー の れんしゅうが できます。"
                : "ぼたんを おして アー の れんしゅうが できます。"
              : almost
                ? mode === "eee"
                  ? "そのまま はを みせて よこに ひいてください。"
                  : "あと すこしだけ おおきく あけてください。"
                : mode === "eee"
                  ? "はを みせて、すこし たてにも あけて イー を してみよう。"
                  : "おくち を ひらいてください。",
  );
  setText(
    ui.mouth.scoreLabel,
    mode === "eee"
      ? "イー: よこ " +
          widthRatio.toFixed(2) +
          " / " +
          Number(state.settings.mouthEeeWidthThreshold).toFixed(2) +
          " (" +
          (widthOk ? "OK" : "NG") +
          ")" +
          " ・ たて " +
          gapRatio.toFixed(2) +
          " / " +
          Number(state.settings.mouthEeeGapThreshold).toFixed(2) +
          " (" +
          (gapOk ? "OK" : "NG") +
          ")"
      : "アー: " + ratio.toFixed(2) + " / " + Number(state.settings.mouthThreshold).toFixed(2),
  );
  ui.mouth.manualTrigger.classList.toggle("hidden", !isMock);
  ui.mouth.face.classList.toggle("face-circle-coaching", hasFace && !active && !state.completed);
  ui.mouth.face.classList.toggle("face-circle-happy", active || state.completed);
  ui.mouth.face.classList.toggle("face-circle-eee", mode === "eee");
  ui.mouth.mouthShape.classList.toggle("illustration-mouth-almost", mode !== "eee" && !active && almost);
  ui.mouth.mouthShape.classList.toggle("illustration-mouth-open", mode !== "eee" && active);
  ui.mouth.mouthShape.classList.toggle("illustration-mouth-eee-almost", mode === "eee" && !active && almost);
  ui.mouth.mouthShape.classList.toggle("illustration-mouth-eee", mode === "eee" && active);
  ui.mouth.mouthShape.classList.toggle("illustration-mouth-done", state.completed);
  updateProgressV2(ui.mouth, state);
}

function renderStill() {
  renderStillV4();
}

function renderStillV2() {
  renderStillV4();
}

function renderStillV3() {
  renderStillV4();
}

function renderStillV4() {
  const state = modeStates.still;
  const score = Number(state.snapshot?.movementScore || 1);
  const hasFace = Boolean(state.snapshot?.hasFace);
  const isMock = state.snapshot?.source === "mock";
  const active = stillActive(state);
  const examType = state.settings.examType || DEFAULT_SETTINGS.examType;

  ui.stillExamChooser.classList.toggle("hidden", !state.examSelectionPending);
  ui.stillLayout.classList.toggle("hidden", state.examSelectionPending);
  if (state.examSelectionPending) {
    return;
  }

  renderStillGuideFrame(examType, state.stillPhase);
  setText(ui.still.providerChip, state.loading ? "じゅんびちゅう" : state.snapshot?.providerLabel || "じゅんびOK");
  setText(ui.still.providerHelp, "");
  setText(ui.still.cameraState, hasFace ? "かめら OK" : "かおまち");
  setText(ui.still.cameraHelp, "かおを わくに あわせてください。");
  setText(
    ui.still.detectorState,
    state.completed ? "できた" : !hasFace ? "かおまち" : active ? "じっとできた" : isMock ? "れんしゅう" : "うごき中",
  );
  setText(
    ui.still.promptText,
    state.completed
      ? SUCCESS_MESSAGE
      : !hasFace
        ? "かおを わくに あわせてください。"
        : active
          ? "そのまま きーぷ。"
          : isMock
            ? "ぼたんを おして じっとする れんしゅうが できます。"
            : "じっと してみよう。",
  );
  setText(ui.still.scoreLabel, "うごき " + score.toFixed(4) + " / " + Number(state.settings.stillThreshold).toFixed(4));
  ui.still.manualTrigger.classList.toggle("hidden", !isMock);
  updateProgressV2(ui.still, state);
}

function renderStillV5() {
  const state = modeStates.still;
  if (state.settings.examType !== "jibika" || state.examSelectionPending) {
    return;
  }

  const score = Number(state.snapshot?.movementScore || 1);
  const hasFace = Boolean(state.snapshot?.hasFace);
  const active = stillActive(state);
  const earFacing = isStillEarFacing(state);
  const phaseSeconds = getStillPhaseSeconds(state);
  const phasePercent = Math.max(0, Math.min(100, Math.round((phaseSeconds / Math.max(state.settings.targetSeconds, 0.1)) * 100)));

  if (state.stillPhase === "front") {
    setText(ui.still.cameraHelp, "まず まっすぐ がめんを みよう。");
    setText(ui.still.detectorState, active ? "はな OK" : !hasFace ? "かおまち" : "正面まち");
    setText(ui.still.promptText, state.completed ? SUCCESS_MESSAGE : active ? "そのまま きーぷ。" : "まず まっすぐ がめんを みよう。");
  } else {
    setText(ui.still.cameraHelp, "よこを むいて みみを みせよう。");
    setText(ui.still.detectorState, active ? "みみ OK" : !hasFace ? "かおまち" : !earFacing ? "横向き NG" : "うごき中");
    setText(ui.still.promptText, state.completed ? SUCCESS_MESSAGE : active ? "そのまま きーぷ。" : !earFacing ? "よこを むいて みみを みせよう。" : "じっと してね。");
  }
  setText(ui.still.scoreLabel, "うごき " + score.toFixed(4) + " / " + Number(state.settings.stillThreshold).toFixed(4) + " | みみ: " + (earFacing ? "OK" : "NG"));
  setText(ui.still.progressLabel, (state.stillPhase === "front" ? "はな" : "みみ") + " " + phasePercent + "%");
  setText(ui.still.timerLabel, phaseSeconds.toFixed(1) + " / " + state.settings.targetSeconds + " 秒");
  setWidth(ui.still.progressFill, phasePercent + "%");
}

function renderStillV6() {
  const state = modeStates.still;
  if (state.settings.examType !== "shindenzu" || state.examSelectionPending) {
    ui.still.heartFaceFrame.classList.add("hidden");
    return;
  }

  const score = Number(state.snapshot?.movementScore || 1);
  const hasFace = Boolean(state.snapshot?.hasFace);
  const active = stillActive(state);
  const bodyInFrame = Boolean(state.snapshot?.bodyInFrame);

  ui.still.heartFaceFrame.classList.remove("hidden");
  setText(ui.still.cameraHelp, "ひだりに あたま、みぎに あしで、わくに おさまるように よこになりましょう。");
  setText(ui.still.detectorState, active ? "わく OK" : !hasFace ? "かおまち" : !bodyInFrame ? "わく外" : "うごき中");
  setText(
    ui.still.promptText,
    state.completed
      ? SUCCESS_MESSAGE
      : active
        ? "そのまま きーぷ。"
        : !bodyInFrame
          ? "わくに おさまるように よこになりましょう。"
          : "わく OK。うごかないで じっと しよう。",
  );
  setText(ui.still.scoreLabel, "うごき " + score.toFixed(4) + " / " + Number(state.settings.stillThreshold).toFixed(4) + " | わく: " + (bodyInFrame ? "OK" : "NG"));
}

function renderVision() {
  const state = modeStates.vision;
  const hasFace = Boolean(state.snapshot?.hasFace);
  const isMock = state.snapshot?.source === "mock";
  const eyeState = getVisionEyeState(state.snapshot, state.settings);
  const targetDirection = getVisionTargetDirection(state);
  const targetEye = getVisionTargetEye(state);
  const answeredCount = getVisionAnsweredCount(state);
  const correct = state.selectedAnswer && state.selectedAnswer === targetDirection;
  const eyeMatched = eyeState.closedEye === targetEye;
  const readyForQuestion = hasFace && state.eyeConfirmed;

  setText(ui.vision.providerChip, state.loading ? "じゅんびちゅう" : state.snapshot?.providerLabel || "じゅんびOK");
  setText(ui.vision.providerHelp, "");
  setText(
    ui.vision.detectorState,
    state.completed ? "できた" : !hasFace ? "かおまち" : !eyeState.oneEyeClosed ? "目まち" : !eyeMatched ? "ちがう目" : !state.selectedAnswer ? "こたえまち" : correct ? "せいかい" : "ちがう",
  );
  setText(
    ui.vision.promptText,
    state.completed
      ? SUCCESS_MESSAGE
      : !hasFace
        ? "かおを わくに あわせてください。"
        : !eyeState.oneEyeClosed
          ? isMock
            ? "ぼたんを おして かためを とじる れんしゅうが できます。"
            : targetEye === "left"
              ? "ひだりめ を とじてください。"
              : "みぎめ を とじてください。"
          : !eyeMatched
            ? targetEye === "left"
              ? "ひだりめ を とじてください。"
              : "みぎめ を とじてください。"
            : !state.selectedAnswer
              ? "C の あいている むきを えらんでください。"
              : correct
                ? "せいかい。つぎへ すすみます。"
                : "ちがう むきです。もういちど えらんでください。",
  );
  setText(ui.vision.scoreLabel, answeredCount + " / " + state.questionDirections.length + " もん");
  ui.vision.eyeCoach.classList.toggle("target-left", targetEye === "left");
  ui.vision.eyeCoach.classList.toggle("target-right", targetEye === "right");
  ui.vision.eyeCoach.classList.toggle("hidden", state.completed || readyForQuestion);
  ui.vision.eyeCoach.innerHTML = getVisionCoachSvg(targetEye);
  ui.vision.landolt.classList.toggle("is-visible", readyForQuestion && !state.completed);
  ui.vision.answerGrid.classList.toggle("is-visible", readyForQuestion && !state.completed);
  ui.vision.debugLabel.classList.add("hidden");
  ui.vision.manualTrigger.classList.toggle("hidden", !isMock);
  ui.vision.landolt.classList.remove("landolt-up", "landolt-right", "landolt-down", "landolt-left");
  ui.vision.landolt.classList.add("landolt-" + targetDirection);
  ui.vision.answerButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.answer === state.selectedAnswer);
  });
  setText(ui.vision.progressLabel, answeredCount + " / " + state.questionDirections.length);
  setText(ui.vision.timerLabel, state.completed ? "おわり" : (targetEye === "left" ? "ひだりめ " : "みぎめ ") + ((answeredCount % 4) + 1) + " / 4");
  setWidth(ui.vision.progressFill, (answeredCount / state.questionDirections.length) * 100 + "%");
  syncCompletionEffects(ui.vision, state);
}
function renderAll() {
  renderMouthV2();
  renderStillV4();
  renderStillV5();
  renderStillV6();
  renderVision();
  if (modeStates.mouth.completed) {
    setText(ui.mouth.promptText, SUCCESS_MESSAGE);
  }
  if (modeStates.still.completed) {
    setText(ui.still.promptText, SUCCESS_MESSAGE);
  }
  if (modeStates.vision.completed) {
    setText(ui.vision.promptText, SUCCESS_MESSAGE);
  }
  updateReadinessStatus();
}

async function startMode(mode) {
  const state = modeStates[mode];
  if (state.loading || state.detector) {
    return;
  }
  if (mode === "still" && state.examSelectionPending) {
    return;
  }

  clearError();
  state.loading = true;
  state.started = true;
  state.snapshot = null;
  state.progressSeconds = 0;
  state.completed = false;
  state.lastTickAt = 0;
  state.settings = readSettings();
  state.stillPhase = state.settings.examType === "jibika" ? "front" : "single";
  if (mode === "vision") {
    state.questionDirections = createVisionQuestionSet();
    state.questionIndex = 0;
    state.selectedAnswer = "";
    state.successLocked = false;
    state.eyeConfirmed = false;
    state.instructionStartedAt = 0;
    state.confirmStartedAt = 0;
    state.lastTargetEye = "left";
    state.requiresNeutralBeforeConfirm = false;
  }
  state.statusMessage = "";
  renderAll();

  try {
    if (window.location.protocol === "file:") {
      if (mode === "mouth") {
        state.detector = new LocalMockMouthDetector(ui.mouth.manualTrigger);
      } else if (mode === "still") {
        state.detector = new LocalMockStillDetector(ui.still.manualTrigger);
      } else {
        state.detector = new LocalMockVisionDetector(ui.vision.manualTrigger);
      }
      state.statusMessage = "File launch detected. Using mock detector.";
    } else {
      const moduleUrl = new URL("./detectors/create-" + mode + "-detector.js", window.location.href).href;
      const module = await import(moduleUrl);
      const createFn =
        mode === "mouth"
          ? module.createMouthDetector
          : mode === "still"
            ? module.createStillDetector
            : module.createVisionDetector;
      const panel = ui[mode];
      state.detector = await createFn({
        button: panel.manualTrigger,
        video: panel.video,
        examType: state.settings.examType,
        eyeClosedThreshold: state.settings.eyeClosedThreshold,
        onStatus(message) {
          state.statusMessage = message;
          renderAll();
        },
      });
    }

    state.unsubscribe = state.detector.subscribe((snapshot) => {
      state.snapshot = snapshot;
      if (mode === "vision") {
        updateVisionCompletion();
      }
      renderAll();
    });
    if (mode !== "vision") {
      state.rafId = requestAnimationFrame((now) => tickMode(mode, now));
    }
  } catch (error) {
    state.statusMessage = error instanceof Error ? error.message : String(error);
    showError(error);
  } finally {
    state.loading = false;
    renderAll();
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then(updateCacheStatus).catch(() => {
      setText(ui.cacheStatus, "cache ふめい");
    });
  });
}

function bindSlider(input, output, digits) {
  input.addEventListener("input", () => {
    output.value = digits === 0 ? String(Number(input.value)) : Number(input.value).toFixed(digits);
  });
}

function installEvents() {
  ui.startMouthMode.addEventListener("click", () => openMode("mouth"));
  ui.startStillMode.addEventListener("click", () => openMode("still"));
  ui.startVisionMode.addEventListener("click", () => openMode("vision"));
  ui.backHomeMouth.addEventListener("click", () => openMode("home"));
  ui.backHomeStill.addEventListener("click", () => openMode("home"));
  ui.backHomeVision.addEventListener("click", () => openMode("home"));
  ui.settingsTriggerMouth.addEventListener("click", openSettings);
  ui.settingsTriggerStill.addEventListener("click", openSettings);
  ui.settingsTriggerVision.addEventListener("click", openSettings);
  ui.closeSettings.addEventListener("click", closeSettings);
  ui.saveSettings.addEventListener("click", async () => {
    try {
      const settings = readSettingsForm();
      saveSettings(settings);
      pendingStillImageDataUrl = null;
      refreshSettings();
      closeSettings();
      restartCurrentMode();
    } catch (error) {
      showError(error);
    }
  });
  ui.resetProgress.addEventListener("click", () => {
    closeSettings();
    resetAllProgress();
  });
  ui.vision.answerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      modeStates.vision.selectedAnswer = button.dataset.answer || "";
      updateVisionCompletion();
      renderAll();
    });
  });
  ui.stillImage.addEventListener("change", async () => {
    const file = ui.stillImage.files && ui.stillImage.files[0];
    if (!file) {
      return;
    }
    try {
      pendingStillImageDataUrl = await optimizeStillImageDataUrl(await readFileAsDataUrl(file));
      updateStillImagePreview(pendingStillImageDataUrl);
    } catch (error) {
      showError(error);
    }
  });
  ui.clearStillImage.addEventListener("click", () => {
    pendingStillImageDataUrl = "";
    ui.stillImage.value = "";
    updateStillImagePreview(getDefaultStillPromptImage(readSettings().examType || DEFAULT_SETTINGS.examType));
  });
  ui.mouth.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMouthMode(button.dataset.mouthMode || "open");
    });
  });
  ui.stillExamChoiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const examType = button.dataset.examChoice || DEFAULT_SETTINGS.examType;
      const nextSettings = { ...readSettings(), examType };
      saveSettings(nextSettings);
      pendingStillImageDataUrl = null;
      refreshSettings();
      modeStates.still.examSelectionPending = false;
      ensureCamera("still").then(() => startMode("still")).catch(showError);
    });
  });
  bindSlider(ui.targetSeconds, ui.targetSecondsValue, 0);
  bindSlider(ui.ecgTargetSeconds, ui.ecgTargetSecondsValue, 0);
  bindSlider(ui.mouthThreshold, ui.mouthThresholdValue, 2);
  bindSlider(ui.mouthEeeWidthThreshold, ui.mouthEeeWidthThresholdValue, 2);
  bindSlider(ui.mouthEeeGapThreshold, ui.mouthEeeGapThresholdValue, 2);
  bindSlider(ui.stillThreshold, ui.stillThresholdValue, 3);
  bindSlider(ui.eyeThreshold, ui.eyeThresholdValue, 2);
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  window.addEventListener("error", (event) => showError(event.error || event.message || "unknown error"));
  window.addEventListener("unhandledrejection", (event) => showError(event.reason || "promise rejected"));
}

function initFromHash() {
  const hash = (window.location.hash || "#home").replace(/^#/, "");
  if (hash === "mouth" || hash === "still" || hash === "vision") {
    openMode(hash);
  } else {
    openMode("home");
  }
}

function init() {
  ensureVisionEyeCoach();
  applySuccessCopy();
  applyTeacherSettingsLabels();
  refreshSettings();
  updateNetworkStatus();
  updateCacheStatus();
  installEvents();
  clearServiceWorkerCaches();
  initFromHash();
}

init();

