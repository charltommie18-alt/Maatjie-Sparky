// Development preview only. Cache only the immutable, explicitly listed app shell.
// Never cache account pages, auth, API calls, user data or arbitrary network responses.
const CACHE = 'slim-maat-preview-shell-v2';
const root = new URL('./', self.location.href);
const assets = [
  './', './index.html', './preview.css', './preview.js', './pwa.js', './manifest.webmanifest', './icon.svg',
  '../chatSession.js', '../conversationHistory.js', '../chatClient.js',
  '../../../public/pwa-192x192.png', '../../../public/pwa-512x512.png'
].map(path => new URL(path, root).href);
const allowed = new Set(assets);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      for (const url of assets) {
        const response = await fetch(url, { cache: 'reload', credentials: 'same-origin' });
        const type = response.headers.get('content-type') || '';
        const mime = type.toLowerCase().split(';')[0].trim();
        const expected = url.endsWith('/') || url.endsWith('.html') ? ['text/html'] :
          url.endsWith('.js') ? ['text/javascript', 'application/javascript', 'application/x-javascript'] :
          url.endsWith('.css') ? ['text/css'] : url.endsWith('.png') ? ['image/png'] :
          url.endsWith('.svg') ? ['image/svg+xml'] : ['application/manifest+json', 'application/json'];
        if (!response.ok || response.redirected || !expected.includes(mime)) {
          throw new Error('Invalid preview shell asset');
        }
        await cache.put(url, response);
      }
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('slim-maat-preview-shell-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== root.origin || url.search || !allowed.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request.url);
    return cached || fetch(request);
  })());
});
