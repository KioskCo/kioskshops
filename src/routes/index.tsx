import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStorefront, isPlatformHost, type Template } from "@/lib/storefront";
import { SectionRenderer } from "@/components/sections";
import { applyStoreSEO, applyVendorSEO, setFavicon } from "@/lib/seo";
import { setActiveVendorId } from "@/lib/vendorProducts";
import { StorePausedPage } from "@/components/store-paused";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Our Store — Shop online" },
      { name: "description", content: "Browse and shop our collection online." },
    ],
  }),
  component: Index,
});

/** Returns the custom domain hostname if this page is running on one, null otherwise. */
function getCustomDomain(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  return isPlatformHost(host) ? null : host;
}

type StoreResponse = {
  success: boolean;
  templateJson?: string;
  storeName?: string;
  vendorId?: string;
  launchUrl?: string;
  paused?: boolean;
  deliveryFees?: { lagos: number; other: number; freeThreshold: number };
};

function CustomDomainView({ domain }: { domain: string }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error" | "paused">("loading");
  const [storeName, setStoreName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const { hydrateVendorTemplate, setDeliveryFees, pages } = useStorefront();
  const actionsRef = useRef({ hydrateVendorTemplate, setDeliveryFees });

  useEffect(() => {
    actionsRef.current = { hydrateVendorTemplate, setDeliveryFees };
  }, [hydrateVendorTemplate, setDeliveryFees]);

  useEffect(() => {
    const base = (import.meta as any).env?.["VITE_API_BASE"] ?? "/api";
    let cancelled = false;

    setStatus("loading");
    fetch(`${base}/store/by-domain?domain=${encodeURIComponent(domain)}`)
      .then((r) => r.json())
      .then((json: StoreResponse) => {
        if (cancelled) return;
        if (!json.success) { setStatus("error"); return; }

        const name = json.storeName ?? domain;
        setStoreName(name);

        if (json.paused) { setStatus("paused"); return; }
        if (!json.templateJson) { setStatus("error"); return; }

        // Hydrate the WHOLE vendor template — same mechanism as the /@username
        // path — so nothing here ever falls back to admin/default template data.
        // Unlike scopeTemplateToVendor (used for /@username), links stay
        // un-prefixed since a custom domain IS the vendor's own root.
        const tpl: Template = JSON.parse(json.templateJson!);
        const vid = json.vendorId ?? "";

        actionsRef.current.hydrateVendorTemplate(tpl);
        if (vid) setActiveVendorId(vid);
        setVendorId(vid);
        if (json.deliveryFees) actionsRef.current.setDeliveryFees(json.deliveryFees);

        const homePage = tpl.pages?.find((p) => p.slug === "/" || p.slug === "home") ?? tpl.pages?.[0];
        const heroSection = homePage?.sections?.find((s) => s.type === "hero" && (s as any).image);
        const heroImage = heroSection ? (heroSection as any).image : undefined;
        applyVendorSEO(name, domain, json.launchUrl ?? `https://${domain}`, heroImage);
        setFavicon(tpl.navbar?.logoImage || "/kiosk-favicon.png");

        setStatus("ok");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });

    return () => {
      cancelled = true;
      actionsRef.current.hydrateVendorTemplate(null);
    };
  }, [domain]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "paused") {
    return <StorePausedPage storeName={storeName} label={domain} />;
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-4xl font-semibold">404</p>
        <p className="text-muted-foreground">No store found at <strong>{domain}</strong>.</p>
      </div>
    );
  }

  const home = pages.find((p) => p.slug === "/" || p.slug === "home") ?? pages[0];
  const allSections = home?.sections ?? [];
  const announcements = allSections.filter((s) => s.type === "announcement");
  const mainSections = allSections.filter((s) => s.type !== "announcement");

  return (
    <div>
      {announcements.map((s) => <SectionRenderer key={s.id} section={s} vendorId={vendorId} />)}
      {mainSections.map((s) => <SectionRenderer key={s.id} section={s} vendorId={vendorId} />)}
    </div>
  );
}

function Index() {
  const { pages, navbar, footer } = useStorefront();

  const customDomain = getCustomDomain();
  const home = pages.find((p) => p.slug === "/") ?? pages[0];

  useEffect(() => {
    if (customDomain) return;
    const heroSection = home?.sections?.find((s) => s.type === "hero" && (s as any).image);
    const heroImage = heroSection ? (heroSection as any).image : undefined;
    applyStoreSEO(navbar.brand, footer.tagline, window.location.href, heroImage);
  }, [navbar.brand, footer.tagline, home, customDomain]);

  // On a custom domain, hand off to the domain-aware loader
  if (customDomain) {
    return <CustomDomainView domain={customDomain} />;
  }

  const allSections = home?.sections ?? [];
  const announcements = allSections.filter((s) => s.type === "announcement");
  const mainSections = allSections.filter((s) => s.type !== "announcement");

  return (
    <div>
      {announcements.map((s) => <SectionRenderer key={s.id} section={s} />)}
      {mainSections.map((s) => <SectionRenderer key={s.id} section={s} />)}
    </div>
  );
}
