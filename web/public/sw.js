const LEGACY_CACHE_NAMES = ['teamvys-online-app-v1'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => LEGACY_CACHE_NAMES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
  );
  self.clients.claim();
});