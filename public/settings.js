const STORAGE_KEY = "kenshin-dekitayo.settings";

export const defaultSettings = {
  targetSeconds: 5,
  mouthThreshold: 0.56,
  stillThreshold: 0.018,
  eyeClosedThreshold: 0.19,
  muted: false,
  hideCamera: false,
  examType: "naika",
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultSettings };
    }

    return {
      ...defaultSettings,
      ...JSON.parse(raw),
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
