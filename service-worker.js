const V='fga-v9',SHELL=['./','index.html','style.css','app.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
const put=(r,res)=>{if(res&&res.ok){const c=res.clone();caches.open(V).then(ch=>ch.put(r,c))}return res};
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
 if(new URL(r.url).origin===location.origin)e.respondWith(fetch(r).then(x=>put(r,x)).catch(()=>caches.match(r)));   /* file aplikasi: selalu ambil versi terbaru, cadangan cache */
 else e.respondWith(caches.match(r).then(h=>h||fetch(r).then(x=>put(r,x))))});                                      /* mesin OCR (CDN): cache dulu agar bisa offline */
