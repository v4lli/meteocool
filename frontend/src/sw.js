workbox.setConfig({ debug: false });

// Update service worker on page refresh
addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    skipWaiting();
  }
});

// Cache map tiles
workbox.routing.registerRoute(
  new RegExp("https://(?:a|b|c).(?:tile.openstreetmap.org|basemaps.cartocdn.com)/.*.png"),
  new workbox.strategies.CacheFirst({
    cacheName: "tile-cache",
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 20000,
        maxAgeSeconds: 7 * 24 * 60 * 60,
        purgeOnQuotaError: true
      })
    ]
  })
);

workbox.precaching.precacheAndRoute(self.__precacheManifest || []);
