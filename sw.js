const CACHE='luce-v11';
const ASSETS=[
  './','./index.html','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './vendor/tf.min.js','./vendor/mobilenet.min.js'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=e.request.url;
  // pesi del modello MobileNet (Google storage / tfhub): cache-first a runtime
  const isModel = url.includes('tfhub.dev') || url.includes('storage.googleapis.com') || url.includes('kaggle');
  if(isModel){
    e.respondWith(
      caches.open('luce-model').then(async c=>{
        const hit=await c.match(e.request);
        if(hit) return hit;
        const res=await fetch(e.request);
        if(res && res.status===200) c.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
