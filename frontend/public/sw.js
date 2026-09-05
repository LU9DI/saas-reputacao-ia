/* Filtra.IA SW v2 — shell + cache seletivo de API + push */
const SHELL = 'filtra-shell-v2';
const API_CACHE = 'filtra-api-v1';
const PRECACHE = ['/', '/login', '/manifest.webmanifest', '/icons/icon.svg'];

/** GETs públicos/seguros para cache curto (network-first + fallback offline). */
function isCacheableApi(url) {
  if (!url.pathname.startsWith('/api/')) return false;
  // nunca
  const deny = [
    '/api/auth/',
    '/api/admin/',
    '/api/webhook/',
    '/api/push/',
    '/api/webauthn/',
    '/api/mfa',
    'relatorio.pdf',
  ];
  if (deny.some((d) => url.pathname.includes(d))) return false;
  // allowlist
  const allow = [
    /^\/api\/health$/,
    /^\/api\/metrics$/,
    /^\/api\/planos-teste$/,
    /^\/api\/push\/vapid-public-key$/,
    /^\/api\/empresa\/[^/]+\/validar$/,
    /^\/api\/empresa\/[^/]+\/painel$/,
    /^\/api\/empresa\/[^/]+\/assinatura$/,
  ];
  return allow.some((re) => re.test(url.pathname));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isApi =
    url.pathname.startsWith('/api/') ||
    url.port === '5000' ||
    /:\/\/[^/]*api/i.test(url.origin);

  if (isApi) {
    if (!isCacheableApi(url)) {
      event.respondWith(
        fetch(req).catch(
          () =>
            new Response(JSON.stringify({ error: 'offline', offline: true }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            })
        )
      );
      return;
    }

    // Network-first + grava cache (TTL lógico: sobrescreve a cada sucesso)
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) {
            const headers = new Headers(cached.headers);
            headers.set('X-Filtra-Cache', 'offline-fallback');
            return new Response(cached.body, {
              status: cached.status,
              statusText: cached.statusText,
              headers,
            });
          }
          return new Response(
            JSON.stringify({ error: 'offline', offline: true }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Filtra.IA', body: 'Nova atualização', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    try {
      data.body = event.data.text();
    } catch {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Filtra.IA', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'filtra',
      data: { url: data.url || '/' },
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
