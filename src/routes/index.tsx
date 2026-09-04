import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStorefront, isPlatformHost, type Template } from "@/lib/storefront";
import { SectionRenderer } from "@/components/sections";
import { applyVendorSEO, setFavicon } from "@/lib/seo";
import { setActiveVendorId } from "@/lib/vendorProducts";
import { StorePausedPage } from "@/components/store-paused";

// This static head() is the SSR-time fallback before any client-side SEO call
// runs — it's shared by the platform landing page AND a custom domain's very
// first paint (CustomDomainView calls applyVendorSEO once its fetch resolves,
// overriding this). Kept neutral rather than branded as any specific store.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kiosk — Online store" },
      { name: "description", content: "A storefront powered by Kiosk." },
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

    // NOT clearing the hydrated template here. This component only renders
    // for the bare "/" route — the buyer navigating anywhere else on the SAME
    // custom domain (checkout, a product page, /shop, ...) unmounts it, which
    // ran this cleanup on every single navigation and wiped the vendor's
    // template back to the bundled Atelier default right as they left the
    // home page. That's exactly why checkout/navbar/product pages looked like
    // the wrong store: the real vendor data had just been cleared out from
    // under them. The template only needs to reset if the buyer switches to a
    // genuinely different vendor, which the effect's own next run (on `domain`
    // changing) already re-hydrates correctly.
    return () => {
      cancelled = true;
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

/**
 * The platform's own bare-domain landing page (keeosk.store/ or the
 * workers.dev URL with no /@username and no custom domain). This is NOT a
 * vendor's shop — it must never render the bundled Atelier starter template
 * as if it were one. A vendor testing the wrong URL (their own dashboard
 * link is always /@username) would otherwise see a fully "working" demo
 * shop and reasonably conclude their real edits aren't taking effect.
 */
function PlatformLanding() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-4xl font-semibold tracking-tight">Kiosk</p>
      <p className="mt-3 max-w-md text-muted-foreground">
        This is the Kiosk platform domain, not a store. Every vendor's shop lives at its own address —
        <span className="font-medium text-foreground"> keeosk.store/@yourusername</span>, or a connected custom domain.
      </p>
    </div>
  );
}

function Index() {
  const customDomain = getCustomDomain();

  // On a custom domain, hand off to the domain-aware loader
  if (customDomain) {
    return <CustomDomainView domain={customDomain} />;
  }

  return <PlatformLanding />;
}
