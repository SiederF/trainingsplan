/**
 * sw.js — Service Worker. Macht die App installierbar und offlinefaehig.
 *
 * Strategie: Alle eigenen Dateien werden bei der Installation in einen
 * versionierten Cache gelegt und von dort bedient (cache first). Bei
 * jeder neuen Version die CACHE-Konstante hochzaehlen, dann raeumt der
 * activate-Schritt die alten Caches auf.
 */

const CACHE = 'trainingsplan-v1';

const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './css/tokens.css', './css/base.css', './css/layout.css', './css/components.css',
  './js/app.js',
  './js/data/exercises.js', './js/data/plan.js',
  './js/core/storage.js', './js/core/progression.js', './js/core/schedule.js',
  './js/core/timer.js', './js/core/wakelock.js', './js/core/sound.js', './js/core/workout.js',
  './js/ui/dom.js', './js/ui/planView.js', './js/ui/runnerView.js',
  './js/ui/timerOverlay.js', './js/ui/progressView.js',
  './assets/icon-192.png', './assets/apple-touch-icon-180.png', './assets/icon-512.png', './assets/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Fremde Quellen (Schriftart) nur durchreichen und nebenbei cachen.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
