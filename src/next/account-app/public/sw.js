/* Isolated account app: only the generic offline page is stored, never sessions or user data. */
const CACHE = 'slim-maat-account-offline-v2';
const OFFLINE = new URL('offline.html', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Construct a fixed generic page rather than caching a server response that
    // could contain user-specific content, even if its title looks correct.
    const html = '<!doctype html><html lang="af"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slim Maat is vanlyn</title><meta name="robots" content="noindex,nofollow"></head><body><main><h1>Slim Maat is vanlyn</h1><p>Koppel weer aan die internet en probeer weer. Aanmelding en rekeningdienste werk nie vanlyn nie.</p><p>Dit is ’n private ontwikkelweergawe. Die regte AI is nog nie gekoppel nie.</p></main></body></html>';
    const cache = await caches.open(CACHE);
    await cache.put(OFFLINE, new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }));
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
    // Avoid the browser HTTP cache as well as Cache Storage for controlled navigations.
    // The hosting server must still send private/no-store headers for every response.
    try { return await fetch(request, { cache: 'no-store' }); }
    catch { return (await (await caches.open(CACHE)).match(OFFLINE)) || Response.error(); }
  })());
});
