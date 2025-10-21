/* sw.js — mymod233 进阶版 PWA
   功能：静态资源 Cache First、页面 Network First、离线 fallback、更新提醒
*/
const CACHE_VERSION = 'v3';              // ← 每次改动SW时+1，强制让用户拿到新版本
const RUNTIME_CACHE = `pwa-mymod-${CACHE_VERSION}`;
const STATIC_PATTERN = /\.(?:js|css|png|jpg|jpeg|gif|svg|woff2?)$/i;
const OFFLINE_URL = '/offline.html';

// 安装：预缓存离线页（不要预缓存一大堆，Hexo 更新频繁）
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE).then(cache => cache.addAll([OFFLINE_URL])).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存，接管页面
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== RUNTIME_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 获取：静态资源 Cache First，页面 Network First + 离线兜底
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 静态资源：缓存优先
  if (STATIC_PATTERN.test(url.pathname)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache =>
        cache.match(req).then(hit => {
          const fromNet = fetch(req).then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(() => hit);
          return hit || fromNet;
        })
      )
    );
    return;
  }

  // 页面：网络优先，失败用缓存，再失败给离线页
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, clone));
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        return cached || caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // 其他 GET：尽量走网络，失败尝试缓存
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// 接收页面消息：允许页面请求立即激活新SW
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
