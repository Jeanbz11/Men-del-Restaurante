const CACHE_NAME = 'alexita-pos-v1';
const assets = [
  '/',
  '/index.html',
  '/admin.html',
  '/gestion.html',
  '/script.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalar el Service Worker y guardar archivos en la caché del teléfono
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Interceptar las peticiones para cargar desde la caché si no hay internet
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request);
    })
  );
});