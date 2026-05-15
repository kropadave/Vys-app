const CACHE_NAME = 'teamvys-app-v3-zero-progress';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((clients) => {
        for (const client of clients) {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) client.navigate(client.url);
        }
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(
        () => new Response('TeamVYS aplikace je momentálně offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      )
    );
    return;
  }

  if (url.pathname === '/meta.json') {
    event.respondWith(new Response('{"name":"TeamVYS aplikace"}\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } }));
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/pwa/') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webmanifest');

  if (!isStaticAsset) return;

  event.respondWith(
    fetch(request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
