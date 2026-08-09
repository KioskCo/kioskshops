import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { SectionRenderer } from "@/components/sections";
import { useStorefront } from "@/lib/storefront";
import { setActiveVendorId } from "@/lib/vendorProducts";
import { applyVendorSEO, setFavicon } from "@/lib/seo";
import { useEffect, useRef, useState } from "react";
import type { Section, Template } from "@/lib/storefront";

export const Route = createFileRoute("/$")({
  component: CustomPageView,
});

type StoreResponse = {
  success: boolean;
  templateJson?: string;
  storeName?: string;
  vendorId?: string;
  launchUrl?: string;
  paused?: boolean;
  error?: string;
  deliveryFees?: { lagos: number; other: number; freeThreshold: number };
};

function StorePausedPage({ storeName, username }: { storeName: string; username: string }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* subtle decorative rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full border border-border/30 opacity-40" />
        <div className="absolute h-[400px] w-[400px] rounded-full border border-border/40 opacity-50" />
        <div className="absolute h-[220px] w-[220px] rounded-full border border-border/60 opacity-60" />
      </div>

      <div className="relative z-10 max-w-md text-center">
        {/* wrench + store icon stack */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Down for maintenance
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
          {storeName || `@${username}`}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          We're making some updates and will be back shortly. Thanks for your patience!
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Go to homepage
          </Link>
          <a
            href={`mailto:?subject=When will ${storeName || username} be back?`}
            className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Get notified
          </a>
        </div>

        <p className="mt-10 text-xs text-muted-foreground/60">
          Powered by <span className="font-semibold text-foreground">Kiosk</span>
        </p>
      </div>
    </div>
  );
}

function VendorStoreView({ username }: { username: string }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error" | "paused">("loading");
  const [sections, setSections] = useState<Section[]>([]);
  const [storeName, setStoreName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [launchUrl, setLaunchUrl] = useState("");
  const { updateNavbar, updateFooter, setTheme, updateReferrals, setDeliveryFees, updatePaymentConfig } = useStorefront();
  const chromeActionsRef = useRef({ updateNavbar, updateFooter, setTheme, updateReferrals, setDeliveryFees, updatePaymentConfig });

  useEffect(() => {
    chromeActionsRef.current = { updateNavbar, updateFooter, setTheme, updateReferrals, setDeliveryFees, updatePaymentConfig };
  }, [setTheme, updateFooter, updateNavbar, updateReferrals, setDeliveryFees, updatePaymentConfig]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE ?? "/api";
    const slug = username.toLowerCase();
    let cancelled = false;

    setStatus("loading");
    fetch(`${base}/store/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((json: StoreResponse) => {
        if (cancelled) return;

        if (!json.success) {
          setStatus("error");
          return;
        }

        const name = json.storeName ?? username;
        setStoreName(name);

        // Store exists but owner paused it — show maintenance page
        if (json.paused) {
          setStatus("paused");
          return;
        }

        if (!json.templateJson) {
          setStatus("error");
          return;
        }

        const tpl: Template = JSON.parse(json.templateJson);
        const homePage = tpl.pages?.find((p) => p.slug === "/" || p.slug === "home") ?? tpl.pages?.[0];
        const vid = json.vendorId ?? "";
        const url = json.launchUrl ?? `https://kiosk.store/@${username}`;

        setSections(homePage?.sections ?? []);
        setVendorId(vid);
        setLaunchUrl(url);
        if (vid) setActiveVendorId(vid);

        const chromeActions = chromeActionsRef.current;
        if (tpl.navbar) chromeActions.updateNavbar(tpl.navbar);
        if (tpl.footer) chromeActions.updateFooter(tpl.footer);
        if (tpl.theme) chromeActions.setTheme(tpl.theme);
        if (tpl.referrals) chromeActions.updateReferrals(tpl.referrals);
        if (tpl.paymentConfig) chromeActions.updatePaymentConfig(tpl.paymentConfig);
        if (json.deliveryFees) chromeActions.setDeliveryFees(json.deliveryFees);

        // SEO: pick first hero image if available
        const heroSection = homePage?.sections?.find((s) => s.type === "hero" && (s as any).image);
        const heroImage = heroSection ? (heroSection as any).image : undefined;
        applyVendorSEO(name, username, url, heroImage);

        // Favicon: vendor logo → Kiosk platform logo fallback
        setFavicon(tpl.navbar?.logoImage || "/kiosk-favicon.png");

        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "paused") {
    return <StorePausedPage storeName={storeName} username={username} />;
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-7xl font-semibold">404</p>
        <p className="mt-3 text-muted-foreground">
          No store found for <strong>@{username}</strong>.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-4xl">{storeName}</h1>
        <p className="mt-4 text-muted-foreground">This store is coming soon.</p>
      </div>
    );
  }

  return (
    <div>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} vendorId={vendorId} />
      ))}
    </div>
  );
}

function CustomPageView() {
  const location = useLocation();
  const { pages } = useStorefront();
  const pathname = location.pathname.replace(/\/$/, "") || "/";

  const vendorMatch = pathname.match(/^\/@([a-z0-9_]+)$/i);
  if (vendorMatch) {
    return <VendorStoreView username={vendorMatch[1]!} />;
  }

  const page = pages.find((candidate) => {
    const pagePath = candidate.slug.replace(/\/$/, "") || "/";
    return pagePath === pathname;
  });

  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-3 font-serif text-4xl">Page not found</h1>
        <p className="mt-4 text-muted-foreground">
          No page exists at{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-sm">{location.pathname}</code>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create this page in{" "}
          <Link to="/admin" className="underline hover:text-foreground">
            Admin - Pages
          </Link>
          .
        </p>
      </div>
    );
  }

  if (page.sections.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-4xl">{page.name}</h1>
        <p className="mt-4 text-muted-foreground">
          This page has no content yet.{" "}
          <Link to="/admin" className="underline hover:text-foreground">
            Add sections in the editor.
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
