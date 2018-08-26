// Update service worker on page refresh
// https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68
addEventListener('fetch', event => {
  event.respondWith((async () => {
    if (event.request.mode === "navigate" && event.request.method === "GET" && registration.waiting && (await clients.matchAll()).length < 2) {
      registration.waiting.postMessage('skipWaiting');
      return new Response("", {headers: {"Refresh": "0"}});
    }
    return await caches.match(event.request) || fetch(event.request);
  })());
});
addEventListener('message', e => {
  if (e.data === 'skipWaiting') {
    skipWaiting();
  }
});
//workbox.setConfig({ debug: true });

// Cache map tiles
workbox.routing.registerRoute(
  new RegExp('https://(?:a|b|c).tile.openstreetmap.org/.*\.png'),
  workbox.strategies.cacheFirst({
    cacheName: 'tile-cache',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 20000,
        maxAgeSeconds: 7 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      })
    ],
  })
);

workbox.precaching.precacheAndRoute(self.__precacheManifest || []);
