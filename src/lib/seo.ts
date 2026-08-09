/**
 * Shared SEO helpers — used by every route to apply consistent metadata.
 *
 * All functions operate on DOM <head> elements directly (client-side).
 * TanStack Start's head() handles the SSR shell; these fill in dynamic
 * values once the storefront config is hydrated from localStorage.
 */

// ── DOM helpers ───────────────────────────────────────────────────────────────

export function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function injectJsonLd(data: object, id: string) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function setFavicon(url: string) {
  if (!url) return;
  let el = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "icon";
    document.head.appendChild(el);
  }
  el.href = url;
  el.type = url.endsWith(".svg") ? "image/svg+xml" : url.endsWith(".png") ? "image/png" : "image/x-icon";
  let apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!apple) {
    apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    document.head.appendChild(apple);
  }
  apple.href = url;
}

// ── Store-level SEO (/, /shop, and any non-product page) ─────────────────────

/**
 * Apply full store SEO to the current page.
 * Call inside useEffect whenever navbar.brand or footer.tagline changes.
 *
 * @param storeName  The store brand name (navbar.brand)
 * @param tagline    Short store description (footer.tagline)
 * @param pageUrl    Canonical URL for this page (window.location.href)
 * @param heroImage  Optional hero image for og:image
 * @param city       Optional city for geo.placename
 */
export function applyStoreSEO(
  storeName: string,
  tagline: string,
  pageUrl: string,
  heroImage?: string,
  city?: string,
  categories?: string[],
) {
  if (!storeName) return;

  const title = `${storeName} — Shop Online`;
  const description = tagline || `Shop ${storeName}'s products online. Browse our full collection and order securely in Nigeria.`;
  const image = heroImage || "https://kiosk.store/og-default.jpg";
  const locationLabel = city ? `${city}, Nigeria` : "Nigeria";

  document.title = title;

  setMeta("description", description);
  setMeta("keywords", `${storeName}, online shop, buy online, Nigeria, ${city ?? "Nigeria"}, kiosk store, Nigerian store`);
  setMeta("robots", "index, follow");

  // Open Graph
  setMetaProperty("og:title", title);
  setMetaProperty("og:description", description);
  setMetaProperty("og:url", pageUrl);
  setMetaProperty("og:image", image);
  setMetaProperty("og:image:width", "1200");
  setMetaProperty("og:image:height", "630");
  setMetaProperty("og:type", "website");
  setMetaProperty("og:site_name", storeName);
  setMetaProperty("og:locale", "en_NG");

  // Twitter / X card
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setMeta("twitter:image", image);

  // Geo signals
  setMeta("geo.region", "NG");
  setMeta("geo.country", "NG");
  setMeta("geo.placename", locationLabel);
  setMeta("ICBM", "9.0820, 8.6753");

  setCanonical(pageUrl);

  // Structured data: LocalBusiness
  injectJsonLd(
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "Store"],
      name: storeName,
      url: pageUrl,
      image,
      description,
      currenciesAccepted: "NGN",
      paymentAccepted: "Cash, Credit Card, Bank Transfer",
      address: {
        "@type": "PostalAddress",
        addressCountry: "NG",
        ...(city ? { addressLocality: city } : {}),
      },
      ...(categories && categories.length > 0
        ? { itemOffered: categories.map((cat) => ({ "@type": "Product", category: cat })) }
        : {}),
    },
    "store-jsonld",
  );

  // Breadcrumb
  injectJsonLd(
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin },
        { "@type": "ListItem", position: 2, name: storeName, item: pageUrl },
      ],
    },
    "store-breadcrumb-jsonld",
  );
}

// ── Vendor-slug SEO ($.tsx — @username style routes) ─────────────────────────
// Kept here so $.tsx can import it rather than defining its own copy.

export function applyVendorSEO(
  storeName: string,
  username: string,
  launchUrl: string,
  heroImage?: string,
  city?: string,
) {
  const url = launchUrl || `https://kiosk.store/@${username}`;
  applyStoreSEO(storeName, "", url, heroImage, city);

  // Override og:site_name with the vendor's store name (applyStoreSEO already does this,
  // but we re-apply keywords with the @username variant)
  setMeta(
    "keywords",
    `${storeName}, online shop, buy online, Nigeria, ${city ?? "Nigeria"}, kiosk store, @${username}`,
  );

  // Vendor-specific breadcrumb overrides the store-level one
  injectJsonLd(
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://kiosk.store" },
        { "@type": "ListItem", position: 2, name: storeName, item: url },
      ],
    },
    "vendor-breadcrumb-jsonld",
  );
}
