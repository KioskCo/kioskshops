import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { SectionRenderer } from "@/components/sections";
import { scopeTemplateToVendor, setPersistedVendorSlug, useStorefront } from "@/lib/storefront";
import { setActiveVendorId } from "@/lib/vendorProducts";
import { applyVendorSEO, setFavicon } from "@/lib/seo";
import { StorePausedPage } from "@/components/store-paused";
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

function VendorStoreView({ username, subpath }: { username: string; subpath: string }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error" | "paused">("loading");
  const [sections, setSections] = useState<Section[]>([]);
  const [storeName, setStoreName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [launchUrl, setLaunchUrl] = useState("");
  const { hydrateVendorTemplate, setDeliveryFees } = useStorefront();
  const actionsRef = useRef({ hydrateVendorTemplate, setDeliveryFees });

  useEffect(() => {
    actionsRef.current = { hydrateVendorTemplate, setDeliveryFees };
  }, [hydrateVendorTemplate, setDeliveryFees]);

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

        // Hydrate the WHOLE vendor template (pages, navbar, footer, theme,
        // fonts/designTokens, payments, referrals) so the shop never falls back
        // to admin/default template data. Internal links are scoped to @username.
        const tpl = scopeTemplateToVendor(JSON.parse(json.templateJson) as Template, slug);
        const vid = json.vendorId ?? "";
        const url = json.launchUrl ?? `https://kiosk.store/@${username}`;

        actionsRef.current.hydrateVendorTemplate(tpl);
        setPersistedVendorSlug(slug);
        if (json.deliveryFees) actionsRef.current.setDeliveryFees(json.deliveryFees);

        // Resolve the page for the current subpath, falling back to home.
        const norm = (s: string) => s.replace(/\/+$/, "") || "/";
        const sub = subpath ? "/" + subpath.replace(/^\/+|\/+$/g, "") : "/";
        const page =
          tpl.pages?.find((p) => norm(p.slug) === norm(sub)) ??
          tpl.pages?.find((p) => p.slug === "/" || p.slug === "home") ??
          tpl.pages?.[0];

        setSections(page?.sections ?? []);
        setVendorId(vid);
        setLaunchUrl(url);
        if (vid) setActiveVendorId(vid);

        // SEO: pick first hero image if available
        const heroSection = page?.sections?.find((s) => s.type === "hero" && (s as any).image);
        const heroImage = heroSection ? (heroSection as any).image : undefined;
        applyVendorSEO(name, slug, url, heroImage);

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
  }, [username, subpath]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "paused") {
    return <StorePausedPage storeName={storeName} label={`@${username}`} />;
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
  const { pages, hydrateVendorTemplate } = useStorefront();
  const pathname = location.pathname.replace(/\/$/, "") || "/";

  const vendorMatch = pathname.match(/^\/@([a-z0-9_]+)(?:\/(.*))?$/i);

  // Leaving a vendor storefront restores the admin/platform editor scope.
  useEffect(() => {
    if (!/^\/@([a-z0-9_]+)(?:\/(.*))?$/i.test(pathname)) hydrateVendorTemplate(null);
  }, [pathname, hydrateVendorTemplate]);

  if (vendorMatch) {
    return <VendorStoreView username={vendorMatch[1]!.toLowerCase()} subpath={vendorMatch[2] ?? ""} />;
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
