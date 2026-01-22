const CACHE_NAME = 'aafgest-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/admin.html',
  '/entregas.html',
  '/stock.html',
  '/equipa.html',
  '/datas.html',
  '/perfil.html',
  '/condutor.html',
  '/style.css',
  '/img/logoAAF.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});