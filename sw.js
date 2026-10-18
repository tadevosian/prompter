// Хранит копию суфлёра в телефоне, чтобы он открывался и без интернета.
// Отдаёт сохранённую версию сразу, а свежую скачивает в фоне — она появится при следующем запуске.
const CACHE = 'prompter-v1';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Для открытия страницы всегда берём адрес без параметров: текст из «Поделиться» не уходит в сеть
  const key = e.request.mode === 'navigate' ? new URL('./', location).href : url.origin + url.pathname;
  const network = fetch(key)
    .then(async res => {
      if (res.ok) await (await caches.open(CACHE)).put(key, res.clone());
      return res;
    })
    .catch(() => null);
  e.respondWith(
    caches.match(key).then(cached => cached || network.then(res => res || new Response('Нет сети', { status: 503 })))
  );
  e.waitUntil(network);
});
