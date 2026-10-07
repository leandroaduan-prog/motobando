// MotoBando — service worker: app abre sem sinal e guarda os pedaços de mapa já vistos
const APP = 'mb-app-v1', TILES = 'mb-tiles-v1', MAX_TILES = 4000;
const SHELL = ['/', '/index.html', '/style.css', '/app.js', '/geo.js', '/data.js', '/vendor/leaflet.js', '/vendor/leaflet.css', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![APP, TILES].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function trimTiles() { const c = await caches.open(TILES); const keys = await c.keys(); if (keys.length > MAX_TILES) for (const k of keys.slice(0, keys.length - MAX_TILES)) await c.delete(k); }
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname === 'tile.openstreetmap.org') {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok) { c.put(e.request, r.clone()); if (Math.random() < 0.02) trimTiles(); } return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (u.origin === location.origin && !u.pathname.startsWith('/api/') && !u.pathname.startsWith('/ws')) {
    // rede primeiro (pega versão nova), cache se estiver sem sinal
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(APP).then(c => c.put(u.pathname.startsWith('/r/') ? '/index.html' : e.request, cp)); } return r; })
      .catch(() => caches.match(u.pathname.startsWith('/r/') ? '/index.html' : e.request).then(r => r || caches.match('/index.html'))));
  }
});
