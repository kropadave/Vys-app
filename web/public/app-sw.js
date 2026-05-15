const CACHE_NAME = 'teamvys-role-app-v2';
const SHELL_ASSETS = ['/app/sign-in', '/app/ucastnik', '/app/trener', '/app/manifest.webmanifest', '/vys-logo-mark.png', '/vys-logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (!url.pathname.startsWith('/app/') && !url.pathname.startsWith('/_next/') && !url.pathname.startsWith('/vys-logo')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/app/sign-in')));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});