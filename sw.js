const CACHE_NAME = 'zlon-app-shell-v3';
const APP_SHELL = [
    '/',
    '/index.html',
    '/apply.html',
    '/login.html',
    '/supabase-config.js',
    '/supabase-client.js',
    '/auth-routes.js',
    '/pwa.js',
    '/manifest.json',
    '/business-manifest.json',
    '/site.webmanifest',
    '/favicon.png',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/logo-192.png',
    '/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const requestUrl = new URL(request.url);
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(request, requestUrl));
        return;
    }

    if (requestUrl.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
    }
});

async function handleNavigation(request, requestUrl) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const fallback = requestUrl.pathname === '/login.html' ? '/login.html' : '/index.html';

        return caches.match(fallback);
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
    }

    return response;
}
