const CACHE='fractal-art-explorer-v4-6-5-telegram';
const CORE=['./','index.html','style.css','manifest.webmanifest','js/catalog.js','js/art-presets.js','js/render-worker.js','js/renderer3d.js','js/app.js','js/splash.js','assets/icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==location.origin)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);
  if(req.mode==='navigate'){try{const fresh=await fetch(req);if(fresh.ok)cache.put(req,fresh.clone());return fresh;}catch(e){return (await cache.match(req))||(await cache.match('./'))||(await cache.match('index.html'));}}
  const cached=await cache.match(req);if(cached)return cached;
  const fresh=await fetch(req);if(fresh.ok)cache.put(req,fresh.clone());return fresh;
 })());
});
