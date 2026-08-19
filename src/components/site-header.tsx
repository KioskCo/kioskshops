import { Link, useNavigate } from "@tanstack/react-router";
import {
  List, Search, Bag, XLg, PersonCircle, ChevronRight, ArrowRight,
  Person, PersonVcard, People, BagCheck, BagPlus, Cart, Cart3, Gift, Shop,
  Grid, Grid3x3Gap, Justify, ThreeDots, ThreeDotsVertical, UpcScan, Upc,
} from "react-bootstrap-icons";
import type { Icon as IconType } from "react-bootstrap-icons";

// Each navbar icon setting is a fixed, enumerated set of Ionicon names picked
// in the kioskm editor (see editor-panels.tsx's NavIconPicker) — the shop
// previously rendered a single hardcoded icon regardless of this setting.
const SEARCH_ICONS: Record<string, IconType> = {
  "search-outline": Search, search: Search, "search-sharp": Search,
  "search-circle-outline": Search, "scan-outline": UpcScan, "barcode-outline": Upc,
};
const PROFILE_ICONS: Record<string, IconType> = {
  "person-circle-outline": PersonCircle, "person-circle": PersonCircle,
  "person-outline": Person, person: Person,
  "contact-outline": PersonVcard, "people-outline": People,
};
const CART_ICONS: Record<string, IconType> = {
  "bag-outline": Bag, "bag-handle-outline": Bag, "bag-check-outline": BagCheck,
  "bag-add-outline": BagPlus, "cart-outline": Cart3, cart: Cart,
  "gift-outline": Gift, "storefront-outline": Shop,
};
const MENU_ICONS: Record<string, IconType> = {
  "menu-outline": List, menu: List,
  "reorder-three-outline": List, "reorder-four-outline": Justify,
  "grid-outline": Grid3x3Gap, "apps-outline": Grid,
  "ellipsis-horizontal-outline": ThreeDots, "ellipsis-vertical-outline": ThreeDotsVertical,
};
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/cart";
import { useStorefront, useDesignTokens, HEADING_FONT_META } from "@/lib/storefront";
import { useVendorProducts } from "@/lib/vendorProducts";

type Product = { slug: string; name: string; description: string; image: string; price: number; tagline?: string };

