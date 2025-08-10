
const CACHE = 'opendoor-update-v1';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./manifest.webmanifest',
  './assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png','./assets/logo-black.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
