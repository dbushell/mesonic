import {build, version} from '$service-worker';

const cacheName = `svelte-${version}`;

const preCache = ['/', ...build];

self.addEventListener('install', (ev) => {
  console.log(`install`);
  self.skipWaiting();
  ev.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(preCache)));
});

self.addEventListener('activate', (ev) => {
  console.log(`activate`);
  ev.waitUntil(self.clients.claim());
  ev.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== cacheName) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

const fromCache = (request) =>
  caches.open(cacheName).then((cache) => cache.match(request));

const updateCache = (request, response) =>
  caches.open(cacheName).then((cache) => cache.put(request, response));

const fetchAndCache = (ev) =>
  fetch(ev.request)
    .then((response) => {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      ev.waitUntil(updateCache(ev.request, response.clone()));
      return response;
    })
    .catch((err) => {
      console.log(err);
    });

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET') {
    console.log(`bypass cache: ${url.pathname}`);
    return;
  }
  if (/^\/(|\.svelte-kit|src|data|rest)\//.test(url.pathname)) {
    console.log(`bypass cache: ${url.pathname}`);
    return;
  }
  ev.respondWith(
    fromCache(ev.request).then((response) => {
      if (response) {
        console.log(`from cache: ${url.pathname}`);
        ev.waitUntil(fetchAndCache(ev));
        return response;
      }
      console.log(`from fetch: ${url.pathname}`);
      return fetchAndCache(ev);
    })
  );
});
