/* Örebro360 service worker (21 okt 2026). Sidor och data: nätet först, sparad kopia bara utan nät.
   Fasta filer (css, js med version, typsnitt, ikoner): sparad kopia först. Bara egna adresser, aldrig andra webbplatser. */
const V='o360-9e9df874-ee518238';
const FORST=['mitt.html','assets/stil.css?v=ee518238','assets/app.js?v=9e9df874','assets/ikon.svg','manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FORST)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/data/csv/'))return;
  const farsk=r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/')||u.pathname.includes('/data/')||u.pathname.endsWith('sw.js')||u.pathname.endsWith('.webmanifest');
  if(farsk){e.respondWith(fetch(r).then(s=>{if(s.ok){const k=s.clone();caches.open(V).then(c=>c.put(r,k))}return s})
    .catch(()=>caches.match(r,{ignoreSearch:u.pathname.includes('/data/')}).then(m=>m||(r.mode==='navigate'?caches.match('mitt.html'):Response.error()))));return}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(s=>{if(s.ok){const k=s.clone();caches.open(V).then(c=>c.put(r,k))}return s})))});
