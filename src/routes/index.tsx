import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStorefront, type Section, type Template } from "@/lib/storefront";
import { SectionRenderer } from "@/components/sections";
import { applyStoreSEO, applyVendorSEO, setFavicon } from "@/lib/seo";
import { setActiveVendorId } from "@/lib/vendorProducts";

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
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".kiosk.store") ||
    host.endsWith(".pages.dev") ||
    host.endsWith(".workers.dev")
  ) return null;
  return host;
}

type StoreResponse = {
  success: boolean;
  templateJson?: string;
  storeName?: string;
  vendorId?: string;
  launchUrl?: string;
  deliveryFees?: { lagos: number; other: number; freeThreshold: number };
};

function CustomDomainView({ domain }: { domain: string }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [sections, setSections] = useState<Section[]>([]);
  const [vendorId, setVendorId] = useState("");
  const { updateNavbar, updateFooter, setTheme, updateReferrals, navbar, footer, setDeliveryFees, updatePaymentConfig } = useStorefront();
  const actionsRef = useRef({ updateNavbar, updateFooter, setTheme, updateReferrals, setDeliveryFees, updatePaymentConfig });

  useEffect(() => {
    actionsRef.current = { updateNavbar, updateFooter, setTheme, updateReferrals, setDeliveryFees, updatePaymentConfig };
  }, [updateNavbar, updateFooter, setTheme, updateReferrals, setDeliveryFees, updatePaymentConfig]);

  useEffect(() => {
    const base = (import.meta as any).env?.["VITE_API_BASE"] ?? "/api";
    let cancelled = false;

    setStatus("loading");
    fetch(`${base}/store/by-domain?domain=${encodeURIComponent(domain)}`)
      .then((r) => r.json())
      .then((json: StoreResponse) => {
        if (cancelled) return;
        if (!json.success || !json.templateJson) { setStatus("error"); return; }

        const tpl: Template = JSON.parse(json.templateJson);
        const homePage = tpl.pages?.find((p) => p.slug === "/" || p.slug === "home") ?? tpl.pages?.[0];
        const vid = json.vendorId ?? "";

        setSections(homePage?.sections ?? []);
        setVendorId(vid);
        if (vid) setActiveVendorId(vid);

        const actions = actionsRef.current;
        if (tpl.navbar) actions.updateNavbar(tpl.navbar);
        if (tpl.footer) actions.updateFooter(tpl.footer);
        if (tpl.theme) actions.setTheme(tpl.theme);
        if (tpl.referrals) actions.updateReferrals(tpl.referrals);
        if (tpl.paymentConfig) actions.updatePaymentConfig(tpl.paymentConfig);
        if (json.deliveryFees) actions.setDeliveryFees(json.deliveryFees);

        const heroSection = homePage?.sections?.find((s) => s.type === "hero" && (s as any).image);
        const heroImage = heroSection ? (heroSection as any).image : undefined;
        applyVendorSEO(json.storeName ?? domain, domain, json.launchUrl ?? `https://${domain}`, heroImage);
        setFavicon(tpl.navbar?.logoImage || "/kiosk-favicon.png");

        setStatus("ok");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });

    return () => { cancelled = true; };
  }, [domain]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-4xl font-semibold">404</p>
        <p className="text-muted-foreground">No store found at <strong>{domain}</strong>.</p>
      </div>
    );
  }

  const announcements = sections.filter((s) => s.type === "announcement");
  const mainSections = sections.filter((s) => s.type !== "announcement");

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
