import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, useLocation, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import appCss from "../styles.css?url";
import { CartProvider } from "@/lib/cart";
import { StorefrontProvider, useStorefront } from "@/lib/storefront";
import { VendorProductsProvider } from "@/lib/vendorProducts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-semibold">404</p>
        <p className="mt-3 text-muted-foreground">This page wandered off.</p>
        <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground hover:opacity-90">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Our Store — Shop online" },
      { name: "description", content: "Browse and shop our collection online." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Kiosk Store" },
      { property: "og:locale", content: "en_NG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#ffffff" },
      { name: "geo.region", content: "NG" },
      { name: "geo.country", content: "NG" },
      { name: "geo.placename", content: "Nigeria" },
      { name: "language", content: "English" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json", id: "pwa-manifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

// Detect iOS Safari (no beforeinstallprompt, needs manual "Add to Home Screen")
function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
  const isStandalone = (navigator as any).standalone === true;
  return isIos && isSafari && !isStandalone;
}

// Registers service worker and injects dynamic per-vendor manifest + install prompt
function PwaSetup() {
  const { navbar, footer, designTokens } = useStorefront();
  const installEventRef = useRef<Event | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Android/desktop: capture native install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installEventRef.current = e;
      const alreadyDismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!alreadyDismissed) setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // iOS Safari: show manual "Add to Home Screen" hint after a short delay
  useEffect(() => {
    if (!isIosSafari()) return;
    if (sessionStorage.getItem("pwa_install_dismissed")) return;
    const t = setTimeout(() => setShowIosHint(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Build per-vendor manifest whenever brand or logo changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    const brand = navbar.brand || footer.brand || "My Store";
    const logoImage = navbar.logoImage || footer.logoImage;
    const accentColor = (designTokens as any)?.accentColor ?? "#111111";
    const icons = logoImage
      ? [
          { src: logoImage, sizes: "192x192", type: "image/png", purpose: "any" },
          { src: logoImage, sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ]
      : [{ src: "/kiosk-favicon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }];

    const manifest = {
      name: brand,
      short_name: brand.length > 14 ? brand.slice(0, 14) : brand,
      description: `Shop ${brand} online — browse products, track orders, and checkout securely.`,
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: accentColor,
      orientation: "portrait-primary",
      icons,
      categories: ["shopping", "lifestyle"],
      lang: "en-NG",
      shortcuts: [
        { name: "Shop", short_name: "Shop", url: "/shop", icons: [{ src: "/kiosk-favicon.png", sizes: "96x96" }] },
        { name: "My Orders", short_name: "Orders", url: "/orders", icons: [{ src: "/kiosk-favicon.png", sizes: "96x96" }] },
      ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    let link = document.getElementById("pwa-manifest") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "pwa-manifest";
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    const old = link.href;
    link.href = url;
    if (old.startsWith("blob:")) URL.revokeObjectURL(old);

    // iOS add-to-home-screen
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = logoImage ?? "/kiosk-favicon.png";

    // Update theme-color meta tag with store accent
    let themeMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement | null;
    if (themeMeta) themeMeta.content = accentColor;

    document.title = brand;
    return () => { URL.revokeObjectURL(url); };
  }, [navbar.brand, navbar.logoImage, footer.brand, footer.logoImage, designTokens]);

  const handleInstall = async () => {
    const ev = installEventRef.current as any;
    if (!ev) return;
    ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === "accepted") setShowInstall(false);
    installEventRef.current = null;
  };

  const handleDismiss = () => {
    setShowInstall(false);
    setShowIosHint(false);
    setDismissed(true);
    sessionStorage.setItem("pwa_install_dismissed", "1");
  };

  const brand = navbar.brand || footer.brand || "Store";
  const logo = navbar.logoImage || footer.logoImage || "/kiosk-favicon.png";

  const bannerStyle: React.CSSProperties = {
    position: "fixed", bottom: 16, left: 16, right: 16, zIndex: 9999,
    background: "#111", color: "#fff", borderRadius: 16, padding: "14px 16px",
    display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    maxWidth: 480, margin: "0 auto",
  };

  if (dismissed) return null;

  // Android / desktop: native install prompt
  if (showInstall) {
    return (
      <div style={bannerStyle}>
        <img src={logo} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Add {brand} to your phone</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: "2px 0 0", lineHeight: 1.4 }}>Shop faster — no browser needed</p>
        </div>
        <button onClick={handleInstall} style={{ background: "#fff", color: "#111", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Install</button>
        <button onClick={handleDismiss} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1, opacity: 0.6, flexShrink: 0 }} aria-label="Dismiss">×</button>
      </div>
    );
  }

  // iOS Safari: manual "Add to Home Screen" instruction (no API available)
  if (showIosHint) {
    return (
      <div style={{ ...bannerStyle, flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <img src={logo} alt="" width={36} height={36} style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Install {brand} on your iPhone</p>
          </div>
          <button onClick={handleDismiss} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1, opacity: 0.6 }} aria-label="Dismiss">×</button>
        </div>
        <p style={{ fontSize: 12, opacity: 0.75, margin: 0, lineHeight: 1.5 }}>
          Tap the <strong style={{ background: "#333", padding: "1px 4px", borderRadius: 4 }}>Share</strong> button at the bottom of Safari, then tap <strong style={{ background: "#333", padding: "1px 4px", borderRadius: 4 }}>Add to Home Screen</strong>
        </p>
      </div>
    );
  }

  return null;
}

// Stand-in for the header while vendor scope is still being fetched on a
// fresh load — same height, no brand text/links, so nothing here ever shows
// the bundled Atelier branding before the real one is known. This is what
// actually matters on a slow connection: the window this covers is exactly
// as long as the fetch takes.
function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6">
        <div className="h-5 w-28 animate-pulse rounded bg-secondary" />
        <div className="ml-auto flex gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
        </div>
      </div>
    </header>
  );
}

function AppShell({ isAdmin }: { isAdmin: boolean }) {
  const { vendorHydrating } = useStorefront();
  const showChrome = !isAdmin;
  return (
    <div className="flex min-h-screen flex-col">
      {showChrome && (vendorHydrating ? <HeaderSkeleton /> : <SiteHeader />)}
      <main className="flex-1"><Outlet /></main>
      {/* Footer sits below the fold — skip it outright while hydrating rather
          than building a second skeleton nobody sees during the brief window. */}
      {showChrome && !vendorHydrating && <SiteFooter />}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  // Capture ?ref= referral code from URL and store in sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) sessionStorage.setItem("kiosk_referral_code", ref);
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <StorefrontProvider>
        <PwaSetup />
        <VendorProductsProvider>
        <CartProvider>
          <AppShell isAdmin={isAdmin} />
          <CartDrawer />
        </CartProvider>
        </VendorProductsProvider>
      </StorefrontProvider>
    </QueryClientProvider>
  );
}
