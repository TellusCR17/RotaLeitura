const CACHE_NAME = 'rotaleitura-cache-v1';

const APP_SHELL = [

'./',
'./index.html',
'./manifest.json',
'./launchericon-192x192.png'

];

/* =========================
INSTALL
========================= */

self.addEventListener('install', event => {

console.log('SW instalado');

event.waitUntil(

caches.open(CACHE_NAME)
.then(cache => {

return cache.addAll(APP_SHELL);

})

);

self.skipWaiting();

});

/* =========================
ACTIVATE
========================= */

self.addEventListener('activate', event => {

console.log('SW ativado');

event.waitUntil(

caches.keys().then(keys => {

return Promise.all(

keys.map(key => {

if(key !== CACHE_NAME){

console.log('Cache antigo removido:', key);

return caches.delete(key);

}

})

);

})

);

self.clients.claim();

});

/* =========================
FETCH INTELIGENTE
========================= */

self.addEventListener('fetch', event => {

const request = event.request;

/* IGNORA MÉTODOS DIFERENTES */

if(request.method !== 'GET') return;

/* IGNORA FIREBASE */

if(
request.url.includes('firestore') ||
request.url.includes('googleapis') ||
request.url.includes('gstatic')
){
return;
}

/* =========================
NETWORK FIRST
========================= */

event.respondWith(

fetch(request)

.then(response => {

const responseClone = response.clone();

caches.open(CACHE_NAME)
.then(cache => {

cache.put(request, responseClone);

});

return response;

})

.catch(() => {

return caches.match(request);

})

);

});
