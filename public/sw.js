self.addEventListener('install', (e) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Claim any clients immediately, so the page is controlled by this SW without a reload.
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Minimal fetch handler: bypass caching for simplicity in MVP.
  // It simply passes the request to the network.
  e.respondWith(fetch(e.request));
});
