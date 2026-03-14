const CACHE_NAME = "kenshin-dekitayo-v97";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js?build=v97",
  "./assets/top-hero-doctor.png",
  "./assets/course-still-mouth.png",
  "./assets/course-vision.png",
  "./assets/course-still-crop.png",
  "./assets/course-mouth-crop.png",
  "./assets/course-vision-crop.png",
  "./assets/still-default-naika.png",
  "./assets/still-default-jibika.png",
  "./assets/still-default-ganka.png",
  "./assets/still-default-shindenzu.png",
  "./settings.js",
  "./detectors/create-mouth-detector.js",
  "./detectors/create-still-detector.js",
  "./detectors/create-vision-detector.js",
  "./detectors/mediapipe-mouth-detector.js",
  "./detectors/mediapipe-still-detector.js",
  "./detectors/mediapipe-vision-detector.js",
  "./detectors/mock-mouth-detector.js",
  "./detectors/mock-still-detector.js",
  "./detectors/mock-vision-detector.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./vendor/mediapipe/face_landmarker.task",
  "./vendor/mediapipe/vision_bundle.mjs",
  "./vendor/mediapipe/wasm/vision_wasm_internal.js",
  "./vendor/mediapipe/wasm/vision_wasm_internal.wasm",
  "./vendor/mediapipe/wasm/vision_wasm_nosimd_internal.js",
  "./vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm",
];

const NETWORK_FIRST_ASSETS = new Set([
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/settings.js",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const normalizedPath = requestUrl.pathname;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", responseClone));
          return response;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }

  if (NETWORK_FIRST_ASSETS.has(normalizedPath)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