function SearchInput({
  value,
  onChange,
  onEnter,
  onClose,
  inputRef,
  autoFocus = true,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  onClose: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 px-4 ${className}`}>
      <Search className="shrink-0 text-muted-foreground" style={{ fontSize: 15 }} />
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && value.trim()) onEnter(); if (e.key === "Escape") onClose(); }}
        placeholder="Search products…"
        className="h-12 w-full bg-transparent text-sm focus:outline-none"
      />
      {value && (
        <button onClick={() => onChange("")} className="shrink-0 text-muted-foreground hover:text-foreground">
          <XLg style={{ fontSize: 14 }} />
        </button>
      )}
      <button onClick={onClose} className="shrink-0 text-xs font-semibold text-primary hover:opacity-70 ml-1 whitespace-nowrap">
        Cancel
      </button>
    </div>
  );
}

function SearchResults({
  q,
  results,
  onPick,
  onSeeAll,
}: {
  q: string;
  results: Product[];
  onPick: (slug: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <>
      <div className="max-h-72 overflow-y-auto p-2">
        {q.trim() === "" && <p className="px-3 py-6 text-center text-xs text-muted-foreground">Start typing to search…</p>}
        {q.trim() !== "" && results.length === 0 && <p className="px-3 py-6 text-center text-xs text-muted-foreground">No products found.</p>}
        {results.map((p) => (
          <button
            key={p.slug}
            onClick={() => onPick(p.slug)}
            className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-secondary"
          >
            <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.name}</p>
              {p.tagline && <p className="truncate text-xs text-muted-foreground">{p.tagline}</p>}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">₦{Number(p.price).toLocaleString("en-NG")}</span>
          </button>
        ))}
      </div>
      {(q.trim() !== "" || results.length > 0) && (
        <div className="border-t border-border px-4 py-2 text-right">
          <button onClick={onSeeAll} className="text-xs text-muted-foreground hover:text-foreground">
            See all results →
          </button>
        </div>
      )}
    </>
  );
}

// Easing curve per mobile-sidebar animation choice — "slide" is the plain
// default; the rest reuse the same translateX/opacity transition with a
// different feel via timing function alone (no extra deps/keyframes needed).
const SIDEBAR_EASING: Record<string, string> = {
  slide: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  bounce: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
  fade: "ease",
  none: "linear",
};

function ListMarker({ style, index }: { style?: string; index: number }) {
  switch (style) {
    case "chevron": return <ChevronRight size={12} className="shrink-0 opacity-40" />;
    case "arrow": return <ArrowRight size={12} className="shrink-0 opacity-40" />;
    case "dot": return <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />;
    case "numbered": return <span className="w-4 shrink-0 text-xs tabular-nums opacity-50">{index + 1}.</span>;
    default: return null;
  }
}

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { navbar } = useStorefront();
  const designTokens = useDesignTokens();
  // Brand wordmark follows its own "Brand font" override when set, otherwise
  // falls back to the store-wide heading font — never plain browser default.
  const brandMeta = HEADING_FONT_META[navbar.brandFont ?? designTokens.fontHeading ?? "serif"] ?? HEADING_FONT_META.serif;
  const brandStyle: React.CSSProperties = {
    ...(brandMeta.family ? { fontFamily: brandMeta.family } : {}),
    ...(navbar.brandFontSize ? { fontSize: navbar.brandFontSize } : {}),
  };
  const { products } = useVendorProducts();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const searchStyle = navbar.searchStyle ?? "dropdown";

  const openSearch = useCallback(() => {
    setQ("");
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQ("");
  }, []);

  const logoMode = navbar.logoMode ?? "text";
  const logoHeight = navbar.logoHeight ?? 28;
  const sidebarAnim = navbar.sidebarAnimation ?? "slide";
  const SearchIcon = SEARCH_ICONS[navbar.searchIcon ?? "search-outline"] ?? Search;
  const ProfileIcon = PROFILE_ICONS[navbar.profileIcon ?? "person-circle-outline"] ?? PersonCircle;
  const CartIcon = CART_ICONS[navbar.cartIcon ?? "bag-outline"] ?? Bag;
  const MenuIcon = MENU_ICONS[navbar.menuIcon ?? "menu-outline"] ?? List;

  const openMobile = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMobileOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setMobileVisible(true)));
  };

  const closeMobile = () => {
    setMobileVisible(false);
    closeTimer.current = setTimeout(() => setMobileOpen(false), 300);
  };

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const allResults = q.trim()
    ? products.filter((p) => (p.name + " " + p.description).toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];

  const navStyle = navbar.navbarStyle ?? "default";
  const navBg = navbar.navbarBg;
  const headerClass = [
    navbar.sticky ? "sticky top-0" : "",
    "z-40",
    navStyle === "transparent" ? "bg-transparent border-b-0" :
    navStyle === "minimal"     ? "bg-background border-b-0" :
    navStyle === "bordered"    ? "border-b-2 border-foreground bg-background" :
    navStyle === "filled"      ? "border-b-0" :
    "border-b border-border bg-background/95 backdrop-blur",
  ].filter(Boolean).join(" ");
  const headerStyle = navStyle === "filled" ? { backgroundColor: navBg ?? "#111111", color: "#ffffff" } : navBg ? { backgroundColor: navBg } : undefined;
  const textOverride = navStyle === "filled" ? "text-white" : "";

  const navLinks = navbar.links.map((l, i) => {
    if (l.isButton) {
      const btnClass =
        l.btnStyle === "solid"
          ? "rounded px-4 py-1.5 font-medium bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          : l.btnStyle === "outline"
          ? "rounded border border-accent px-4 py-1.5 font-medium text-accent hover:bg-accent/10 transition-colors"
          : `rounded px-4 py-1.5 font-medium ${textOverride ? "text-white/80 hover:text-white" : "text-foreground/80 hover:text-foreground"}`;
      return <a key={i} href={l.href} className={btnClass}>{l.label}</a>;
    }
    return <a key={i} href={l.href} className={`${textOverride ? "text-white/80 hover:text-white" : "text-foreground/80 hover:text-foreground"}`}>{l.label}</a>;
  });

  const goToSearch = () => { closeSearch(); navigate({ to: "/search", search: { q } as any }); };
  const goToProduct = (slug: string) => { closeSearch(); navigate({ to: "/product/$slug", params: { slug } }); };

  // "logo-left" (default): logo beside the menu button, nav centered.
  // "logo-center": nav moves beside the menu button, logo takes the center.
  // "logo-right": nav beside the menu button, logo sits next to the icon cluster.
  const layout = navbar.layout ?? "logo-left";

  const hamburgerBtn = (
    <button onClick={openMobile} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 md:hidden" aria-label="Menu">
      <MenuIcon size={20} />
    </button>
  );

  const logoBlock = (
    <Link to="/" className="flex items-center gap-0.5 text-xl font-semibold tracking-tight">
      {navbar.logoImage && (logoMode === "logo" || logoMode === "both") && (
        <img src={navbar.logoImage} alt={navbar.brand} style={{ height: `${logoHeight}px`, maxWidth: `${logoHeight * 2.2}px`, objectFit: "contain", objectPosition: "left center" }} />
      )}
      {(logoMode === "text" || logoMode === "both" || !navbar.logoImage) && <span style={brandStyle}>{navbar.brand}</span>}
    </Link>
  );

  const navBlock = (
    <nav className="hidden items-center gap-6 text-sm md:flex">
      {navLinks}
    </nav>
  );

  return (
    <header className={`${headerClass} relative`} style={headerStyle}>
      {/* ── Main header row (always in DOM, never replaced) ── */}
      <div className={`mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-6 ${textOverride}`}>

        {/* Left slot: menu button always here; logo or nav depending on layout */}
        <div className="flex items-center gap-3 justify-self-start">
          {hamburgerBtn}
          {layout === "logo-left" ? logoBlock : navBlock}
        </div>

        {/* Center slot */}
        <div className="justify-self-center">
          {layout === "logo-left" ? navBlock : layout === "logo-center" ? logoBlock : null}
        </div>

        {/* Right slot: icons + CTA buttons, logo joins them for logo-right */}
        <div className="flex items-center gap-4 justify-self-end">
          {layout === "logo-right" && logoBlock}
          <div className="flex items-center gap-1">
          {/* Left-positioned CTA buttons (non-sidebar-only) */}
          {(navbar.ctaButtons ?? []).filter((b) => b.navPosition === "left" && !b.showInSidebar).map((btn, i) => {
            const cls = btn.style === "solid"
              ? "rounded px-4 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              : btn.style === "outline"
              ? "rounded border px-4 py-1.5 text-sm font-semibold hover:opacity-80 transition-colors"
              : "rounded px-4 py-1.5 text-sm font-semibold hover:opacity-70";
            const sty = btn.style === "solid"
              ? { backgroundColor: btn.btnBg ?? "var(--accent)", color: btn.btnColor ?? "#fff" }
              : btn.style === "outline"
              ? { borderColor: btn.btnBg ?? "var(--accent)", color: btn.btnColor ?? "var(--accent)" }
              : { color: btn.btnColor ?? "inherit" };
            return <a key={i} href={btn.href} className={cls} style={sty}>{btn.label}</a>;
          })}
          {navbar.showSearch && (
            <button onClick={openSearch} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary" aria-label="Search">
              <SearchIcon size={19} />
            </button>
          )}
          {navbar.showProfileIcon && (
            <a href={navbar.profileLink ?? "/login"} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary" aria-label="Account">
              <ProfileIcon size={21} />
            </a>
          )}
          {navbar.showCart && (
            <button onClick={() => setOpen(true)} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary" aria-label="Open cart">
              <CartIcon size={20} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-medium text-accent-foreground">{count}</span>
              )}
            </button>
          )}
          {/* Right-positioned CTA buttons (non-sidebar-only) — hidden on mobile */}
          {(navbar.ctaButtons ?? []).filter((b) => b.navPosition !== "left" && !b.showInSidebar).map((btn, i) => {
            const cls = btn.style === "solid"
              ? "hidden md:inline-flex rounded px-4 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              : btn.style === "outline"
              ? "hidden md:inline-flex rounded border px-4 py-1.5 text-sm font-semibold hover:opacity-80 transition-colors"
              : "hidden md:inline-flex rounded px-4 py-1.5 text-sm font-semibold hover:opacity-70";
            const sty = btn.style === "solid"
              ? { backgroundColor: btn.btnBg ?? "var(--accent)", color: btn.btnColor ?? "#fff" }
              : btn.style === "outline"
              ? { borderColor: btn.btnBg ?? "var(--accent)", color: btn.btnColor ?? "var(--accent)" }
              : { color: btn.btnColor ?? "inherit" };
            return <a key={i} href={btn.href} className={cls} style={sty}>{btn.label}</a>;
          })}
          </div>
        </div>
      </div>

      {/* ── EXPAND: absolutely-positioned overlay — covers header without shifting layout ── */}
      {searchStyle === "expand" && (
        <div
          className={`absolute inset-0 z-10 hidden items-center bg-background/96 backdrop-blur-sm transition-all duration-200 ease-out md:flex ${
            searchOpen ? "opacity-100 pointer-events-auto translate-x-0" : "opacity-0 pointer-events-none translate-x-4"
          }`}
          style={headerStyle}
        >
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 md:px-6">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && q.trim()) goToSearch(); if (e.key === "Escape") closeSearch(); }}
              placeholder="Search products…"
              className="h-16 flex-1 bg-transparent text-sm focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ("")} className="shrink-0 text-muted-foreground hover:text-foreground">
                <XLg style={{ fontSize: 14 }} />
              </button>
            )}
            <button onClick={closeSearch} className="ml-1 shrink-0 text-xs font-semibold text-primary hover:opacity-70">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── SLIDE: full-width bar below the header row ── */}
      {searchStyle === "slide" && (
        <div className={`overflow-hidden border-b border-border bg-background transition-all duration-300 ease-in-out ${searchOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}>
          <div className="mx-auto max-w-7xl">
            <SearchInput value={q} onChange={setQ} onEnter={goToSearch} onClose={closeSearch} inputRef={searchInputRef} className="border-b border-border" />
            <SearchResults q={q} results={allResults} onPick={goToProduct} onSeeAll={goToSearch} />
          </div>
        </div>
      )}

      {/* ── EXPAND: results drop below the header overlay ── */}
      {searchStyle === "expand" && searchOpen && q.trim() !== "" && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-x-0 top-16 z-[49] hidden md:block" onClick={closeSearch}>
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="overflow-hidden rounded-b-xl border border-t-0 border-border bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
              <SearchResults q={q} results={allResults} onPick={goToProduct} onSeeAll={goToSearch} />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile menu */}
      {mobileOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[200] md:hidden" onClick={closeMobile}>
          <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${mobileVisible ? "opacity-100" : "opacity-0"}`} />
          <div
            className="absolute left-0 top-0 h-full w-72 border-r border-border p-5 shadow-2xl"
            style={{
              backgroundColor: "var(--background)",
              transitionProperty: sidebarAnim === "fade" ? "opacity" : sidebarAnim === "none" ? "none" : "transform",
              transitionDuration: sidebarAnim === "none" ? "0ms" : "300ms",
              transitionTimingFunction: SIDEBAR_EASING[sidebarAnim],
              ...(sidebarAnim === "fade"
                ? { opacity: mobileVisible ? 1 : 0 }
                : { transform: mobileVisible ? "translateX(0)" : "translateX(-100%)" }),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-0.5 text-lg font-semibold">
                {navbar.logoImage && (logoMode === "logo" || logoMode === "both") && (
                  <img src={navbar.logoImage} alt={navbar.brand} style={{ height: `${Math.min(logoHeight, 24)}px`, maxWidth: `${Math.min(logoHeight, 24) * 2.2}px`, objectFit: "contain", objectPosition: "left center" }} />
                )}
                {(logoMode === "text" || logoMode === "both" || !navbar.logoImage) && <span style={brandStyle}>{navbar.brand}</span>}
              </div>
              <button onClick={closeMobile} className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary">
                <XLg style={{ fontSize: 18 }} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navbar.links.map((l, i) => {
                if (l.isButton) {
                  const btnClass =
                    l.btnStyle === "solid"
                      ? "rounded-md px-3 py-2.5 text-sm font-medium bg-accent text-accent-foreground text-center"
                      : l.btnStyle === "outline"
                      ? "rounded-md border border-accent px-3 py-2.5 text-sm font-medium text-accent text-center"
                      : "rounded-md px-3 py-2.5 text-sm hover:bg-secondary";
                  return <a key={i} href={l.href} onClick={closeMobile} className={btnClass}>{l.label}</a>;
                }
                return (
                  <a key={i} href={l.href} onClick={closeMobile} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-secondary">
                    <ListMarker style={navbar.listStyle} index={i} />
                    {l.label}
                  </a>
                );
              })}
              {navbar.showProfileIcon && (
                <a href={navbar.profileLink ?? "/login"} onClick={closeMobile} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-secondary">
                  <ProfileIcon size={18} />
                  <span>My Account</span>
                </a>
              )}
              {/* Sidebar-only CTA buttons */}
              {(navbar.ctaButtons ?? []).filter((b) => b.showInSidebar).map((btn, i) => {
                const cls = btn.style === "solid"
                  ? "rounded-md px-3 py-2.5 text-sm font-medium text-center"
                  : btn.style === "outline"
                  ? "rounded-md border px-3 py-2.5 text-sm font-medium text-center"
                  : "rounded-md px-3 py-2.5 text-sm font-medium text-center";
                const sty = btn.style === "solid"
                  ? { backgroundColor: btn.btnBg ?? "var(--accent)", color: btn.btnColor ?? "#fff" }
                  : btn.style === "outline"
                  ? { borderColor: btn.btnBg ?? "var(--accent)", color: btn.btnColor ?? "var(--accent)" }
                  : { color: btn.btnColor ?? "inherit" };
                return <a key={i} href={btn.href} onClick={closeMobile} className={cls} style={sty}>{btn.label}</a>;
              })}
            </nav>
          </div>
        </div>,
        document.body
      )}

      {/* ── DROPDOWN: floating card, 40% wide, drops from top center ── */}
      {searchStyle === "dropdown" && searchOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-20" onClick={closeSearch}>
          <div className="w-[42%] min-w-[320px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <SearchInput value={q} onChange={setQ} onEnter={goToSearch} onClose={closeSearch} inputRef={searchInputRef} className="border-b border-border" />
            <SearchResults q={q} results={allResults} onPick={goToProduct} onSeeAll={goToSearch} />
          </div>
        </div>,
        document.body
      )}

      {/* ── OVERLAY: full-screen dark backdrop ── */}
      {searchStyle === "overlay" && searchOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24" onClick={closeSearch}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <SearchInput value={q} onChange={setQ} onEnter={goToSearch} onClose={closeSearch} inputRef={searchInputRef} className="border-b border-border" />
            <SearchResults q={q} results={allResults} onPick={goToProduct} onSeeAll={goToSearch} />
          </div>
        </div>,
        document.body
      )}

      {/* ── DRAWER: right-side panel ── */}
      {searchStyle === "drawer" && typeof document !== "undefined" && createPortal(
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${searchOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={closeSearch}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className={`absolute right-0 top-0 h-full w-80 border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-in-out ${searchOpen ? "translate-x-0" : "translate-x-full"}`}
            style={{ backgroundColor: "var(--background)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <SearchInput value={q} onChange={setQ} onEnter={goToSearch} onClose={closeSearch} inputRef={searchInputRef} className="border-b border-border" />
            <SearchResults q={q} results={allResults} onPick={goToProduct} onSeeAll={goToSearch} />
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
