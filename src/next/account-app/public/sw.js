/* Isolated account app: only the generic offline page is stored, never sessions or user data. */
const CACHE = 'slim-maat-account-offline-v1';
const OFFLINE = new URL('offline.html', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(OFFLINE, { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Offline page unavailable');
    const html = await response.clone().text();
    if (!html.includes('<title>Slim Maat is vanlyn</title>')) throw new Error('Unexpected offline page');
    const cache = await caches.open(CACHE);
    await cache.put(OFFLINE, response);
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('slim-maat-account-offline-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith((async () => {
    try { return await fetch(request); }
    catch { return (await (await caches.open(CACHE)).match(OFFLINE)) || Response.error(); }
  })());
});
