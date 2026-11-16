// 홈 화면 앱(설치형)을 위한 작은 도우미 — 「인터넷 먼저」 방식.
// 늘 인터넷에서 새 파일을 먼저 받고(그래서 업데이트가 바로 보임), 인터넷이 끊겼을 때만 마지막으로 받은 파일을 쓴다.
// 자료(견적서 · 거래처 …)는 여기 저장하지 않는다. 자료는 이 기기 저장소(IndexedDB)와 PC 폴더에 있다.
const CACHE = 'starmedia-quote-mwitgfh5';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('starmedia-quote-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // 다른 곳(글꼴 등)은 손대지 않음
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error())))
  );
});
