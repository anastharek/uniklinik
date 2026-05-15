#!/bin/bash
# Post-build: overwrite webpack-generated SW files with passthrough versions
# Run after every yarn build

DIST="platform/viewer/dist"
SW="$DIST/sw.js"
INIT="$DIST/init-service-worker.js"

cat > "$SW" << 'SWEOF'
// PadiMedical: passthrough service worker - no caching
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) { return caches.delete(key); }));
    }).then(function() { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
SWEOF

cat > "$INIT" << 'INITEOF'
// PadiMedical: simple SW registration, no caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(reg) { reg.unregister(); });
      var swPath = (window.PUBLIC_URL || '/') + 'sw.js';
      navigator.serviceWorker.register(swPath).then(function() {
        console.log('SW: registered passthrough');
      }).catch(function(err) {
        console.log('SW: registration failed', err);
      });
    });
  });
}
INITEOF

echo "SW: passthrough applied"
