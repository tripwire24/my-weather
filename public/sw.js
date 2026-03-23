/**
 * StormGrid Service Worker
 * Handles offline caching of weather data and app shell
 */

const CACHE_NAME = 'stormgrid-v1';
const WEATHER_CACHE_NAME = 'stormgrid-weather-v1';

// App shell — static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== WEATHER_CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Open-Meteo API calls — network-first, fallback to cache
  if (
    url.hostname === 'api.open-meteo.com' ||
    url.hostname === 'air-quality-api.open-meteo.com' ||
    url.hostname === 'geocoding-api.open-meteo.com' ||
    url.hostname === 'nominatim.openstreetmap.org'
  ) {
    event.respondWith(networkFirstWithCache(request, WEATHER_CACHE_NAME, 5 * 60 * 1000)); // 5 min TTL
    return;
  }

  // Google Fonts — cache first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Next.js app routes / static assets — stale-while-revalidate
  if (request.destination === 'document' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Network-first with fallback cache + TTL
async function networkFirstWithCache(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);

    if (networkResponse.ok) {
      // Clone and store with timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('x-sw-cached-at', Date.now().toString());

      const body = await responseToCache.blob();
      const cachedResponse = new Response(body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }

    return networkResponse;
  } catch (_) {
    // Network failed — try cache
    const cached = await cache.match(request);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('x-sw-cached-at') || '0');
      const age = Date.now() - cachedAt;

      if (age < ttlMs * 6) { // Accept up to 6x TTL for offline
        return cached;
      }
    }

    return new Response(JSON.stringify({ error: 'Offline — no cached data available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Stale-while-revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || networkPromise;
}
