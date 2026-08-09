// Cache names — bump STATIC_VER when deploying new assets
const STATIC_VER = "v2";
const STATIC_CACHE = `kiosk-static-${STATIC_VER}`;
const RUNTIME_CACHE = `kiosk-runtime-${STATIC_VER}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = ["/", OFFLINE_URL, "/manifest.json", "/kiosk-favicon.png"];

// ─── Install: precache shell + offline page ───────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then((c) => c.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: delete old caches ─────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ──────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept: API calls, SSR data, Vite HMR
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_server") ||
    url.pathname.startsWith("/__")
  ) return;

  // Static assets: cache-first (they have content-hash filenames anyway)
  if (/\.(js|css|woff2?|ttf|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }

  // HTML navigation: network-first → cached page → offline page
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(RUNTIME_CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(e.request);
          return cached ?? (await caches.match(OFFLINE_URL)) ?? new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Everything else: stale-while-revalidate
  e.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const networkPromise = fetch(e.request).then((res) => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);
      return cached ?? (await networkPromise) ?? new Response("Offline", { status: 503 });
    })
  );
});

// ─── Push notifications (order updates pushed from api-server) ────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;
  let payload = { title: "Store update", body: "", url: "/" };
  try { payload = { ...payload, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/kiosk-favicon.png",
      badge: "/kiosk-favicon.png",
      data: { url: payload.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      const existing = cs.find((c) => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); return existing.navigate(url); }
      return clients.openWindow(url);
    })
  );
});
