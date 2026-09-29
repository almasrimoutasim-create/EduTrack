// Self-unregistering service worker.
//
// Why this file exists:
//   An older build used `vite-plugin-pwa` (removed from vite.config.js in
//   commit 3ff4ea7) which generated a service worker at /sw.js that precached
//   the ENTIRE app shell (index.html + every hashed asset) with a CacheFirst
//   strategy. Browsers that visited during that period still have that worker
//   installed and keep serving the stale bundle on every visit — so app
//   updates appeared to "never apply" no matter how many times we rebuilt.
//
//   Serving *new* bytes at the same /sw.js URL makes the browser install this
//   file as an update to the existing registration. This worker then wipes
//   every cache it finds and unregisters itself, leaving the page uncontrolled
//   so the next load fetches the fresh build from the network.
//
// It is intentionally tiny: no precaching, no interception, no runtime caching.

self.addEventListener('install', (event) => {
  // Activate immediately instead of waiting for all tabs to close.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Drop every CacheStorage entry (the stale precache lives here).
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // 2. Drop the registration entirely. Because the script URL is the same
      //    (/sw.js), this removes the stale worker's registration too.
      await self.registration.unregister();
    })()
  );
});

// Never serve anything from a cache — always hit the network.
// (This worker should be gone within one load anyway.)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
