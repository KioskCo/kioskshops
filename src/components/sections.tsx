import { Link as RouterLink, useNavigate, useLocation } from "@tanstack/react-router";
import { ArrowRight, CheckLg, CreditCard2Front, ArrowRepeat, DashLg, PlusLg } from "react-bootstrap-icons";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronDown, ChevronLeft,
  BoxArrowUpRight, Star, StarFill, Heart, HeartFill, Bag, BagPlus, Cart3,
  Check, CheckCircle, Lightning, Fire, Gift, Award, Trophy, Diamond, Stars,
  House, Search, Envelope, Telephone, GeoAlt, Globe, Link45deg,
  PlayCircle, Camera, MusicNote, Box, Truck, Tag, Percent,
  Person, PersonCircle, People, Lock, Shield, Key, Sun, Moon, Cup,
  Instagram, Twitter, Facebook, Whatsapp, Youtube, Tiktok,
  List, XLg, ChevronUp, InfoCircle, ExclamationCircle, QuestionCircle,
  BellFill, CheckCircleFill, XCircle, ThreeDotsVertical,
  Linkedin, Pinterest, Clock,
  Gem as Crown, Grid3x3Gap as Grid, LayoutTextWindow,
  FileText, ChatDots, HandThumbsUp, BookmarkFill, ShareFill,
  CarFrontFill, Leaf, CupHot,
} from "react-bootstrap-icons";
import { useServerFn } from "@tanstack/react-start";
const Link = RouterLink as unknown as React.ComponentType<{ to: string; search?: Record<string, unknown>; className?: string; style?: React.CSSProperties; children?: React.ReactNode }>;
import { ProductCard } from "@/components/product-card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, useCarousel } from "@/components/ui/carousel";
import { formatPrice, NIGERIAN_STATES, type Product } from "@/lib/products";
import { useVendorProducts } from "@/lib/vendorProducts";
import { useCart } from "@/lib/cart";
import {
  ALIGN9_CLASS, PADDING_CLASS, useStorefront, useDesignTokens,
  HEADING_FONT_META, BODY_FONT_META,
  type AnnouncementSection, type HeroSection, type FeaturedProductsSection, type ImageTextSection,
  type RichTextSection, type GallerySection, type CollectionListSection, type NewsletterSection,
  type CtaBannerSection, type TextColumnsSection, type TestimonialsSection, type LogoBarSection,
  type FaqSection, type VideoSection, type SpacerSection, type RelatedProductsSection,
  type SearchSection, type ProductDetailSection, type CheckoutFormSection, type ContactFormSection,
  type ShopGridSection, type CustomHtmlSection, type Section, type SectionAnimation, type ProductCardVariant,
  type AuthLoginSection, type AuthSignupSection, type BuyerOrdersSection, type BuyerReferralsSection,
  type AboutSection, type ContactSection,
  type ReviewsSection, type LookbookSection, type TimelineSection, type BeforeAfterSection, type BundleOfferSection,
  type VideoHeroSection, type SocialFeedSection, type MapLocationSection, type SizeGuideSection, type PortfolioSection,
  type WhatsAppCtaSection, type TrustBadgesSection, type PaymentMethodsSection,
  type ColumnsSection, type ColumnItem, type PricingPlansSection, type PricingPlan,
  type CountdownSection, type StatsSection, type TeamSection,
  type CustomSection, type Block, type BlockAction,
  type VideoBlock, type AccordionBlock, type CountdownBlock,
  type SlideshowBlock, type ProductEmbedBlock, type LayoutBoxBlock,
} from "@/lib/storefront";
import { placeOrder } from "@/lib/checkout.functions";

/**
 * Parse a raw CSS string like "display:flex;gap:16px" into a React CSSProperties object.
 * Supports both semicolon-separated and newline-separated declarations.
 */
function parseCssText(css: string): React.CSSProperties {
  const result: Record<string, string> = {};
  css.split(/[;\n]/).forEach((decl) => {
    const colon = decl.indexOf(":");
    if (colon === -1) return;
    const prop = decl.slice(0, colon).trim();
    const val = decl.slice(colon + 1).trim();
    if (!prop || !val) return;
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camel] = val;
  });
  return result as React.CSSProperties;
}

/** Convert #rrggbb hex to HSL channel string "H S% L%" for use in Tailwind CSS variables. */
function hexToHslChannels(hex: string): string | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/* ── Per-section style override context ────────────────────────────────────
   SectionRenderer provides this so every sub-component can read per-section
   style overrides without prop-drilling.                                   */
// ── Icon registry for section CTA/heading icons (Bootstrap Icons — default for shops) ────
type SectionIconComp = React.FC<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>;
const SECTION_ICON_MAP: Record<string, SectionIconComp> = {
  // Arrows & navigation
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  ChevronRight, ChevronDown, ChevronLeft,
  ExternalLink: BoxArrowUpRight,
  // Commerce & ratings
  Star, StarFill, Heart, HeartFill, Bag, BagPlus, Cart3,
  // Status
  Check, CheckCircle, Lightning, Fire,
  // Special / promotional
  Gift, Award, Trophy, Diamond, Stars,
  // Contact & location
  House, Search, Envelope, Telephone, GeoAlt, Globe, Link: Link45deg,
  // Media & product
  PlayCircle, Camera, MusicNote, Box, Truck, Tag, Percent,
  // People & security
  Person, PersonCircle, People, Lock, Shield, Key,
  // Misc
  Sun, Moon, Cup,
};

type IconDef = { name: string; pos: "left" | "right"; size?: number };

function SectionIcon({ def, fallback }: { def?: IconDef; fallback?: React.ReactNode }) {
  if (!def) return <>{fallback}</>;
  const Icon = SECTION_ICON_MAP[def.name];
  if (!Icon) return <>{fallback}</>;
  return <Icon size={def.size ?? 16} />;
}

// ── Google Fonts loader ───────────────────────────────────────────────────────
const GOOGLE_FONT_FAMILIES = new Set([
  "Playfair Display", "Poppins", "Raleway", "Josefin Sans", "DM Sans", "Lora",
  "Merriweather", "Nunito", "Montserrat", "Oswald", "Roboto", "Bebas Neue",
  "Cormorant Garamond", "Dancing Script", "Inter", "Space Grotesk", "Crimson Text",
  "Cinzel", "Barlow Condensed", "Righteous", "Lobster", "Satisfy", "Sacramento",
  "Abril Fatface", "Pacifico", "Great Vibes",
]);

// The kioskm editor's per-element "Font family" picker (Design tab → pick a part →
// Font family) stores the RN/Expo asset name it needs for its own native preview
// (e.g. "PlayfairDisplay_700Bold"), not a browser-usable family name. Translate
// those to the real Google Fonts display name here so the web renders the same
// font the vendor picked — this covers every option in kioskm's ELEMENT_FONT_OPTIONS.
// "serif"/"monospace" pass through unchanged: they're valid generic CSS keywords.
const RN_FONT_TO_WEB: Record<string, string> = {
  Inter_400Regular: "Inter",
  Inter_700Bold: "Inter",
  PlayfairDisplay_700Bold: "Playfair Display",
  Lora_400Regular: "Lora",
  CormorantGaramond_700Bold: "Cormorant Garamond",
  Cinzel_700Bold: "Cinzel",
  Poppins_600SemiBold: "Poppins",
  Raleway_600SemiBold: "Raleway",
  JosefinSans_600SemiBold: "Josefin Sans",
  Oswald_700Bold: "Oswald",
  Montserrat_700Bold: "Montserrat",
  DancingScript_700Bold: "Dancing Script",
  GreatVibes_400Regular: "Great Vibes",
  Pacifico_400Regular: "Pacifico",
  AbrilFatface_400Regular: "Abril Fatface",
};

function resolveElFontFamily(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  return RN_FONT_TO_WEB[raw] ?? raw;
}

function loadGoogleFont(fontFamily: string) {
  const name = fontFamily.replace(/['"]/g, "").split(",")[0].trim();
  if (!GOOGLE_FONT_FAMILIES.has(name)) return;
  const id = `gf-${name.replace(/\s+/g, "-").toLowerCase()}`;
  if (typeof document === "undefined" || document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id; link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

type SectionOverride = {
  headingColor?: string;
  accentColor?: string;
  fontSize?: "sm" | "md" | "lg" | "xl";
  /** Per-section "Heading font (this section only)" override — a FontHeading key
   * (e.g. "playfair"), same set as the global Typography heading font. */
  headingFont?: string;
  headingWeight?: string;
  headingLetterSpacing?: "tight" | "normal" | "wide" | "wider";
  bodySize?: "xs" | "sm" | "base" | "lg" | "xl";
  bodyLineHeight?: "tight" | "normal" | "relaxed" | "loose";
  elCustomCss?: {
    heading?: string; body?: string; button?: string; image?: string; card?: string;
    eyebrow?: string; subheading?: string; price?: string; productCard?: string; productTitle?: string;
  };
  elStyles?: {
    heading?: React.CSSProperties;
    body?: React.CSSProperties;
    button?: React.CSSProperties;
    image?: React.CSSProperties;
    card?: React.CSSProperties;
    eyebrow?: React.CSSProperties;
    subheading?: React.CSSProperties;
    price?: React.CSSProperties;
    productCard?: React.CSSProperties;
    productTitle?: React.CSSProperties;
  };
  elIcons?: {
    button?: IconDef;
    heading?: IconDef;
  };
};
const SectionOverrideCtx = createContext<SectionOverride>({});

/**
 * Derives CSS utility classes from the active template's design tokens
 * PLUS any per-section overrides set in the inspector.
 * Call once at the top of every section component.
 */
function useSectionStyles() {
  const tokens = useDesignTokens();
  const override = useContext(SectionOverrideCtx);

  const btnRadius =
    tokens.buttonShape === "square" ? "rounded-none" :
    tokens.buttonShape === "rounded" ? "rounded-lg" : "rounded-full";

  const inputRadius =
    tokens.buttonShape === "square" ? "rounded-none" :
    tokens.buttonShape === "rounded" ? "rounded-md" : "rounded-lg";

  // A section's own "Heading font" override wins over the store-wide Typography setting.
  const hMeta = HEADING_FONT_META[override.headingFont ?? tokens.fontHeading ?? "serif"] ?? HEADING_FONT_META.serif;
  const bMeta = BODY_FONT_META[tokens.fontBody ?? "inherit"] ?? BODY_FONT_META["inherit"];
  const headingTransform = tokens.headingCase === "uppercase" ? "uppercase tracking-[0.12em]" : "";
  const hFont = [hMeta.twClass, headingTransform].filter(Boolean).join(" ");

  const cardRadiusMap: Record<string, string> = {
    none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-2xl",
  };
  const cardRadius = cardRadiusMap[tokens.cardRadius ?? "md"];

  // Heading sizes — scale together via the fontSize override
  const sizeMap = {
    sm: { h1: "text-3xl leading-tight md:text-5xl", h2: "text-2xl md:text-3xl" },
    md: { h1: "text-4xl leading-tight md:text-6xl", h2: "text-3xl md:text-4xl" },
    lg: { h1: "text-5xl leading-tight md:text-7xl", h2: "text-4xl md:text-5xl" },
    xl: { h1: "text-6xl leading-tight md:text-8xl", h2: "text-5xl md:text-6xl" },
  };
  const sizes = sizeMap[override.fontSize ?? "md"];

  // Letter-spacing map
  const lsMap: Record<string, string> = { tight: "-0.03em", normal: "0em", wide: "0.06em", wider: "0.12em" };

  // Body-size map (CSS font-size values)
  const bsMap: Record<string, string> = { xs: "0.75rem", sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.25rem" };

  // Line-height map
  const lhMap: Record<string, string> = { tight: "1.25", normal: "1.5", relaxed: "1.75", loose: "2" };

  // Per-element style overrides (element-level wins over section-level).
  // fontFamily is normalized from kioskm's RN font names to real web font names
  // here, once, so every consumer below (and the Google Fonts loader) sees a
  // browser-usable value without each section component needing to know about it.
  const el = useMemo(() => {
    const raw = override.elStyles ?? {};
    const out: Record<string, React.CSSProperties> = {};
    for (const [key, styles] of Object.entries(raw)) {
      if (!styles) continue;
      const ff = (styles as Record<string, unknown>).fontFamily;
      out[key] = ff ? { ...styles, fontFamily: resolveElFontFamily(ff) } : styles;
    }
    return out;
  }, [override.elStyles]);
  const elCss = override.elCustomCss ?? {};
  const elIcons = override.elIcons ?? {};

  // Load any Google Fonts referenced in element style overrides, plus this
  // section's own heading-font override (the store-wide heading/body fonts are
  // already loaded once, globally, by StorefrontProvider).
  useEffect(() => {
    for (const styles of Object.values(el)) {
      const ff = (styles as Record<string, unknown>)?.fontFamily;
      if (typeof ff === "string") loadGoogleFont(ff);
    }
    if (override.headingFont && hMeta.family) loadGoogleFont(hMeta.family);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, override.headingFont]);

  // Helper: parse raw CSS and merge after CSSProperties — raw CSS wins last
  const merge = (base: React.CSSProperties, raw?: string): React.CSSProperties =>
    raw ? { ...base, ...parseCssText(raw) } : base;

  const headingStyle: React.CSSProperties = merge({
    ...(hMeta.family ? { fontFamily: hMeta.family } : {}),
    ...(override.headingColor ? { color: override.headingColor } : {}),
    ...(override.headingWeight ? { fontWeight: override.headingWeight } : {}),
    ...(override.headingLetterSpacing ? { letterSpacing: lsMap[override.headingLetterSpacing] } : {}),
    ...(el.heading ?? {}),
  }, elCss.heading);
  const bodyStyle: React.CSSProperties = merge({
    ...(bMeta.family ? { fontFamily: bMeta.family } : {}),
    ...(override.bodySize ? { fontSize: bsMap[override.bodySize] } : {}),
    ...(override.bodyLineHeight ? { lineHeight: lhMap[override.bodyLineHeight] } : {}),
    ...(el.body ?? {}),
  }, elCss.body);
  const btnStyle: React.CSSProperties = merge({
    ...(override.accentColor ? { backgroundColor: override.accentColor, borderColor: override.accentColor } : {}),
    ...(el.button ?? {}),
  }, elCss.button);
  const imageStyle: React.CSSProperties = merge({ ...(el.image ?? {}) }, elCss.image);
  const cardStyle: React.CSSProperties = merge({ ...(el.card ?? {}) }, elCss.card);
  const eyebrowStyle: React.CSSProperties = merge({ ...(el.eyebrow ?? {}) }, elCss.eyebrow);
  const subheadingStyle: React.CSSProperties = merge({ ...(el.subheading ?? {}) }, elCss.subheading);
  const priceStyle: React.CSSProperties = merge({ ...(el.price ?? {}) }, elCss.price);
  const productCardStyle: React.CSSProperties = merge({ ...(el.productCard ?? {}) }, elCss.productCard);
  const productTitleStyle: React.CSSProperties = merge({
    ...(hMeta.family ? { fontFamily: hMeta.family } : {}),
    ...(el.productTitle ?? {}),
  }, elCss.productTitle);

  const btnBase = `inline-flex items-center gap-2 font-medium transition-opacity hover:opacity-90 ${btnRadius}`;
  return {
    hFont,
    h1: sizes.h1,
    h2: sizes.h2,
    headingStyle,
    bodyStyle,
    btnStyle,
    imageStyle,
    cardStyle,
    eyebrowStyle,
    subheadingStyle,
    priceStyle,
    productCardStyle,
    productTitleStyle,
    cardRadius,
    btnRadius,
    inputRadius,
    btn: `${btnBase} h-12 px-6 text-sm bg-primary text-primary-foreground`,
    btnWhite: `${btnBase} h-12 px-6 text-sm bg-white/95 text-neutral-900 hover:bg-white`,
    btnOutline: `${btnBase} h-11 px-4 text-sm border border-border hover:bg-secondary`,
    tokens,
    override,
    btnIcon: elIcons.button as IconDef | undefined,
    headingIcon: elIcons.heading as IconDef | undefined,
  };
}

function Announcement({ s }: { s: AnnouncementSection }) {
  const content = <div className="mx-auto max-w-7xl px-6 py-2.5 text-center text-xs tracking-wide">{s.text}</div>;
  return (
    <div
      className={!s.bgColor ? "bg-primary text-primary-foreground" : ""}
      style={{ backgroundColor: s.bgColor, color: s.textColor }}
    >
      {s.link ? <Link to={s.link}>{content}</Link> : content}
    </div>
  );
}

/** Scroll-based parallax for hero sections: image shifts at ~94% of scroll speed */
function useHeroParallax(enabled: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  const [ty, setTy] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const sy = window.scrollY;
      const elTop = el.getBoundingClientRect().top + sy;
      const elH = el.offsetHeight;
      const winH = window.innerHeight;
      const lo = Math.max(0, elTop - winH);
      const hi = Math.max(lo + 1, elTop + elH);
      setTy(Math.round(Math.max(0, Math.min(1, (sy - lo) / (hi - lo))) * 40));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [enabled]);
  return { ref, ty };
}

/** Renders a bg media layer (video takes priority over image) */
function HeroMedia({ s, className, style }: { s: HeroSection; className?: string; style?: React.CSSProperties }) {
  const st = useSectionStyles();
  if (s.bgVideo) {
    return (
      <video
        src={s.bgVideo}
        autoPlay
        muted={s.bgVideoMuted !== false}
        loop={s.bgVideoLoop !== false}
        playsInline
        className={className}
        style={{ objectFit: "cover", width: "100%", height: "100%", ...style }}
      />
    );
  }
  if (s.image) {
    return <img src={s.image} alt="" className={className} style={{ ...st.imageStyle, ...style }} />;
  }
  return null;
}

/** Pagination dots for a Carousel — one per slide, active one highlighted, click to jump. Must render inside a <Carousel>. */
function CarouselDots({ count, light }: { count: number; light?: boolean }) {
  const { api } = useCarousel();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  if (count <= 1) return null;
  return (
    <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => api?.scrollTo(i)}
          className={`h-2 rounded-full transition-all ${i === selected ? "w-6" : "w-2"} ${
            light ? (i === selected ? "bg-white" : "bg-white/40 hover:bg-white/60") : (i === selected ? "bg-primary" : "bg-primary/30 hover:bg-primary/50")
          }`}
        />
      ))}
    </div>
  );
}

function Hero({ s }: { s: HeroSection }) {
  const st = useSectionStyles();
  const h = s.height === "sm" ? "h-[50vh] min-h-[360px]" : s.height === "lg" ? "h-[80vh] min-h-[560px]" : "h-[70vh] min-h-[480px]";
  const alignCls = ALIGN9_CLASS[s.align] ?? ALIGN9_CLASS["bottom-left"];

  const parallax = !!(s as any).parallax;
  const { ref: heroRef, ty: pTy } = useHeroParallax(parallax);
  // Applied to full-bleed background images only: starts at translateY=0, shifts +40px as section scrolls off.
  // Parent container must have overflow-hidden (all full-bleed variants already do).
  const pStyle: React.CSSProperties | undefined = parallax ? {
    top: -40,
    height: "calc(100% + 80px)",
    transform: `translateY(${pTy}px)`,
  } : undefined;

  if (s.variant === "carousel") {
    const slides = s.slides && s.slides.length
      ? s.slides
      : [{ eyebrow: s.eyebrow, heading: s.heading, body: s.body, image: s.image, ctaLabel: s.ctaLabel, ctaLink: s.ctaLink }];
    return (
      <section className="relative overflow-hidden" ref={heroRef}>
        <Carousel className="w-full" opts={{ align: "start", loop: true }}>
          <CarouselContent>
            {slides.map((slide, i) => (
              <CarouselItem key={i} className="basis-full">
                <div className={`relative w-full overflow-hidden ${h}`}>
                  {slide.image
                    ? <img src={slide.image} alt={slide.heading ?? ""} className="absolute inset-0 h-full w-full object-cover" style={st.imageStyle} />
                    : <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/10" />}
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
                    {slide.eyebrow && <p className="mb-4 text-xs uppercase tracking-[0.25em] opacity-80" style={st.eyebrowStyle}>{slide.eyebrow}</p>}
                    <h1 className={`${st.h1} ${st.hFont} max-w-4xl`} style={st.headingStyle}>{slide.heading ?? s.heading}</h1>
                    {slide.body && <p className="mx-auto mt-5 max-w-lg text-sm opacity-90 md:text-base" style={st.bodyStyle}>{slide.body}</p>}
                    {slide.ctaLabel && slide.ctaLink && (
                      <Link to={slide.ctaLink} className={`mt-8 ${st.btnWhite}`} style={st.btnStyle}>
                        {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                        {slide.ctaLabel}
                        {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
                      </Link>
                    )}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {s.showCarouselArrows !== false && (
            <>
              <CarouselPrevious className="left-3 border-0 bg-black/30 text-white hover:bg-black/40 hover:text-white" />
              <CarouselNext className="right-3 border-0 bg-black/30 text-white hover:bg-black/40 hover:text-white" />
            </>
          )}
          <CarouselDots count={slides.length} light />
        </Carousel>
      </section>
    );
  }

  if (s.variant === "minimal") {
    return (
      <section className="mx-auto max-w-5xl px-6 py-20 text-center" ref={heroRef}>
        {s.eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
        <h1 className={`mt-4 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
        {s.body && <p className="mx-auto mt-4 max-w-xl text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
        {s.ctaLabel && s.ctaLink && (
          <Link to={s.ctaLink} className={`mt-6 ${st.btn}`} style={st.btnStyle}>
            {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
            {s.ctaLabel}
            {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
          </Link>
        )}
      </section>
    );
  }

  if (s.variant === "split" || s.variant === "split-right") {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2" ref={heroRef}>
        <div className="flex min-h-[400px] flex-col justify-center bg-secondary p-10 md:p-16">
          {s.eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
          <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
          {s.body && <p className="mt-4 max-w-md text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
          {s.ctaLabel && s.ctaLink && (
            <Link to={s.ctaLink} className={`mt-6 w-fit ${st.btn}`} style={st.btnStyle}>
              {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
              {s.ctaLabel}
              {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
            </Link>
          )}
        </div>
        {/* Media only shows on md+ screens */}
        <div className="hidden md:block relative min-h-[400px]">
          {(s.image || s.bgVideo)
            ? <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" />
            : <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          }
        </div>
      </section>
    );
  }

  if (s.variant === "split-left") {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2" ref={heroRef}>
        {/* Media only shows on md+ screens */}
        <div className="hidden md:block relative min-h-[400px]">
          {(s.image || s.bgVideo)
            ? <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" />
            : <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
          }
        </div>
        <div className="flex min-h-[400px] flex-col justify-center bg-secondary p-10 md:p-16">
          {s.eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
          <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
          {s.body && <p className="mt-4 max-w-md text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
          {s.ctaLabel && s.ctaLink && (
            <Link to={s.ctaLink} className={`mt-6 w-fit ${st.btn}`} style={st.btnStyle}>
              {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
              {s.ctaLabel}
              {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (s.variant === "stacked") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-12" ref={heroRef}>
        {(s.image || s.bgVideo)
          ? <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
              <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          : null}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          {s.eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
          <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
          {s.body && <p className="mx-auto mt-4 max-w-xl text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
          {s.ctaLabel && s.ctaLink && (
            <Link to={s.ctaLink} className={`mt-6 inline-flex ${st.btn}`} style={st.btnStyle}>
              {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
              {s.ctaLabel}
              {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (s.variant === "text-only") {
    return (
      <section className={`relative w-full overflow-hidden ${h} flex items-center bg-secondary`} ref={heroRef}>
        <div className={`mx-auto w-full max-w-7xl px-6 ${ALIGN9_CLASS[s.align] ?? ALIGN9_CLASS["bottom-left"]}`}>
          <div className="max-w-2xl">
            {s.eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
            <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
            {s.body && <p className="mt-4 max-w-md text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
            {s.ctaLabel && s.ctaLink && (
              <Link to={s.ctaLink} className={`mt-6 inline-flex ${st.btn}`} style={st.btnStyle}>
                {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                {s.ctaLabel}
                {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (s.variant === "fullscreen") {
    return (
      <section className="relative" ref={heroRef}>
        <div className="relative h-[100vh] min-h-[640px] w-full overflow-hidden">
          <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" style={pStyle} />
          <div className="absolute inset-0 bg-black/40" />
          <div className={`relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 py-12 text-white ${alignCls}`}>
            <div className="max-w-2xl">
              {s.eyebrow && <p className="text-xs uppercase tracking-[0.25em] opacity-80" style={st.eyebrowStyle}>{s.eyebrow}</p>}
              <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
              {s.body && <p className="mt-4 max-w-md text-sm opacity-90 md:text-base" style={st.bodyStyle}>{s.body}</p>}
              {s.ctaLabel && s.ctaLink && (
                <Link to={s.ctaLink} className={`mt-8 ${st.btnWhite}`} style={st.btnStyle}>
                  {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                  {s.ctaLabel}
                  {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (s.variant === "boxed-right" || s.variant === "boxed-left") {
    const imageOnLeft = s.variant === "boxed-left";
    const img = (s.image || s.bgVideo) && (
      <div className="w-28 shrink-0 overflow-hidden rounded-lg shadow-md md:w-40">
        <div className="aspect-[3/4] w-full">
          <HeroMedia s={s} className="h-full w-full object-cover" />
        </div>
      </div>
    );
    return (
      <section className={`w-full ${h} bg-secondary`} ref={heroRef}>
        <div className="mx-auto flex h-full max-w-5xl flex-row items-center gap-6 px-6 py-12 md:gap-10">
          {imageOnLeft ? img : null}
          <div className="flex-1">
            {s.eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
            <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
            {s.body && <p className="mt-4 max-w-md text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
            {s.ctaLabel && s.ctaLink && (
              <Link to={s.ctaLink} className={`mt-6 inline-flex ${st.btn}`} style={st.btnStyle}>
                {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                {s.ctaLabel}
                {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
              </Link>
            )}
          </div>
          {!imageOnLeft ? img : null}
        </div>
      </section>
    );
  }

  if (s.variant === "centered") {
    return (
      <section className="relative" ref={heroRef}>
        <div className={`relative w-full overflow-hidden ${h}`}>
          <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" style={pStyle} />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
            {s.eyebrow && <p className="mb-4 text-xs uppercase tracking-[0.25em] opacity-80" style={st.eyebrowStyle}>{s.eyebrow}</p>}
            <h1 className={`${st.h1} ${st.hFont} max-w-4xl`} style={st.headingStyle}>{s.heading}</h1>
            {s.body && <p className="mx-auto mt-5 max-w-lg text-sm opacity-90 md:text-base" style={st.bodyStyle}>{s.body}</p>}
            {s.ctaLabel && s.ctaLink && (
              <Link to={s.ctaLink} className={`mt-8 ${st.btnWhite}`} style={st.btnStyle}>
                {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                {s.ctaLabel}
                {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (s.variant === "editorial") {
    return (
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-end">
            <div>
              {s.eyebrow && <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
              <h1 className={`${st.h1} ${st.hFont} leading-[0.9]`} style={st.headingStyle}>{s.heading}</h1>
            </div>
            <div className="flex flex-col justify-end pb-2">
              {s.body && <p className="text-lg leading-relaxed text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
              {s.ctaLabel && s.ctaLink && (
                <Link to={s.ctaLink} className={`mt-6 w-fit ${st.btn}`} style={st.btnStyle}>
                  {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                  {s.ctaLabel}
                  {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
                </Link>
              )}
            </div>
          </div>
          {s.image && (
            <div className="mt-12 overflow-hidden rounded-2xl">
              <img src={s.image} alt={s.heading} className="aspect-video w-full object-cover" style={st.imageStyle} />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (s.variant === "magazine") {
    return (
      <section className="overflow-hidden" ref={heroRef}>
        <div className={`relative ${h}`}>
          <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" style={pStyle} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
          <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-16 md:items-center md:pb-0">
            <div className="max-w-xl text-white">
              {s.eyebrow && <p className="mb-3 text-xs uppercase tracking-[0.25em] opacity-70" style={st.eyebrowStyle}>{s.eyebrow}</p>}
              <h1 className={`${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
              {s.body && <p className="mt-5 max-w-sm text-sm leading-relaxed opacity-85" style={st.bodyStyle}>{s.body}</p>}
              {s.ctaLabel && s.ctaLink && (
                <Link to={s.ctaLink} className={`mt-8 ${st.btnWhite}`} style={st.btnStyle}>
                  {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                  {s.ctaLabel}
                  {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (s.variant === "immersive") {
    return (
      <section className="relative min-h-screen overflow-hidden" ref={heroRef}>
        <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" style={pStyle} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center text-white">
          {s.eyebrow && <p className="mb-6 text-xs uppercase tracking-[0.3em] opacity-60" style={st.eyebrowStyle}>{s.eyebrow}</p>}
          <h1 className={`${st.hFont} max-w-5xl leading-[0.88]`} style={{ fontSize: "clamp(3rem,9vw,9rem)", ...st.headingStyle }}>{s.heading}</h1>
          {s.body && <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed opacity-80" style={st.bodyStyle}>{s.body}</p>}
          {s.ctaLabel && s.ctaLink && (
            <Link to={s.ctaLink} className={`mt-10 ${st.btnWhite}`} style={st.btnStyle}>
              {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
              {s.ctaLabel}
              {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (s.variant === "glass") {
    return (
      <section className="relative overflow-hidden" ref={heroRef}>
        <div className={`relative w-full ${h}`}>
          <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" style={pStyle} />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative z-10 flex h-full items-center justify-center px-6">
            <div className="max-w-xl rounded-2xl border border-white/20 bg-white/10 p-8 text-center text-white backdrop-blur-md md:p-12">
              {s.eyebrow && <p className="mb-3 text-xs uppercase tracking-[0.25em] opacity-70" style={st.eyebrowStyle}>{s.eyebrow}</p>}
              <h1 className={`${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
              {s.body && <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed opacity-85" style={st.bodyStyle}>{s.body}</p>}
              {s.ctaLabel && s.ctaLink && (
                <Link to={s.ctaLink} className={`mt-8 ${st.btnWhite}`} style={st.btnStyle}>
                  {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                  {s.ctaLabel}
                  {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (s.variant === "diagonal") {
    return (
      <section className="overflow-hidden" ref={heroRef}>
        <div className={`relative flex ${h}`}>
          <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover object-right" style={pStyle} />
          <div
            className="absolute inset-y-0 left-0 z-10 flex w-full flex-col justify-center px-10 py-16 md:w-2/3 md:px-16"
            style={{ backgroundColor: s.bgColor ?? "hsl(var(--primary))", clipPath: "polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%)" }}
          >
            <div className="max-w-md pr-12 md:pr-20">
              {s.eyebrow && <p className="mb-3 text-xs uppercase tracking-[0.25em] opacity-70" style={{ color: s.textColor ?? "white", ...st.eyebrowStyle }}>{s.eyebrow}</p>}
              <h1 className={`${st.h1} ${st.hFont}`} style={{ color: s.textColor ?? "white", ...st.headingStyle }}>{s.heading}</h1>
              {s.body && <p className="mt-4 text-sm leading-relaxed opacity-85" style={{ color: s.textColor ?? "white" }}>{s.body}</p>}
              {s.ctaLabel && s.ctaLink && (
                <Link to={s.ctaLink} className={`mt-8 w-fit ${st.btnWhite}`} style={st.btnStyle}>
                  {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                  {s.ctaLabel}
                  {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (s.variant === "duo") {
    return (
      <section className="overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ minHeight: "70vh" }}>
          <div className="relative overflow-hidden col-span-1">
            <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="hidden md:flex flex-col items-center justify-center p-10 text-center bg-background">
            {s.eyebrow && <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
            <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
            {s.body && <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed" style={st.bodyStyle}>{s.body}</p>}
            {s.ctaLabel && s.ctaLink && (
              <Link to={s.ctaLink} className={`mt-6 ${st.btn}`} style={st.btnStyle}>
                {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                {s.ctaLabel}
                {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
              </Link>
            )}
          </div>
          <div className="relative overflow-hidden col-span-1 mt-8 self-start md:mt-0 md:self-auto">
            <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center 30%" }} />
          </div>
        </div>
        <div className="md:hidden px-6 py-10 text-center">
          {s.eyebrow && <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.eyebrow}</p>}
          <h1 className={`${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
          {s.body && <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{s.body}</p>}
          {s.ctaLabel && s.ctaLink && (
            <Link to={s.ctaLink} className={`mt-6 ${st.btn}`} style={st.btnStyle}>
              {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
              {s.ctaLabel}
              {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (s.variant === "bold") {
    return (
      <section className={`relative overflow-hidden flex items-center ${h}`} style={{ backgroundColor: s.bgColor ?? "hsl(var(--primary))" }} ref={heroRef}>
        <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover opacity-10" style={pStyle} />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12">
          {s.eyebrow && <p className="mb-4 text-xs uppercase tracking-[0.3em] opacity-60" style={{ color: s.textColor ?? "white" }}>{s.eyebrow}</p>}
          <h1
            className={`${st.hFont} max-w-5xl leading-[0.88]`}
            style={{ fontSize: "clamp(2.5rem,8vw,7rem)", color: s.textColor ?? "white", ...st.headingStyle }}
          >{s.heading}</h1>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
            {s.body && <p className="max-w-sm text-sm leading-relaxed opacity-80" style={{ color: s.textColor ?? "white" }}>{s.body}</p>}
            {s.ctaLabel && s.ctaLink && (
              <Link to={s.ctaLink} className={`w-fit shrink-0 ${st.btnWhite}`} style={st.btnStyle}>
                {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                {s.ctaLabel}
                {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (s.variant === "reveal") {
    return (
      <section className={`overflow-hidden relative flex ${h}`} ref={heroRef}>
        <div className="relative z-10 flex w-full flex-col justify-center bg-background px-8 py-14 md:w-5/12 md:px-14 md:py-0">
          <div className="mb-6 h-1 w-12 bg-primary" />
          {s.eyebrow && <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground" style={st.eyebrowStyle}>{s.eyebrow}</p>}
          <h1 className={`${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
          {s.body && <p className="mt-5 text-sm leading-relaxed text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
          {s.ctaLabel && s.ctaLink && (
            <Link to={s.ctaLink} className={`mt-8 w-fit ${st.btn}`} style={st.btnStyle}>
              {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
              {s.ctaLabel}
              {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
            </Link>
          )}
        </div>
        <div className="absolute inset-y-0 right-0 hidden w-7/12 md:block">
          {(s.image || s.bgVideo)
            ? <HeroMedia s={s} className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary" />
          }
        </div>
      </section>
    );
  }

  // overlay (default)
  return (
    <section className="relative" ref={heroRef}>
      <div className={`relative w-full overflow-hidden ${h}`}>
        <HeroMedia s={s} className="absolute inset-0 h-full w-full object-cover" style={pStyle} />
        <div className="absolute inset-0 bg-black/30" />
        <div className={`relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 py-12 text-white ${alignCls}`}>
          <div className="max-w-2xl">
            {s.eyebrow && <p className="text-xs uppercase tracking-[0.2em] opacity-90" style={st.eyebrowStyle}>{s.eyebrow}</p>}
            <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>
            {s.body && <p className="mt-4 max-w-md text-sm opacity-90 md:text-base" style={st.bodyStyle}>{s.body}</p>}
            {s.ctaLabel && s.ctaLink && (
              <Link to={s.ctaLink} className={`mt-6 ${st.btnWhite}`} style={st.btnStyle}>
                {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                {s.ctaLabel}
                {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts({ s }: { s: FeaturedProductsSection }) {
  const st = useSectionStyles();
  const { products, findProduct } = useVendorProducts();
  // sourceMode "inventory" → the vendor's live products (or the demo fallback until
  // the vendor uploads inventory). Otherwise map the template's product slugs, trying
  // vendor products first and demo products as a fallback.
  const items = (s.sourceMode === "inventory"
    ? products.slice(0, 8)
    : s.productSlugs.map(findProduct).filter(Boolean)
  ) as NonNullable<ReturnType<typeof findProduct>>[];
  const linkPattern = s.productLink ?? "/product/:slug";
  const resolveLink = (slug: string) => linkPattern.replace(/:slug/g, slug);
  const useDefaultLink = linkPattern === "/product/:slug";

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-8">
        {s.heading && <h2 className={`mb-4 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <p className="text-center text-sm text-muted-foreground">No products yet — add some in Inventory</p>
      </section>
    );
  }

  if (s.variant === "list") {
    return (
      <section className="mx-auto max-w-4xl px-6">
        <div className="mb-8 text-center">
          <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
          {s.subheading && <p className="mt-2 text-sm text-muted-foreground">{s.subheading}</p>}
        </div>
        <div className="space-y-6">
          {items.map((p) => (
            <a key={p.slug} href={resolveLink(p.slug)} className={`flex gap-6 border border-border p-4 hover:bg-secondary/40 ${st.cardRadius}`}>
              <img src={p.image} alt={p.name} className={`h-32 w-32 object-cover ${st.cardRadius}`} />
              <div className="flex-1">
                <p className="text-lg font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <p className="mt-3 text-sm font-medium">₦{p.price.toLocaleString("en-NG")}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    );
  }

  const { add } = useCart();
  const cartProps = s.cartBtnStyle ? {
    onAddToCart: (p: any) => { add(p.slug, 1); },
    cartBtnStyle: s.cartBtnStyle,
    cartBtnBg: s.cartBtnBg,
    cartBtnColor: s.cartBtnColor,
    cartBtnLabel: s.cartBtnLabel,
    cartBtnLayout: (s as any).cartBtnLayout ?? "below",
  } : {};
  const cardVariant = s.cardVariant ?? "classic";
  const pcProps = { variant: cardVariant, cardStyle: st.productCardStyle, titleStyle: st.productTitleStyle, priceStyle: st.priceStyle, imageStyle: st.imageStyle, ...cartProps };
  const isHorizontal = cardVariant === "horizontal";
  const card = (p: NonNullable<ReturnType<typeof findProduct>>) =>
    useDefaultLink
      ? <ProductCard key={p.slug} product={p as unknown as Product} {...pcProps} />
      : <ProductCard key={p.slug} product={p as unknown as Product} linkOverride={resolveLink(p.slug)} {...pcProps} />;

  // Desktop column count follows the editor's "Columns" setting; mobile always
  // stacks 2-up regardless, same as before.
  const colClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[s.columns] ?? "sm:grid-cols-4";

  return (
    <section className="mx-auto max-w-7xl px-6">
      <div className="mb-8 text-center">
        <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
        {s.subheading && <p className="mt-2 text-sm text-muted-foreground" style={st.subheadingStyle}>{s.subheading}</p>}
      </div>
      {s.variant === "carousel" ? (
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
          {items.map((p) => (
            <div key={p.slug} className="w-[65%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-3*1.5rem)/4)]">
              {card(p)}
            </div>
          ))}
        </div>
      ) : (
        <div className={isHorizontal ? "flex flex-col gap-4" : `grid grid-cols-2 gap-x-6 gap-y-10 ${colClass}`}>
          {items.map(card)}
        </div>
      )}
    </section>
  );
}

function ImageText({ s }: { s: ImageTextSection }) {
  const st = useSectionStyles();

  if (s.variant === "stacked") {
    return (
      <section className="mx-auto max-w-3xl px-6 text-center">
        <img src={s.image} alt={s.heading} className={`aspect-[16/9] w-full object-cover ${st.cardRadius}`} style={st.imageStyle} />
        <h2 className={`mt-8 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground" style={st.bodyStyle}>{s.body}</p>
        {s.ctaLabel && s.ctaLink && (
          <Link to={s.ctaLink} className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
            {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
            {s.ctaLabel}
            {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
          </Link>
        )}
      </section>
    );
  }

  if (s.variant === "offset") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-4">
        <div className={`grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-16 ${s.imageSide === "left" ? "" : "md:[&>*:first-child]:order-2"}`}>
          <div className="relative">
            <div className={`absolute -inset-4 -z-10 hidden bg-secondary md:block ${st.cardRadius}`} />
            <img src={s.image} alt={s.heading} className={`aspect-[4/5] w-full object-cover md:mt-10 ${st.cardRadius}`} style={st.imageStyle} />
          </div>
          <div>
            <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
            <p className="mt-4 text-muted-foreground" style={st.bodyStyle}>{s.body}</p>
            {s.ctaLabel && s.ctaLink && (
              <Link to={s.ctaLink} className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
                {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                {s.ctaLabel}
                {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  // side-by-side (default)
  return (
    <section className="mx-auto max-w-7xl px-6">
      <div className={`grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16 ${s.imageSide === "left" ? "" : "md:[&>*:first-child]:order-2"}`}>
        <img src={s.image} alt={s.heading} className={`aspect-[4/5] w-full object-cover ${st.cardRadius}`} style={st.imageStyle} />
        <div>
          <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
          <p className="mt-4 text-muted-foreground" style={st.bodyStyle}>{s.body}</p>
          {s.ctaLabel && s.ctaLink && (
            <Link to={s.ctaLink} className="mt-6 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
              {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
              {s.ctaLabel}
              {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function RichText({ s }: { s: RichTextSection }) {
  const st = useSectionStyles();
  const variant = (s as any).variant ?? "paragraph";
  const al = s.align === "center" ? "text-center" : s.align === "right" ? "text-right" : "text-left";

  // QUOTE: large pull-quote with accent left border
  if (variant === "quote") {
    return (
      <section className="mx-auto max-w-2xl px-6">
        <div className="flex gap-5 items-start">
          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: st.headingStyle.color ?? "var(--primary)" }} />
          <blockquote>
            <p className="text-xl italic font-semibold leading-relaxed" style={st.headingStyle}>"{s.body}"</p>
            {s.heading && <cite className="block mt-3 text-sm not-italic text-muted-foreground" style={st.bodyStyle}>— {s.heading}</cite>}
          </blockquote>
        </div>
      </section>
    );
  }

  // CARD: text inside a bordered card
  if (variant === "card") {
    return (
      <section className="mx-auto max-w-2xl px-6">
        <div className="border rounded-xl p-8" style={st.cardStyle}>
          {s.heading && <h2 className={`${st.h2} ${st.hFont} mb-4 ${al}`} style={st.headingStyle}>{s.heading}</h2>}
          <p className={`whitespace-pre-line text-muted-foreground ${al}`} style={st.bodyStyle}>{s.body}</p>
        </div>
      </section>
    );
  }

  // ARTICLE: drop-cap first letter, magazine-style
  if (variant === "article") {
    const firstChar = s.body?.[0] ?? "";
    const rest = s.body?.slice(1) ?? "";
    return (
      <section className="mx-auto max-w-2xl px-6">
        {s.heading && <h2 className={`${st.h2} ${st.hFont} mb-6`} style={st.headingStyle}>{s.heading}</h2>}
        <p className="leading-relaxed text-base text-muted-foreground" style={st.bodyStyle}>
          <span className="float-left text-7xl font-black leading-none mr-2 -mt-1" style={{ color: st.headingStyle.color ?? "inherit" }}>{firstChar}</span>
          {rest}
        </p>
      </section>
    );
  }

  // PARAGRAPH (default)
  return (
    <section className="mx-auto max-w-3xl px-6">
      <div className={al}>
        {s.heading && <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <p className="mt-4 whitespace-pre-line text-muted-foreground leading-relaxed" style={st.bodyStyle}>{s.body}</p>
      </div>
    </section>
  );
}

function Gallery({ s }: { s: GallerySection }) {
  const st = useSectionStyles();
  const cols = s.columns ?? 3;
  const c = cols === 2 ? "md:grid-cols-2" : cols === 4 ? "md:grid-cols-4" : "md:grid-cols-3";
  const variant = s.variant ?? "grid";

  // ── masonry: 3-column layout with alternating heights ──
  if (variant === "masonry") {
    const colGroups = [s.images.filter((_, i) => i % 3 === 0), s.images.filter((_, i) => i % 3 === 1), s.images.filter((_, i) => i % 3 === 2)];
    const heights = ["aspect-square", "aspect-[3/4]", "aspect-[4/3]", "aspect-[3/5]"];
    return (
      <section className="mx-auto max-w-7xl px-6">
        {s.heading && <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className="flex gap-4">
          {colGroups.map((imgs, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-4">
              {imgs.map((src, i) => (
                <div key={i} className={`overflow-hidden ${heights[(ci * 2 + i) % heights.length]} ${st.cardRadius}`} style={st.imageStyle}>
                  <img src={src} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ── featured: first image full-width, rest in grid ──
  if (variant === "featured") {
    const [first, ...rest] = s.images;
    return (
      <section className="mx-auto max-w-7xl px-6">
        {s.heading && <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {first && (
          <div className={`mb-4 overflow-hidden aspect-[16/7] ${st.cardRadius}`} style={st.imageStyle}>
            <img src={first} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        )}
        {rest.length > 0 && (
          <div className={`grid grid-cols-2 gap-4 ${c}`}>
            {rest.map((src, i) => (
              <div key={i} className={`overflow-hidden aspect-square ${st.cardRadius}`} style={st.imageStyle}>
                <img src={src} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  // ── minimal: edge-to-edge, no gaps, no radius ──
  if (variant === "minimal") {
    const minCols = cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-4" : "grid-cols-3";
    return (
      <section>
        {s.heading && <h2 className={`px-6 pb-4 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className={`grid ${minCols}`}>
          {s.images.map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden">
              <img src={src} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ── grid (default) ──
  return (
    <section className="mx-auto max-w-7xl px-6">
      {s.heading && <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className={`grid grid-cols-2 gap-4 ${c}`}>
        {s.images.map((src, i) => (
          <div key={i} className={`overflow-hidden aspect-square ${st.cardRadius}`} style={st.imageStyle}>
            <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        ))}
      </div>
    </section>
  );
}

function CollectionList({ s }: { s: CollectionListSection }) {
  const st = useSectionStyles();
  const cardRadiusStyle = s.borderRadius !== undefined ? { borderRadius: s.borderRadius } : undefined;
  const cardRadiusCls = cardRadiusStyle ? "" : st.cardRadius;
  const isScroller = (s as any).variant === "scroller";

  const item = (it: (typeof s.items)[number], i: number, className: string) => {
    const [linkPath, linkQs] = it.link.split("?");
    const linkSearch = linkQs ? Object.fromEntries(new URLSearchParams(linkQs)) : undefined;
    return (
      <Link key={i} to={linkPath as any} search={linkSearch as any} className={`group block ${className}`}>
        <div className={`aspect-square overflow-hidden bg-secondary ${cardRadiusCls}`} style={{ ...st.cardStyle, ...cardRadiusStyle }}>
          <img src={it.image} alt={it.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <p className="mt-3 text-center text-sm font-medium" style={st.productTitleStyle}>{it.label}</p>
      </Link>
    );
  };

  if (isScroller) {
    return (
      <section className="mx-auto max-w-7xl">
        <h2 className={`mb-8 px-6 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2">
          {s.items.map((it, i) => item(it, i, "w-36 shrink-0 snap-start sm:w-44"))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6">
      <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {s.items.map((it, i) => item(it, i, ""))}
      </div>
    </section>
  );
}

function Newsletter({ s, vendorId }: { s: NewsletterSection; vendorId?: string }) {
  const st = useSectionStyles();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem("nl-email") as HTMLInputElement)?.value;
    if (!email) return;
    setLoading(true);
    try {
      if (vendorId) {
        const base = (import.meta.env["VITE_API_BASE"] as string | undefined) ?? "/api";
        await fetch(`${base}/customers/newsletter/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorId, email, source: "shop" }),
        });
      } else if (s.webhookUrl) {
        await fetch(s.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      }
    } catch { /* fail silently */ }
    setLoading(false);
    setSubmitted(true);
  };

  const sectionCls = !s.bgColor ? "bg-secondary" : "";
  const sectionStyle = { backgroundColor: s.bgColor, color: s.textColor };

  if (submitted) {
    return (
      <section className={sectionCls} style={sectionStyle}>
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 ${st.cardRadius}`}>
            <CheckLg size={20} className="text-primary" />
          </div>
          <h2 className={`text-2xl ${st.hFont}`} style={st.headingStyle}>You're in!</h2>
          <p className="mt-2 text-muted-foreground">
            {s.successMessage ?? "Thanks for subscribing. We'll be in touch soon."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionCls} style={sectionStyle}>
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
        {s.body && <p className="mt-3 text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
        <form className="mx-auto mt-6 flex max-w-md gap-2" onSubmit={handleSubmit}>
          <input
            name="nl-email"
            type="email" required
            placeholder="you@email.com"
            className={`h-11 flex-1 border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${st.inputRadius}`}
          />
          <button
            type="submit" disabled={loading}
            className={`h-11 px-5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 ${st.btnRadius}`}
            style={st.btnStyle}
          >
            {loading ? "…" : s.buttonLabel}
          </button>
        </form>
      </div>
    </section>
  );
}

function CtaBanner({ s }: { s: CtaBannerSection }) {
  const st = useSectionStyles();
  const bg = s.bgColor ? "" : (s.background === "muted" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground");
  const style = { backgroundColor: s.bgColor, color: s.textColor };

  if (s.variant === "split") {
    return (
      <section className={`grid grid-cols-1 md:grid-cols-2 ${bg}`} style={style}>
        {s.image && <img src={s.image} alt="" className="h-64 w-full object-cover md:h-full" />}
        <div className="flex flex-col justify-center p-10 md:p-16">
          <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
          {s.body && <p className="mt-3 opacity-90" style={st.bodyStyle}>{s.body}</p>}
          <Link to={s.ctaLink} className={`mt-6 w-fit ${st.btnWhite}`}>
            {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
            {s.ctaLabel}
            {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={bg} style={style}>
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-16 text-center md:flex-row md:justify-between md:text-left">
        <div className="max-w-2xl">
          <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
          {s.body && <p className="mt-2 opacity-90" style={st.bodyStyle}>{s.body}</p>}
        </div>
        <Link to={s.ctaLink} className={`shrink-0 ${st.btnWhite}`}>
          {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
          {s.ctaLabel}
          {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
        </Link>
      </div>
    </section>
  );
}

function TextColumns({ s }: { s: TextColumnsSection }) {
  const st = useSectionStyles();
  const variant = (s as any).variant ?? "cards";

  if (variant === "icons") {
    return (
      <section className="mx-auto max-w-7xl px-6">
        {s.heading && <h2 className={`mb-12 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-3">
          {s.columns.map((c, i) => (
            <div key={i}>
              {c.icon && (
                <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center bg-secondary ${st.cardRadius}`}>
                  <img src={c.icon} alt="" className="h-8 w-8 object-contain" />
                </div>
              )}
              <h3 className={`text-lg ${st.hFont}`} style={st.headingStyle}>{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground" style={st.bodyStyle}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "minimal") {
    return (
      <section className="mx-auto max-w-5xl px-6">
        {s.heading && <h2 className={`mb-10 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3">
          {s.columns.map((c, i) => (
            <div key={i} className="flex gap-4">
              {c.icon && <img src={c.icon} alt="" className="h-6 w-6 shrink-0 object-contain" />}
              <div>
                <h3 className={`font-semibold ${st.hFont}`} style={st.headingStyle}>{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground" style={st.bodyStyle}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // cards (default)
  return (
    <section className="mx-auto max-w-7xl px-6">
      {s.heading && <h2 className={`mb-10 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {s.columns.map((c, i) => (
          <div key={i} className={`border border-border p-6 ${st.cardRadius}`} style={st.cardStyle}>
            {c.icon && <img src={c.icon} alt="" className="mb-4 h-10 w-10 object-contain" />}
            <h3 className={`text-lg ${st.hFont}`} style={st.headingStyle}>{c.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground" style={st.bodyStyle}>{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials({ s, vendorId }: { s: TestimonialsSection; vendorId?: string }) {
  const st = useSectionStyles();
  const [liveItems, setLiveItems] = useState<{ quote: string; author: string; role?: string }[]>([]);

  useEffect(() => {
    if (!s.useLiveReviews || !vendorId) return;
    const base = (import.meta.env as any)["VITE_API_BASE"] ?? "/api";
    fetch(`${base}/reviews/top?vendorId=${encodeURIComponent(vendorId)}&limit=3`)
      .then((r) => r.json())
      .then((res: any) => {
        if (Array.isArray(res?.data)) {
          setLiveItems(res.data.filter((r: any) => r.body).map((r: any) => ({
            quote: r.body as string,
            author: r.buyerName ?? "Customer",
            role: `${"★".repeat(Math.max(1, Math.min(5, Number(r.rating))))} · Verified buyer`,
          })));
        }
      })
      .catch(() => null);
  }, [s.useLiveReviews, vendorId]);

  const items = s.useLiveReviews
    ? (liveItems.length > 0 ? liveItems : s.items)
    : s.items;

  if (s.variant === "quotes") {
    return (
      <section className="mx-auto max-w-4xl px-6 text-center">
        {s.heading && <h2 className={`mb-10 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className="space-y-8">
          {items.map((t, i) => (
            <figure key={i}>
              <blockquote className="text-xl italic leading-relaxed md:text-2xl">"{t.quote}"</blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground">— {t.author}{t.role ? `, ${t.role}` : ""}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    );
  }

  const isGrid = s.variant === "grid";
  return (
    <section className="mx-auto max-w-7xl px-6">
      {s.heading && <h2 className={`mb-10 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className={isGrid ? "grid grid-cols-2 gap-4 sm:grid-cols-3" : "grid grid-cols-1 gap-6 md:grid-cols-2"}>
        {items.map((t, i) => (
          <figure key={i} className={`border border-border bg-card ${isGrid ? "p-4" : "p-6"} ${st.cardRadius}`} style={st.cardStyle}>
            <blockquote className={isGrid ? "text-sm leading-relaxed" : "text-base leading-relaxed"}>"{t.quote}"</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              {"avatar" in t && (t as any).avatar && <img src={(t as any).avatar} alt="" className="h-9 w-9 rounded-full object-cover" />}
              <div>
                <p className="text-sm font-medium">{t.author}</p>
                {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function LogoBar({ s }: { s: LogoBarSection }) {
  return (
    <section className="mx-auto max-w-7xl px-6">
      {s.heading && <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.heading}</p>}
      <div className="grid grid-cols-2 items-center gap-8 opacity-70 md:grid-cols-4">
        {s.logos.map((l, i) => <img key={i} src={l.src} alt={l.alt} className="mx-auto h-10 w-auto object-contain grayscale" />)}
      </div>
    </section>
  );
}

function Faq({ s }: { s: FaqSection }) {
  const st = useSectionStyles();
  return (
    <section className="mx-auto max-w-3xl px-6">
      <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
      <div className={`divide-y divide-border border border-border ${st.cardRadius}`}>
        {s.items.map((it, i) => (
          <details key={i} className="group p-5">
            <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
              {it.question}
              <span className="text-muted-foreground transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{it.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Video({ s }: { s: VideoSection }) {
  const st = useSectionStyles();
  return (
    <section className="mx-auto max-w-5xl px-6">
      {s.heading && <h2 className={`mb-6 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className={`aspect-video w-full overflow-hidden bg-black ${st.cardRadius}`}>
        <iframe src={s.url} className="h-full w-full" allow="autoplay; encrypted-media" allowFullScreen />
      </div>
    </section>
  );
}

function Spacer({ s }: { s: SpacerSection }) {
  const h = s.size === "sm" ? "h-8" : s.size === "lg" ? "h-24" : s.size === "xl" ? "h-40" : "h-16";
  return <div className={h} />;
}

function RelatedProducts({ s }: { s: RelatedProductsSection }) {
  const st = useSectionStyles();
  const { products: vendorProducts, findProduct } = useVendorProducts();
  const location = useLocation();
  // If on a /product/:slug page, use the URL slug as source so related products
  // are always relevant to the product currently being viewed
  const urlSlug = location.pathname.match(/\/product\/([^/?#]+)/)?.[1];
  const effectiveSlug = urlSlug ?? s.sourceSlug;
  const source = findProduct(effectiveSlug);
  const toks = new Set((source?.name ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 2));
  const scored = vendorProducts
    .filter((p) => p.slug !== effectiveSlug && p.id !== effectiveSlug)
    .map((p) => {
      const pt = new Set(p.name.toLowerCase().split(/\s+/));
      let score = 0;
      toks.forEach((t) => { if (pt.has(t)) score++; });
      if (source && p.category === source.category) score += 0.5;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, s.limit);
  const pcProps = { cardStyle: st.productCardStyle, titleStyle: st.productTitleStyle, priceStyle: st.priceStyle, imageStyle: st.imageStyle };
  return (
    <section className="mx-auto max-w-7xl px-6">
      <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {scored.map(({ p }) => <ProductCard key={p.slug} product={p} {...pcProps} />)}
      </div>
    </section>
  );
}

function SearchInline({ s }: { s: SearchSection }) {
  const st = useSectionStyles();
  const { products: vendorProducts } = useVendorProducts();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const results = vendorProducts.filter((p) =>
    (q.trim() === "" || (p.name + " " + (p.description ?? "")).toLowerCase().includes(q.toLowerCase())) &&
    (category === "" || p.category === category),
  );
  return (
    <section className="mx-auto max-w-7xl px-6">
      {s.heading && <h2 className={`mb-6 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className="mx-auto mb-8 flex max-w-2xl flex-col gap-2 md:flex-row">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={s.placeholder ?? "Search…"}
          className={`h-11 flex-1 border border-input bg-background px-3 text-sm ${st.inputRadius}`}
        />
        {s.showFilters && (
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className={`h-11 border border-input bg-background px-3 text-sm ${st.inputRadius}`}
          >
            <option value="">All categories</option>
            <option>Home</option><option>Apparel</option><option>Accessories</option><option>Tech</option>
          </select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {results.map((p) => <ProductCard key={p.slug} product={p} cardStyle={st.productCardStyle} titleStyle={st.productTitleStyle} priceStyle={st.priceStyle} imageStyle={st.imageStyle} />)}
      </div>
      {results.length === 0 && <p className="text-center text-sm text-muted-foreground">No products match.</p>}
    </section>
  );
}

function ProductDetailSectionView({ s }: { s: ProductDetailSection }) {
  const st = useSectionStyles();
  const location = useLocation();
  const { findProduct } = useVendorProducts();
  const urlSlug = /^\/product\/([^/?#]+)/.exec(location.pathname)?.[1];
  const product = findProduct(urlSlug ?? s.productSlug);
  const { add, setOpen } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  if (!product) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Product not found. On live product pages this auto-detects from the URL.</div>;
  }

  // Merge editor extra images + product's own DB images
  const productImages: string[] = Array.isArray((product as any).images) ? (product as any).images : [];
  const gallery = [product.image, ...s.extraImages.filter(Boolean), ...productImages.filter(Boolean)]
    .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe
    .slice(0, 5);

  const onAdd = () => {
    add(product.slug, qty);
    setAdded(true);
    setOpen(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const thumbnailStrip = gallery.length > 1 && (
    <div className="mt-3 grid grid-cols-4 gap-2">
      {gallery.map((img, i) => (
        <button key={i} onClick={() => setActiveImg(i)}
          className={`overflow-hidden border-2 transition-colors ${st.cardRadius} ${activeImg === i ? "border-primary" : "border-transparent hover:border-border"}`}>
          <img src={img} alt="" className="aspect-square w-full object-cover" />
        </button>
      ))}
    </div>
  );

  const addToCartRow = (
    <div className="mt-10 flex items-center gap-4">
      <div className={`inline-flex h-12 items-center overflow-hidden border border-border ${st.btnRadius}`}>
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-full px-4 hover:bg-secondary" aria-label="Decrease"><DashLg size={16} /></button>
        <span className="min-w-10 text-center text-sm">{qty}</span>
        <button onClick={() => setQty((q) => q + 1)} className="h-full px-4 hover:bg-secondary" aria-label="Increase"><PlusLg size={16} /></button>
      </div>
      <button onClick={onAdd}
        className={`inline-flex h-12 flex-1 items-center justify-center gap-2 px-6 text-sm bg-primary text-primary-foreground transition-opacity hover:opacity-90 ${st.btnRadius}`}
        style={st.btnStyle}>
        {added ? (<><CheckLg size={16} /> Added</>) : <>Add to bag — {formatPrice(product.price * qty)}</>}
      </button>
    </div>
  );

  const variant = s.variant ?? "classic";

  // ── Layout: editorial (full-width image top, text below) ──
  if (variant === "editorial") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className={`overflow-hidden bg-secondary ${st.cardRadius} aspect-video md:aspect-[21/9]`}>
          <img src={gallery[activeImg]} alt={product.name} className="h-full w-full object-cover" />
        </div>
        {thumbnailStrip}
        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category}</p>
            <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{product.name}</h1>
            <p className="mt-3 text-lg text-muted-foreground" style={st.bodyStyle}>{product.tagline}</p>
            <p className={`mt-6 text-3xl ${st.hFont}`} style={st.priceStyle}>{formatPrice(product.price)}</p>
          </div>
          <div>
            <p className="leading-relaxed text-foreground/80">{product.description}</p>
            {addToCartRow}
          </div>
        </div>
      </section>
    );
  }

  // ── Layout: gallery-left (vertical strip + large image + text) ──
  if (variant === "gallery-left") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-12 md:flex-row md:gap-8">
          {gallery.length > 1 && (
            <div className="flex flex-row gap-2 md:flex-col md:w-20 shrink-0">
              {gallery.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`overflow-hidden border-2 transition-colors ${st.cardRadius} ${activeImg === i ? "border-primary" : "border-transparent hover:border-border"}`}>
                  <img src={img} alt="" className="aspect-square w-16 md:w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className={`flex-1 overflow-hidden bg-secondary ${st.cardRadius}`}>
            <img src={gallery[activeImg]} alt={product.name} className="aspect-square w-full object-cover" />
          </div>
          <div className="flex flex-col md:w-96 shrink-0">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category}</p>
            <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{product.name}</h1>
            <p className="mt-3 text-lg text-muted-foreground" style={st.bodyStyle}>{product.tagline}</p>
            <p className={`mt-6 text-3xl ${st.hFont}`} style={st.priceStyle}>{formatPrice(product.price)}</p>
            <p className="mt-8 leading-relaxed text-foreground/80">{product.description}</p>
            {addToCartRow}
          </div>
        </div>
      </section>
    );
  }

  // ── Layout: minimal (centered, clean) ──
  if (variant === "minimal") {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category}</p>
        <h1 className={`mt-4 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{product.name}</h1>
        <p className={`mt-4 text-3xl ${st.hFont}`} style={st.priceStyle}>{formatPrice(product.price)}</p>
        <div className={`mt-8 overflow-hidden bg-secondary ${st.cardRadius} mx-auto max-w-sm`}>
          <img src={gallery[activeImg]} alt={product.name} className="aspect-square w-full object-cover" />
        </div>
        {thumbnailStrip}
        <p className="mt-8 leading-relaxed text-foreground/80 text-left">{product.description}</p>
        <div className="mt-8 flex justify-center gap-4">
          <div className={`inline-flex h-12 items-center overflow-hidden border border-border ${st.btnRadius}`}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-full px-4 hover:bg-secondary" aria-label="Decrease"><DashLg size={16} /></button>
            <span className="min-w-10 text-center text-sm">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="h-full px-4 hover:bg-secondary" aria-label="Increase"><PlusLg size={16} /></button>
          </div>
          <button onClick={onAdd}
            className={`inline-flex h-12 items-center justify-center gap-2 px-8 text-sm bg-primary text-primary-foreground transition-opacity hover:opacity-90 ${st.btnRadius}`}
            style={st.btnStyle}>
            {added ? (<><CheckLg size={16} /> Added</>) : "Add to bag"}
          </button>
        </div>
      </section>
    );
  }

  // ── Layout: classic (default 2-col) ──
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <div className={`overflow-hidden bg-secondary ${st.cardRadius}`}>
            <img src={gallery[activeImg]} alt={product.name} className="aspect-square w-full object-cover" />
          </div>
          {thumbnailStrip}
        </div>
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category}</p>
          <h1 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{product.name}</h1>
          <p className="mt-3 text-lg text-muted-foreground" style={st.bodyStyle}>{product.tagline}</p>
          <p className={`mt-6 text-3xl ${st.hFont}`} style={st.priceStyle}>{formatPrice(product.price)}</p>
          <p className="mt-8 leading-relaxed text-foreground/80">{product.description}</p>
          {addToCartRow}
          <ul className="mt-10 space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
            <li>• Free carbon-neutral shipping over ₦15,000</li>
            <li>• Lifetime repair guarantee</li>
            <li>• 30-day easy returns</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function CheckoutFormSectionView({ s, vendorId }: { s: CheckoutFormSection; vendorId?: string }) {
  const st = useSectionStyles();
  const { detailed, items, subtotal, clear } = useCart();
  const { paymentConfig, deliveryFees } = useStorefront();
  const placeOrderFn = useServerFn(placeOrder);
  const navigate = useNavigate();
  const [done, setDone] = useState<{ orderNumber: string; total: number; escrowPin?: string } | null>(null);
  const [pinCopied, setPinCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyerState, setBuyerState] = useState("Lagos");
  const provider = paymentConfig.provider === "both" ? "paystack" : paymentConfig.provider;
  // Location-aware shipping matching the server's resolveDeliveryZone —
  // Lagos = local rate, other states = inter-state, using the vendor's own rates.
  const shipping = subtotal >= deliveryFees.freeThreshold || subtotal === 0 ? 0 : buyerState.toLowerCase() === "lagos" ? deliveryFees.lagos : deliveryFees.other;
  const saleTotal = subtotal + shipping;
  const processingFee = saleTotal > 0 ? Math.ceil(saleTotal * (provider === "flutterwave" ? 0.014 : 0.015) + 100) : 0;
  const total = saleTotal + processingFee;

  function loadScript(src: string): Promise<void> {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const el = document.createElement("script");
      el.src = src; el.onload = () => resolve(); el.onerror = () => resolve();
      document.head.appendChild(el);
    });
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null); setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("cf-email") || "");
    const phone = String(fd.get("cf-phone") || "");
    const full_name = `${fd.get("cf-first") || ""} ${fd.get("cf-last") || ""}`.trim();
    const address = String(fd.get("cf-address") || "");
    const city = String(fd.get("cf-city") || "");
    const zip = String(fd.get("cf-zip") || "");
    // Use detailed items to send the real product UUID (id), not slug
    const orderItems = detailed.map((d) => ({ productId: d.product.id, name: d.product.name, qty: d.qty }));

    const fin = async (paymentRef?: string, paymentProvider?: string) => {
      try {
        const result = await placeOrderFn({ data: { vendorId, email, phone, full_name, address, city, state: buyerState, zip, items: orderItems, paymentRef, paymentProvider } });
        setDone(result); clear();
      } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
      finally { setSubmitting(false); }
    };

    if (provider === "flutterwave") {
      const fwKey = (import.meta.env as any).VITE_FLUTTERWAVE_PUBLIC_KEY as string | undefined;
      if (!fwKey) { setError("Flutterwave is not configured. Contact the site administrator."); setSubmitting(false); return; }
      await loadScript("https://checkout.flutterwave.com/v3.js");
      const fw = (window as any).FlutterwaveCheckout;
      if (!fw) { setError("Flutterwave SDK failed to load."); setSubmitting(false); return; }
      fw({ public_key: fwKey, tx_ref: `ORDER-${Date.now()}`, amount: total, currency: paymentConfig.currency || "NGN",
        customer: { email, name: full_name },
        customizations: { title: "Checkout", description: "Order payment" },
        callback: async (data: any) => { if (data.status === "successful" || data.status === "completed") await fin(data.tx_ref ?? String(data.transaction_id), "flutterwave"); else { setError("Payment not completed."); setSubmitting(false); } },
        onclose: () => setSubmitting(false),
      });
      return;
    }
    if (provider === "paystack") {
      const psKey = (import.meta.env as any).VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
      if (!psKey) { setError("Paystack is not configured. Contact the site administrator."); setSubmitting(false); return; }
      await loadScript("https://js.paystack.co/v1/inline.js");
      const PS = (window as any).PaystackPop;
      if (!PS) { setError("Paystack SDK failed to load."); setSubmitting(false); return; }
      PS.setup({ key: psKey, email, amount: Math.round(total * 100), currency: paymentConfig.currency || "NGN", ref: `ORDER-${Date.now()}`,
        callback: async (r: any) => await fin(r.reference, "paystack"), onClose: () => setSubmitting(false),
      }).openIframe();
      return;
    }
    await fin(undefined, "none");
  };

  const CfInput = ({ name, label, ...props }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input name={name} {...props} className={`mt-1 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent ${st.inputRadius}`} />
    </label>
  );

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600"><CheckLg size={24} /></div>
        <h2 className={`mt-6 text-4xl ${st.hFont}`} style={st.headingStyle}>Order confirmed!</h2>
        <p className="mt-3 text-muted-foreground">A confirmation email is on its way to your inbox.</p>

        {done.escrowPin && (
          <div className="mt-8 rounded-2xl border-2 border-primary/30 bg-primary/5 px-6 py-6">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Your Delivery PIN</p>
            <div className="flex items-center justify-center gap-4">
              <span className="font-mono text-5xl font-bold tracking-[0.3em] text-foreground">{done.escrowPin}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(done.escrowPin!); setPinCopied(true); setTimeout(() => setPinCopied(false), 2000); }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-secondary"
              >
                {pinCopied ? <CheckLg size={16} className="text-green-600" /> : <CreditCard2Front size={16} />}
              </button>
            </div>
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-1">Important</p>
              <p className="text-sm text-amber-700">Give this PIN to the <strong>delivery rider</strong> when your order arrives. Only share it once you have your order in hand.</p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Also sent to your email.</p>
          </div>
        )}

        <div className={`mt-6 inline-flex flex-col gap-1 border border-border bg-secondary/40 px-6 py-4 text-sm ${st.cardRadius}`}>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Order</span>
          <span className="font-mono text-base">{done.orderNumber}</span>
          <span className={`mt-1 text-2xl ${st.hFont}`}>{formatPrice(done.total)}</span>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <RouterLink to="/order/$orderNumber" params={{ orderNumber: done.orderNumber }} className={`inline-flex h-11 items-center px-6 text-sm bg-primary text-primary-foreground hover:opacity-90 ${st.btnRadius}`} style={st.btnStyle}>
            Track your order
          </RouterLink>
          <button onClick={() => navigate({ to: "/" })} className="text-sm text-muted-foreground hover:text-foreground underline">Back to home</button>
        </div>
      </div>
    );
  }

  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <CreditCard2Front size={40} className="mx-auto text-muted-foreground" />
        <h2 className={`mt-4 text-3xl ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Checkout"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your cart is empty. Add products to proceed.</p>
        <Link to="/shop" search={{ category: "" }} className={`mt-6 inline-flex h-11 items-center px-6 text-sm bg-primary text-primary-foreground ${st.btnRadius}`} style={st.btnStyle}>Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {s.heading && <h2 className={`mb-10 text-4xl ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
        <form onSubmit={onSubmit} className="space-y-8">
          <fieldset className="space-y-4">
            <legend className={`text-2xl ${st.hFont}`}>Contact</legend>
            <CfInput name="cf-email" label="Email" type="email" required />
            <CfInput name="cf-phone" label="Phone number" type="tel" placeholder="e.g. 08012345678" />
          </fieldset>
          <fieldset className="space-y-4">
            <legend className={`text-2xl ${st.hFont}`}>Shipping</legend>
            <div className="grid grid-cols-2 gap-4">
              <CfInput name="cf-first" label="First name" required />
              <CfInput name="cf-last" label="Last name" required />
            </div>
            <CfInput name="cf-address" label="Address" required />
            <div className="grid grid-cols-2 gap-4">
              <CfInput name="cf-city" label="City" required />
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">State</span>
                <select
                  value={buyerState}
                  onChange={(e) => setBuyerState(e.target.value)}
                  className={`mt-1 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent ${st.inputRadius}`}
                >
                  {NIGERIAN_STATES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CfInput name="cf-zip" label="ZIP / Postal code" required />
              <div className="flex items-end">
                <p className="pb-1 text-xs text-muted-foreground">
                  {buyerState.toLowerCase() === "lagos" ? `Lagos delivery (${formatPrice(deliveryFees.lagos)})` : `Inter-state delivery (${formatPrice(deliveryFees.other)})`}
                  {subtotal >= deliveryFees.freeThreshold && ` — free on orders over ${formatPrice(deliveryFees.freeThreshold)}`}
                </p>
              </div>
            </div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className={`text-2xl ${st.hFont}`}>Payment</legend>
            <div className={`flex items-center gap-3 border border-border bg-secondary/40 p-4 ${st.cardRadius}`}>
              <CreditCard2Front size={20} className="shrink-0 text-muted-foreground" />
              {provider === "none" ? (
                <div>
                  <p className="text-sm font-medium">Demo mode — no payment processed</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Configure a gateway in Admin → Payments.</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">{provider === "flutterwave" ? "Flutterwave" : "Paystack"} secure checkout</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">A secure popup will open when you click Pay.</p>
                </div>
              )}
            </div>
          </fieldset>
          {error && <p className={`border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive ${st.cardRadius}`}>{error}</p>}
          <button type="submit" disabled={submitting}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 ${st.btnRadius}`}
            style={st.btnStyle}>
            {submitting ? <><ArrowRepeat size={16} className="animate-spin" /> Processing…</> :provider === "flutterwave" ? <>Pay with Flutterwave · {formatPrice(total)}</> : provider === "paystack" ? <>Pay with Paystack · {formatPrice(total)}</> : <>Pay {formatPrice(total)}</>}
          </button>
        </form>
        <aside className={`h-fit border border-border bg-secondary/40 p-6 ${st.cardRadius}`}>
          <h3 className={`text-xl ${st.hFont}`} style={st.headingStyle}>Order summary</h3>
          <ul className="mt-4 divide-y divide-border">
            {detailed.map(({ product, qty }) => (
              <li key={product.slug} className="flex gap-3 py-3">
                <img src={product.image} alt={product.name} className={`h-14 w-14 object-cover ${st.cardRadius}`} />
                <div className="flex flex-1 justify-between text-sm">
                  <div><p className="font-medium">{product.name}</p><p className="text-muted-foreground">Qty {qty}</p></div>
                  <span>{formatPrice(product.price * qty)}</span>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between text-muted-foreground"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            {processingFee > 0 && (
              <div className="flex justify-between text-muted-foreground"><dt>Processing fee</dt><dd>{formatPrice(processingFee)}</dd></div>
            )}
            <div className={`flex justify-between pt-2 text-lg ${st.hFont}`}><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function ContactFormSectionView({ s }: { s: ContactFormSection }) {
  const st = useSectionStyles();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setDone(true); }, 800);
  };

  const inputCls = `h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent ${st.inputRadius}`;

  return (
    <section className="mx-auto max-w-2xl px-6 py-16">
      {s.heading && <h2 className={`text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mt-3 text-center text-muted-foreground">{s.subheading}</p>}
      {done ? (
        <div className={`mt-10 border border-border bg-secondary/40 p-8 text-center ${st.cardRadius}`}>
          <CheckLg size={32} className="mx-auto text-accent" />
          <p className="mt-3 font-semibold">Message sent!</p>
          <p className="mt-1 text-sm text-muted-foreground">Thanks for reaching out. We'll be in touch soon.</p>
          <button onClick={() => setDone(false)} className="mt-4 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Send another</button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Name</span>
              <input name="name" required className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Email</span>
              <input name="email" type="email" required className={inputCls} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Subject</span>
            <input name="subject" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Message</span>
            <textarea name="message" required rows={5} className={`w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent ${st.inputRadius}`} />
          </label>
          <button type="submit" disabled={submitting}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 ${st.btnRadius}`}
            style={st.btnStyle}>
            {submitting ? <><ArrowRepeat size={16} className="animate-spin" /> Sending…</> : "Send message"}
          </button>
        </form>
      )}
    </section>
  );
}

function ShopGrid({ s }: { s: ShopGridSection }) {
  const st = useSectionStyles();
  const { products: vendorProducts, loading } = useVendorProducts();
  const { add: addToCartFn } = useCart();
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const pageSize = s.pageSize ?? 12;
  const [page, setPage] = useState(1);
  const variant = s.variant ?? "grid";
  const filterStyle = s.filterStyle ?? "pills";
  const showFilters = s.showFilters ?? true;

  const categories = ["All", ...Array.from(new Set(vendorProducts.map((p) => p.category).filter(Boolean)))];

  const filtered = vendorProducts.filter((p) => {
    const matchesCat = cat === "All" || p.category === cat;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const visible = filtered.slice(0, page * pageSize);
  const hasMore = filtered.length > visible.length;

  const cartProps = s.cartBtnStyle ? {
    onAddToCart: (pr: any) => addToCartFn(pr.slug, 1),
    cartBtnStyle: s.cartBtnStyle,
    cartBtnBg: s.cartBtnBg,
    cartBtnColor: s.cartBtnColor,
    cartBtnLabel: s.cartBtnLabel,
    cartBtnLayout: s.cartBtnLayout ?? "below" as const,
  } : {};

  // ── Skeleton loader ──
  const skeletonCount = pageSize;
  if (loading && vendorProducts.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        {s.heading && <div className="mb-8 h-9 w-48 animate-pulse rounded-lg bg-secondary" />}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-secondary" />)}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-3/4 w-full animate-pulse rounded-lg bg-secondary" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ── Filter bar: pills ──
  const pillFilters = showFilters && filterStyle === "pills" && (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      <div className="relative mr-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products…"
          className={`h-9 border border-border bg-background pl-3 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${st.btnRadius}`}
        />
      </div>
      {categories.map((c) => (
        <button key={c} onClick={() => { setCat(c); setPage(1); }}
          className={`h-9 border px-4 text-sm transition-colors ${st.btnRadius} ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
          style={cat === c ? st.btnStyle : {}}>
          {c}
        </button>
      ))}
    </div>
  );

  // ── Filter bar: dropdown ──
  const dropdownFilters = showFilters && filterStyle === "dropdown" && (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search products…"
        className={`h-10 flex-1 border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${st.btnRadius}`}
      />
      <select
        value={cat}
        onChange={(e) => { setCat(e.target.value); setPage(1); }}
        className={`h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${st.btnRadius}`}
      >
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );

  // ── Load more button ──
  const loadMoreBtn = hasMore && (
    <div className="mt-14 flex justify-center">
      <button onClick={() => setPage((p) => p + 1)}
        className={`inline-flex h-12 items-center gap-2 border border-border px-8 text-sm font-medium hover:bg-secondary transition-colors ${st.btnRadius}`}>
        Load more <span className="text-muted-foreground">({filtered.length - visible.length} remaining)</span>
      </button>
    </div>
  );

  // ═══ LAYOUT: list ══════════════════════════════════════════════════════════
  if (variant === "list") {
    return (
      <section className="mx-auto max-w-4xl px-6 py-16">
        {s.heading && <h2 className={`mb-8 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {pillFilters}{dropdownFilters}

        {/* Sidebar filter for list variant */}
        {showFilters && filterStyle === "sidebar" && (
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => { setCat(c); setPage(1); }}
                className={`h-8 border px-3 text-xs transition-colors ${st.btnRadius} ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                style={cat === c ? st.btnStyle : {}}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="divide-y divide-border">
          {visible.map((p) => (
            <div key={p.slug} className="flex items-center gap-5 py-5">
              <a href={`/product/${p.slug}`} className={`shrink-0 overflow-hidden bg-secondary ${st.cardRadius}`}>
                <img src={p.image} alt={p.name} className="h-20 w-20 object-cover" />
              </a>
              <div className="min-w-0 flex-1">
                <a href={`/product/${p.slug}`}>
                  <p className={`truncate font-medium ${st.hFont}`} style={st.headingStyle}>{p.name}</p>
                </a>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.category}</p>
                {p.description && <p className="mt-1 line-clamp-1 text-sm text-foreground/70">{p.description}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold" style={st.priceStyle}>{formatPrice(p.price)}</p>
                {s.cartBtnStyle && (
                  <button onClick={() => addToCartFn(p.slug, 1)}
                    className={`mt-2 h-8 px-4 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity ${st.btnRadius}`}
                    style={st.btnStyle}>
                    Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {loadMoreBtn}
      </section>
    );
  }

  // ═══ LAYOUT: compact ═══════════════════════════════════════════════════════
  if (variant === "compact") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        {s.heading && <h2 className={`mb-8 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {pillFilters}{dropdownFilters}

        {showFilters && filterStyle === "sidebar" && (
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => { setCat(c); setPage(1); }}
                className={`h-7 border px-3 text-xs transition-colors ${st.btnRadius} ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                style={cat === c ? st.btnStyle : {}}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {visible.map((p) => (
            <a key={p.slug} href={`/product/${p.slug}`} className={`group block overflow-hidden border border-border hover:border-primary transition-colors ${st.cardRadius}`}>
              <div className="aspect-square overflow-hidden bg-secondary">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-medium" style={st.headingStyle}>{p.name}</p>
                <p className="mt-0.5 text-xs font-semibold" style={st.priceStyle}>{formatPrice(p.price)}</p>
              </div>
            </a>
          ))}
        </div>
        {loadMoreBtn}
      </section>
    );
  }

  // ═══ LAYOUT: editorial ═════════════════════════════════════════════════════
  if (variant === "editorial") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        {s.heading && <h2 className={`mb-2 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {pillFilters}{dropdownFilters}

        {showFilters && filterStyle === "sidebar" && (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => { setCat(c); setPage(1); }}
                className={`h-8 border px-3 text-xs transition-colors ${st.btnRadius} ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                style={cat === c ? st.btnStyle : {}}>
                {c}
              </button>
            ))}
          </div>
        )}

        {visible.length > 0 && (
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p, i) => (
              <a key={p.slug} href={`/product/${p.slug}`}
                className={`group relative block overflow-hidden bg-background ${i === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}>
                <div className={`overflow-hidden bg-secondary ${i === 0 ? "aspect-[4/3]" : "aspect-square"}`}>
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <p className={`text-white font-semibold ${i === 0 ? "text-xl" : "text-sm"}`}>{p.name}</p>
                  <p className="mt-1 text-white/80 text-sm">{formatPrice(p.price)}</p>
                </div>
              </a>
            ))}
          </div>
        )}
        {loadMoreBtn}
      </section>
    );
  }

  // ═══ LAYOUT: masonry ═══════════════════════════════════════════════════════
  if (variant === "masonry") {
    const cols = [[0, 3, 6, 9], [1, 4, 7, 10], [2, 5, 8, 11]];
    const heights = ["aspect-square", "aspect-3/4", "aspect-[3/5]", "aspect-[4/3]"];
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        {s.heading && <h2 className={`mb-8 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {pillFilters}{dropdownFilters}

        {showFilters && filterStyle === "sidebar" && (
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => { setCat(c); setPage(1); }}
                className={`h-8 border px-3 text-xs transition-colors ${st.btnRadius} ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                style={cat === c ? st.btnStyle : {}}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          {cols.map((colIdxs, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-4">
              {colIdxs.map((idx) => {
                const p = visible[idx];
                if (!p) return null;
                const h = heights[idx % heights.length];
                return (
                  <a key={p.slug} href={`/product/${p.slug}`} className={`group block overflow-hidden bg-secondary ${st.cardRadius}`}>
                    <div className={`overflow-hidden ${h}`}>
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-3">
                      <p className={`text-sm font-medium leading-tight ${st.hFont}`} style={st.headingStyle}>{p.name}</p>
                      <p className="mt-1 text-sm" style={st.priceStyle}>{formatPrice(p.price)}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          ))}
        </div>
        {loadMoreBtn}
      </section>
    );
  }

  // ═══ LAYOUT: grid (default) with sidebar filter option ═════════════════════
  const gridCardVariant = s.cardVariant ?? "classic";
  const isGridHorizontal = gridCardVariant === "horizontal";
  const gridContent = (
    <div className={isGridHorizontal ? "flex flex-col gap-4" : "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 sm:grid-cols-4"}>
      {visible.map((p) => (
        <ProductCard key={p.slug} product={p} variant={gridCardVariant} {...cartProps} />
      ))}
    </div>
  );

  if (showFilters && filterStyle === "sidebar") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        {s.heading && <h2 className={`mb-8 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden w-44 shrink-0 md:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Category</p>
            <div className="space-y-1">
              {categories.map((c) => (
                <button key={c} onClick={() => { setCat(c); setPage(1); }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${cat === c ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                  style={cat === c ? st.btnStyle : {}}>
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Search</p>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </aside>
          {/* Mobile pills */}
          <div className="flex-1">
            <div className="mb-6 flex flex-wrap gap-2 md:hidden">
              {categories.map((c) => (
                <button key={c} onClick={() => { setCat(c); setPage(1); }}
                  className={`h-8 border px-3 text-xs transition-colors ${st.btnRadius} ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                  style={cat === c ? st.btnStyle : {}}>
                  {c}
                </button>
              ))}
            </div>
            {gridContent}
            {loadMoreBtn}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      {s.heading && <h2 className={`mb-8 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {pillFilters}{dropdownFilters}
      {gridContent}
      {loadMoreBtn}
    </section>
  );
}

function CustomHtmlBlock({ s }: { s: CustomHtmlSection }) {
  return <div dangerouslySetInnerHTML={{ __html: s.html }} />;
}

// ─── Auth + Buyer Dashboard Sections ─────────────────────────────────────────

const BUYER_PHONE_KEY = "kiosk_buyer_phone";
const BUYER_NAME_KEY  = "kiosk_buyer_name";

function AuthLogin({ s, vendorId }: { s: AuthLoginSection; vendorId?: string }) {
  const st = useSectionStyles();
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(() => typeof sessionStorage !== "undefined" && !!sessionStorage.getItem(BUYER_PHONE_KEY));
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    sessionStorage.setItem(BUYER_PHONE_KEY, phone.trim());
    setDone(true);
  };

  const bgStyle: React.CSSProperties = s.imageSide === "background" && s.image
    ? { backgroundImage: `url(${s.image})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

  const form = (
    <div className="flex flex-1 flex-col justify-center gap-5 p-8 md:p-12">
      <div>
        <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Welcome back"}</h2>
        {s.subheading && <p className="mt-2 text-sm text-muted-foreground">{s.subheading}</p>}
      </div>
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckLg size={40} className="text-primary" />
          <p className="font-semibold">You're signed in!</p>
          <p className="text-sm text-muted-foreground">Use the navigation to view your orders or referral rewards.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="tel"
            placeholder="Your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full border border-border ${st.btnRadius} px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary`}
            required
          />
          <button type="submit" className={`${st.btnRadius} bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground`} style={st.btnStyle}>
            Sign in
          </button>
          {s.signupLink && (
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button type="button" onClick={() => navigate({ to: s.signupLink! })} className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign up
              </button>
            </p>
          )}
        </form>
      )}
    </div>
  );

  if (s.imageSide === "background" && s.image) {
    return (
      <section className="relative flex min-h-[480px] items-center justify-center" style={bgStyle}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl bg-white/10 p-8 backdrop-blur-sm text-white">
          <h2 className={`mb-2 ${st.h2} ${st.hFont}`}>{s.heading ?? "Welcome back"}</h2>
          {s.subheading && <p className="mb-5 text-sm opacity-80">{s.subheading}</p>}
          {done ? (
            <div className="py-6 text-center"><CheckLg size={36} className="mx-auto mb-2" /><p className="font-semibold">You're signed in!</p></div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input type="tel" placeholder="Your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-sm text-white placeholder-white/60 focus:outline-none" required />
              <button type="submit" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black">Sign in</button>
            </form>
          )}
        </div>
      </section>
    );
  }

  if (s.image) {
    const imgLeft = s.imageSide === "left";
    return (
      <section className="flex min-h-[480px] flex-col md:flex-row">
        {imgLeft && <img src={s.image} alt="" className="h-64 w-full object-cover md:h-auto md:w-1/2" />}
        {form}
        {!imgLeft && <img src={s.image} alt="" className="h-64 w-full object-cover md:h-auto md:w-1/2" />}
      </section>
    );
  }

  return <section className="mx-auto max-w-md px-6 py-20">{form}</section>;
}

function AuthSignup({ s, vendorId }: { s: AuthSignupSection; vendorId?: string }) {
  const st = useSectionStyles();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    sessionStorage.setItem(BUYER_PHONE_KEY, phone.trim());
    if (name.trim()) sessionStorage.setItem(BUYER_NAME_KEY, name.trim());
    setDone(true);
  };

  const form = (
    <div className="flex flex-1 flex-col justify-center gap-5 p-8 md:p-12">
      <div>
        <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Create account"}</h2>
        {s.subheading && <p className="mt-2 text-sm text-muted-foreground">{s.subheading}</p>}
      </div>
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckLg size={40} className="text-primary" />
          <p className="font-semibold">Account created!</p>
          <p className="text-sm text-muted-foreground">You can now track your orders and earn referral rewards.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={`w-full border border-border ${st.btnRadius} px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} />
          <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full border border-border ${st.btnRadius} px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} required />
          <button type="submit" className={`${st.btnRadius} bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground`} style={st.btnStyle}>
            Create account
          </button>
          {s.loginLink && (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate({ to: s.loginLink! })} className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign in
              </button>
            </p>
          )}
        </form>
      )}
    </div>
  );

  if (s.imageSide === "background" && s.image) {
    return (
      <section className="relative flex min-h-[520px] items-center justify-center" style={{ backgroundImage: `url(${s.image})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 mx-auto w-full max-w-md rounded-2xl bg-white/10 p-8 backdrop-blur-sm text-white">
          <h2 className={`mb-2 ${st.h2} ${st.hFont}`}>{s.heading ?? "Create account"}</h2>
          {s.subheading && <p className="mb-5 text-sm opacity-80">{s.subheading}</p>}
          {done ? (
            <div className="py-6 text-center"><CheckLg size={36} className="mx-auto mb-2" /><p className="font-semibold">Account created!</p></div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-sm text-white placeholder-white/60 focus:outline-none" />
              <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-white/30 bg-white/20 px-4 py-3 text-sm text-white placeholder-white/60 focus:outline-none" required />
              <button type="submit" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black">Create account</button>
            </form>
          )}
        </div>
      </section>
    );
  }

  if (s.image) {
    const imgLeft = s.imageSide === "left";
    return (
      <section className="flex min-h-[520px] flex-col md:flex-row">
        {imgLeft && <img src={s.image} alt="" className="h-64 w-full object-cover md:h-auto md:w-1/2" />}
        {form}
        {!imgLeft && <img src={s.image} alt="" className="h-64 w-full object-cover md:h-auto md:w-1/2" />}
      </section>
    );
  }

  return <section className="mx-auto max-w-md px-6 py-20">{form}</section>;
}

function BuyerOrders({ s, vendorId }: { s: BuyerOrdersSection; vendorId?: string }) {
  const st = useSectionStyles();
  const base = (import.meta.env["VITE_API_BASE"] as string | undefined) ?? "/api";

  const [phone, setPhone] = useState(() => typeof sessionStorage !== "undefined" ? sessionStorage.getItem(BUYER_PHONE_KEY) ?? "" : "");
  const [phoneInput, setPhoneInput] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    if (!phone || !vendorId) return;
    setStatus("loading");
    fetch(`${base}/buyers/my-orders?phone=${encodeURIComponent(phone)}&vendorId=${encodeURIComponent(vendorId)}`)
      .then((r) => r.json())
      .then((d) => { setOrders(d.data ?? []); setStatus("ok"); })
      .catch(() => setStatus("error"));
  }, [phone, vendorId]);

  const statusColor: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800",
    pending: "bg-yellow-100 text-yellow-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-purple-100 text-purple-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className={`mb-2 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "My Orders"}</h2>
      {s.subheading && <p className="mb-8 text-sm text-muted-foreground">{s.subheading}</p>}

      {!phone ? (
        <form onSubmit={(e) => { e.preventDefault(); const p = phoneInput.trim(); if (!p) return; sessionStorage.setItem(BUYER_PHONE_KEY, p); setPhone(p); }} className="flex max-w-sm gap-3">
          <input type="tel" placeholder="Enter your phone number" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className={`flex-1 border border-border ${st.btnRadius} px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary`} required />
          <button type="submit" className={`${st.btnRadius} bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground`} style={st.btnStyle}>Look up</button>
        </form>
      ) : status === "loading" ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading your orders…</div>
      ) : status === "error" ? (
        <div className="py-12 text-center text-sm text-destructive">Could not load orders. Please try again.</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No orders found for this phone number.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o: any) => (
            <div key={o.orderNumber} className="rounded-xl border border-border p-5">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="font-semibold text-sm">{o.orderNumber}</span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusColor[o.status] ?? "bg-secondary text-secondary-foreground"}`}>{o.status}</span>
              </div>
              <div className="mb-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</div>
              <div className="flex flex-col gap-1 text-sm">
                {o.items?.map((i: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.name} × {i.qty}</span>
                    <span className="text-muted-foreground">{formatPrice(i.unitPrice * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-border pt-3 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span>{formatPrice(o.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BuyerReferrals({ s, vendorId }: { s: BuyerReferralsSection; vendorId?: string }) {
  const st = useSectionStyles();
  const base = (import.meta.env["VITE_API_BASE"] as string | undefined) ?? "/api";

  const [phone] = useState(() => typeof sessionStorage !== "undefined" ? sessionStorage.getItem(BUYER_PHONE_KEY) ?? "" : "");
  const [info, setInfo] = useState<{ code: string | null; timesUsed: number; referralUrl: string | null; storeUsername: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!phone || !vendorId) return;
    fetch(`${base}/buyers/my-referral?phone=${encodeURIComponent(phone)}&vendorId=${encodeURIComponent(vendorId)}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setInfo(d.data); })
      .catch(() => {});
  }, [phone, vendorId]);

  const shareUrl = info?.referralUrl ?? (info?.code && info.storeUsername ? `${window.location.origin}?ref=${info.code}` : null);

  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const rewardLabel = s.rewardLabel ?? "10% off their next order";

  if (!phone) {
    return (
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <h2 className={`mb-3 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Refer & Earn"}</h2>
        <p className="text-sm text-muted-foreground">Sign in first to see your referral link.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-16 text-center">
      <h2 className={`mb-3 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Refer & Earn"}</h2>
      {s.subheading && <p className="mb-6 text-sm text-muted-foreground">{s.subheading}</p>}

      {!info ? (
        <p className="text-sm text-muted-foreground">Place your first order to get your referral link.</p>
      ) : !info.code ? (
        <p className="text-sm text-muted-foreground">Complete an order to unlock your personal referral link.</p>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted-foreground">Share your link — friends get <strong>{rewardLabel}</strong> when they order.</p>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-left text-sm font-mono">
            <span className="flex-1 truncate">{shareUrl}</span>
            <button onClick={copy} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${copied ? "bg-emerald-100 text-emerald-800" : "bg-primary text-primary-foreground"}`} style={copied ? {} : st.btnStyle}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Used by <strong>{info.timesUsed}</strong> {info.timesUsed === 1 ? "person" : "people"}</p>
        </>
      )}
    </section>
  );
}

// ─── About Section ────────────────────────────────────────────────────────────

function AboutSectionView({ s }: { s: AboutSection }) {
  const st = useSectionStyles();
  const variant = s.variant ?? "story";

  // ── story: image right, text left ──
  if (variant === "story") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
            <h2 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Our story"}</h2>
            {s.subheading && <p className="mt-4 text-xl text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
            <div className="mt-8 space-y-5 leading-relaxed text-foreground/80" style={st.bodyStyle}>
              {(s.body ?? "Tell your brand story here.").split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {s.ctaLabel && (
              <Link to={s.ctaLink ?? "/shop"} className={`mt-10 inline-flex h-12 items-center gap-2 px-8 text-sm font-medium bg-primary text-primary-foreground transition-opacity hover:opacity-90 ${st.btnRadius}`} style={st.btnStyle}>
                {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
                {s.ctaLabel}
                {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={15} />}
              </Link>
            )}
          </div>
          {s.image && (
            <div className={`overflow-hidden bg-secondary ${st.cardRadius}`}>
              <img src={s.image} alt={s.heading ?? "About"} className="aspect-4/3 w-full object-cover" />
            </div>
          )}
        </div>
      </section>
    );
  }

  // ── split: full-width 50/50 edge-to-edge ──
  if (variant === "split") {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2">
        {s.image && (
          <div className="overflow-hidden bg-secondary">
            <img src={s.image} alt={s.heading ?? "About"} className="h-full min-h-80 w-full object-cover" />
          </div>
        )}
        <div className="flex flex-col justify-center px-10 py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
          <h2 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Our story"}</h2>
          {s.subheading && <p className="mt-4 text-xl text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
          <div className="mt-8 space-y-5 leading-relaxed text-foreground/80" style={st.bodyStyle}>
            {(s.body ?? "").split("\n\n").filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
          </div>
          {s.ctaLabel && (
            <Link to={s.ctaLink ?? "/shop"} className={`mt-10 inline-flex h-12 w-fit items-center gap-2 px-8 text-sm font-medium bg-primary text-primary-foreground transition-opacity hover:opacity-90 ${st.btnRadius}`} style={st.btnStyle}>
              {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
              {s.ctaLabel}
              {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={15} />}
            </Link>
          )}
        </div>
      </section>
    );
  }

  // ── team: text center + team grid below ──
  if (variant === "team") {
    const members = s.team ?? [];
    return (
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
        <h2 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Meet the team"}</h2>
        {s.subheading && <p className="mx-auto mt-4 max-w-xl text-xl text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        {s.body && (
          <p className="mx-auto mt-8 max-w-2xl leading-relaxed text-foreground/80" style={st.bodyStyle}>{s.body}</p>
        )}
        {members.length > 0 && (
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
            {members.map((m, i) => (
              <div key={i} className="text-center">
                <div className={`overflow-hidden bg-secondary ${st.cardRadius} mx-auto aspect-square w-32`}>
                  {m.image ? <img src={m.image} alt={m.name} className="h-full w-full object-cover" /> : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">{m.name[0]}</div>
                  )}
                </div>
                <p className="mt-3 font-semibold">{m.name}</p>
                {m.role && <p className="text-sm text-muted-foreground">{m.role}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  // ── magazine: full-bleed image with text overlay ──
  return (
    <section className="relative overflow-hidden min-h-[70vh] flex items-end">
      {s.image && <img src={s.image} alt={s.heading ?? "About"} className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="relative max-w-3xl px-10 py-20 text-white">
        <p className="text-xs uppercase tracking-[0.2em] opacity-70">About</p>
        <h2 className={`mt-3 ${st.h1} ${st.hFont} text-white`}>{s.heading ?? "Our story"}</h2>
        {s.body && <p className="mt-6 max-w-xl leading-relaxed opacity-90" style={st.bodyStyle}>{s.body}</p>}
        {s.ctaLabel && (
          <Link to={s.ctaLink ?? "/shop"} className={`mt-8 inline-flex h-12 items-center gap-2 px-8 text-sm font-medium bg-white text-black transition-opacity hover:opacity-90 ${st.btnRadius}`}>
            {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
            {s.ctaLabel}
            {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={15} />}
          </Link>
        )}
      </div>
    </section>
  );
}

// ─── Contact Section ──────────────────────────────────────────────────────────

function ContactSectionView({ s }: { s: ContactSection }) {
  const st = useSectionStyles();
  const variant = s.variant ?? "split";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const infoBlock = (
    <div className="space-y-6">
      {s.email && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email</p>
          <a href={`mailto:${s.email}`} className="mt-1 block text-base hover:underline">{s.email}</a>
        </div>
      )}
      {s.phone && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Phone</p>
          <a href={`tel:${s.phone}`} className="mt-1 block text-base hover:underline">{s.phone}</a>
        </div>
      )}
      {s.address && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Address</p>
          <p className="mt-1 text-base text-foreground/80">{s.address}</p>
        </div>
      )}
      {s.hours && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Hours</p>
          <p className="mt-1 text-base text-foreground/80">{s.hours}</p>
        </div>
      )}
    </div>
  );

  const formBlock = s.showForm !== false && (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
      {sent ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-center">
          <p className="font-semibold text-emerald-800">Message sent!</p>
          <p className="mt-1 text-sm text-emerald-700">We'll get back to you soon.</p>
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} placeholder="How can we help?"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <button type="submit" className={`inline-flex h-11 w-full items-center justify-center gap-2 px-6 text-sm font-medium bg-primary text-primary-foreground transition-opacity hover:opacity-90 ${st.btnRadius}`} style={st.btnStyle}>
            Send message <ArrowRight size={14} />
          </button>
        </>
      )}
    </form>
  );

  // ── simple: stacked, centered ──
  if (variant === "simple") {
    return (
      <section className="mx-auto max-w-2xl px-6 py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
        <h2 className={`mt-3 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Get in touch"}</h2>
        {s.subheading && <p className="mt-3 text-lg text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        <div className="mt-10">{infoBlock}</div>
        {formBlock && <div className="mt-10 border-t border-border pt-10">{formBlock}</div>}
      </section>
    );
  }

  // ── cards: info in highlight cards ──
  if (variant === "cards") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
          <h2 className={`mt-3 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Get in touch"}</h2>
          {s.subheading && <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Email", value: s.email, href: s.email ? `mailto:${s.email}` : undefined },
            { label: "Phone", value: s.phone, href: s.phone ? `tel:${s.phone}` : undefined },
            { label: "Address", value: s.address },
            { label: "Hours", value: s.hours },
          ].filter((i) => i.value).map((item) => (
            <div key={item.label} className={`rounded-2xl border border-border bg-secondary/40 p-6 ${st.cardRadius}`}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="mt-2 block text-sm font-medium hover:underline">{item.value}</a>
              ) : (
                <p className="mt-2 text-sm">{item.value}</p>
              )}
            </div>
          ))}
        </div>
        {formBlock && <div className="mx-auto mt-16 max-w-xl">{formBlock}</div>}
      </section>
    );
  }

  // ── full: big header + 2-col info+form ──
  if (variant === "full") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
            <h2 className={`mt-3 ${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Get in touch"}</h2>
            {s.subheading && <p className="mt-4 text-lg text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
            <div className="mt-12">{infoBlock}</div>
          </div>
          <div className="lg:col-span-3">{formBlock}</div>
        </div>
      </section>
    );
  }

  // ── split (default): info left, form right ──
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
          <h2 className={`mt-3 ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading ?? "Get in touch"}</h2>
          {s.subheading && <p className="mt-3 text-lg text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
          <div className="mt-10">{infoBlock}</div>
        </div>
        <div className="flex flex-col justify-center">{formBlock}</div>
      </div>
    </section>
  );
}

// ─── Custom Section Block Renderer ───────────────────────────────────────────

type IconComp = React.FC<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>;

const CUSTOM_ICON_MAP: Record<string, IconComp> = {
  // Navigation
  search: Search, menu: List, close: XLg, "chevron-up": ChevronUp,
  "chevron-down": ChevronDown, "chevron-left": ChevronLeft, "chevron-right": ChevronRight,
  "arrow-right": ArrowRight, "arrow-left": ArrowLeft, "arrow-up": ArrowUp, "arrow-down": ArrowDown,
  external: BoxArrowUpRight,
  // Commerce
  cart: Cart3, bag: Bag, "bag-plus": BagPlus, heart: Heart, "heart-fill": HeartFill,
  star: Star, "star-fill": StarFill, tag: Tag, percent: Percent, truck: Truck, gift: Gift,
  // Social
  instagram: Instagram, twitter: Twitter, facebook: Facebook,
  whatsapp: Whatsapp, youtube: Youtube, tiktok: Tiktok,
  linkedin: Linkedin, pinterest: Pinterest,
  // Communication
  phone: Telephone, email: Envelope, location: GeoAlt, globe: Globe, link: Link45deg,
  // Status / UI
  check: Check, "check-circle": CheckCircle, "check-circle-fill": CheckCircleFill,
  info: InfoCircle, warning: ExclamationCircle, question: QuestionCircle, "x-circle": XCircle,
  bell: BellFill, share: ShareFill, bookmark: BookmarkFill,
  // People & identity
  person: Person, "person-circle": PersonCircle, people: People,
  lock: Lock, shield: Shield, key: Key,
  // General
  home: House, sun: Sun, moon: Moon, camera: Camera, music: MusicNote,
  box: Box, fire: Fire, lightning: Lightning, award: Award, trophy: Trophy,
  crown: Crown, diamond: Diamond, stars: Stars, cup: Cup, "thumbs-up": HandThumbsUp,
  play: PlayCircle, chat: ChatDots, "file-text": FileText,
  layout: LayoutTextWindow, grid: Grid, dots: ThreeDotsVertical,
  "credit-card": CreditCard2Front, "arrow-repeat": ArrowRepeat,
  // Aliases for the kioskm editor's icon picker (LayoutControls' KIOSK_ICONS),
  // which uses Ionicons naming — different from the react-bootstrap-icons keys
  // above. Without these, picking one of these in the editor rendered as the
  // generic "dots" fallback on the live shop since the name never matched.
  "arrow-forward": ArrowRight, "arrow-back": ArrowLeft, "chevron-forward": ChevronRight,
  "checkmark-circle": CheckCircleFill, "close-circle": XCircle,
  flash: Lightning, flame: Fire, ribbon: Award, sparkles: Stars,
  mail: Envelope, call: Telephone, "musical-notes": MusicNote, cube: Box,
  pricetag: Tag, "lock-open": Lock, "shield-checkmark": Shield, sunny: Sun,
  car: CarFrontFill, leaf: Leaf, cafe: CupHot,
};

function resolveIcon(name: string): IconComp {
  const normalized = name.toLowerCase().replace(/\s+/g, "-");
  return CUSTOM_ICON_MAP[normalized] ?? CUSTOM_ICON_MAP["dots"]!;
}

function useBlockAction(action?: BlockAction) {
  const navigate = useNavigate();
  const { setOpen: openCart } = useCart();

  return (e: React.MouseEvent) => {
    if (!action || action.type === "none") return;
    if (action.type === "navigate") {
      e.preventDefault();
      navigate({ to: action.href });
    } else if (action.type === "open-cart") {
      openCart(true);
    } else if (action.type === "open-search") {
      window.dispatchEvent(new CustomEvent("kiosk:open-search"));
    } else if (action.type === "scroll-top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (action.type === "whatsapp") {
      const msg = encodeURIComponent(action.message ?? "Hello!");
      window.open(`https://wa.me/${action.number.replace(/\D/g, "")}?text=${msg}`, "_blank");
    }
  };
}

const BLOCK_ANIM_STYLE: Record<string, React.CSSProperties> = {
  fadeIn:    { animation: "kiosk-fadeIn 0.6s ease forwards" },
  slideUp:   { animation: "kiosk-slideUp 0.6s ease forwards" },
  slideLeft: { animation: "kiosk-slideLeft 0.6s ease forwards" },
  slideRight:{ animation: "kiosk-slideRight 0.6s ease forwards" },
  zoomIn:    { animation: "kiosk-zoomIn 0.6s ease forwards" },
  bounce:    { animation: "kiosk-bounce 0.8s ease forwards" },
  pulse:     { animation: "kiosk-pulse 1.2s ease infinite" },
};

function blockAnimStyle(anim?: string): React.CSSProperties {
  if (!anim || anim === "none") return {};
  return BLOCK_ANIM_STYLE[anim] ?? {};
}

export function BlockRenderer({ block, ctx }: { block: Block; ctx: { tokens: ReturnType<typeof useDesignTokens>; elStyles?: Record<string, React.CSSProperties> } }) {
  const handleAction = useBlockAction((block as { action?: BlockAction }).action);
  const { tokens } = ctx;
  const elStyles = ctx.elStyles ?? {};
  const override = useContext(SectionOverrideCtx);

  const btnRadius =
    tokens.buttonShape === "pill" ? "9999px" :
    tokens.buttonShape === "rounded" ? "8px" : "2px";

  const headingFamily = HEADING_FONT_META[tokens.fontHeading ?? "serif"]?.family ?? undefined;
  const bodyFamily   = BODY_FONT_META[tokens.fontBody ?? "inherit"]?.family ?? undefined;
  const headingTags  = new Set(["h1", "h2", "h3", "h4"]);

  if (block.type === "text") {
    const isHeading = headingTags.has(block.tag);
    const tokenFont = isHeading ? headingFamily : bodyFamily;
    const tokenColor = isHeading
      ? (override.headingColor ?? undefined)
      : undefined;
    // Section-level elStyles override (heading/body) — block.styles wins over section-level
    const sectionLevelStyle: React.CSSProperties = isHeading ? (elStyles.heading ?? {}) : (elStyles.body ?? {});
    return React.createElement(
      block.tag,
      {
        style: {
          margin: 0,
          ...(tokenFont ? { fontFamily: tokenFont } : {}),
          ...(tokenColor ? { color: tokenColor } : {}),
          ...sectionLevelStyle,
          ...block.styles,
          ...blockAnimStyle(block.animation),
        },
      },
      block.content
    );
  }

  if (block.type === "button") {
    const IconComp = block.iconName ? resolveIcon(block.iconName) : null;
    return (
      <button
        onClick={handleAction}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          cursor: "pointer", border: "none", padding: "10px 22px",
          borderRadius: btnRadius, fontWeight: 600, fontSize: "0.9rem",
          backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))",
          ...(elStyles.button ?? {}),
          ...block.styles,
          ...blockAnimStyle(block.animation),
        }}
      >
        {IconComp && block.iconPos !== "right" && <IconComp size={16} />}
        {block.label}
        {IconComp && block.iconPos === "right" && <IconComp size={16} />}
      </button>
    );
  }

  if (block.type === "icon") {
    const IconComp = resolveIcon(block.name);
    const hasAction = block.action && block.action.type !== "none";
    return (
      <span
        onClick={hasAction ? handleAction : undefined}
        style={{
          display: "inline-flex", cursor: hasAction ? "pointer" : "default",
          color: block.color ?? "currentColor",
          ...block.styles,
          ...blockAnimStyle(block.animation),
        }}
      >
        <IconComp size={block.size ?? 24} color={block.color} />
      </span>
    );
  }

  if (block.type === "image") {
    const imgStyle: React.CSSProperties = {
      display: "block", maxWidth: "100%",
      width: "100%", objectFit: "cover",
      ...block.styles,
      ...blockAnimStyle(block.animation),
    };
    if (!block.src) {
      return (
        <div style={{ ...imgStyle, minHeight: 160, background: "hsl(var(--muted))", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "hsl(var(--muted-foreground))" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span style={{ fontSize: "0.75rem" }}>No image added yet</span>
        </div>
      );
    }
    return <img src={block.src} alt={block.alt ?? ""} style={imgStyle} />;
  }

  if (block.type === "spacer") {
    return <div style={{ height: block.height }} aria-hidden />;
  }

  if (block.type === "divider") {
    return (
      <hr style={{
        border: "none",
        borderTop: `${block.thickness ?? 1}px ${block.lineStyle ?? "solid"} ${block.color ?? "currentColor"}`,
        margin: `${block.marginY ?? 8}px 0`,
        opacity: 0.3,
      }} />
    );
  }

  if (block.type === "form") {
    return <CustomFormBlock block={block} />;
  }

  if (block.type === "row") {
    const gapMap = { none: 0, sm: 8, md: 16, lg: 24 };
    const gap = gapMap[block.gap ?? "md"];
    const vAlign = block.verticalAlign === "center" ? "center" : block.verticalAlign === "bottom" ? "flex-end" : "flex-start";
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${block.colCount}, 1fr)`,
        gap,
        alignItems: vAlign,
        ...block.styles,
        ...blockAnimStyle(block.animation),
      }}
        className={block.stackOnMobile !== false ? "custom-row-stack" : ""}
      >
        {block.cols.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {col.map((b) => <BlockRenderer key={b.id} block={b} ctx={ctx} />)}
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "video") {
    return <CustomVideoBlock block={block} />;
  }

  if (block.type === "accordion") {
    return <CustomAccordionBlock block={block} />;
  }

  if (block.type === "countdown") {
    return <CustomCountdownBlock block={block} />;
  }

  if (block.type === "slideshow") {
    return <CustomSlideshowBlock block={block} />;
  }

  if (block.type === "product-embed") {
    return <CustomProductEmbedBlock block={block} />;
  }

  if (block.type === "badge") {
    const sizeMap = { sm: { fontSize: "0.7rem", padding: "3px 10px" }, md: { fontSize: "0.8rem", padding: "4px 14px" }, lg: { fontSize: "0.95rem", padding: "6px 18px" } };
    const sz = sizeMap[block.size ?? "md"];
    return (
      <span
        style={{
          display: "inline-block",
          borderRadius: "9999px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          backgroundColor: block.bgColor ?? "hsl(var(--primary))",
          color: block.color ?? "hsl(var(--primary-foreground))",
          ...sz,
          ...block.styles,
          ...blockAnimStyle(block.animation),
        }}
      >
        {block.text}
      </span>
    );
  }

  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag
        style={{
          margin: 0,
          paddingLeft: block.ordered ? "1.5em" : "1.2em",
          lineHeight: 1.8,
          listStyleType: block.ordered ? "decimal" : "disc",
          ...block.styles,
          ...blockAnimStyle(block.animation),
        }}
      >
        {block.items.map((item, i) => (
          <li key={i} style={{ paddingLeft: 4 }}>{item}</li>
        ))}
      </Tag>
    );
  }

  if (block.type === "card") {
    return <CardBlockView block={block} />;
  }

  if (block.type === "group") {
    const gapMap = { none: 0, sm: 8, md: 16, lg: 24 };
    const alignMap = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
    const dir = block.direction ?? "column";
    return (
      <div style={{
        display: "flex",
        flexDirection: dir as any,
        flexWrap: dir === "row-wrap" ? "wrap" : "nowrap",
        gap: gapMap[block.gap ?? "md"],
        alignItems: dir === "column" ? (alignMap[block.align ?? "start"] as any) : undefined,
        justifyContent: dir !== "column" ? (alignMap[block.align ?? "start"] as any) : undefined,
        width: "100%",
        ...block.styles,
        ...blockAnimStyle(block.animation),
      }}>
        {block.children.map((child) => (
          <BlockRenderer key={child.id} block={child} ctx={ctx} />
        ))}
      </div>
    );
  }

  if (block.type === "layout-box") {
    const lb = block as LayoutBoxBlock;
    const gapMap = { none: "0", sm: "8px", md: "16px", lg: "24px" };
    const gap = gapMap[lb.gap ?? "md"];
    const isGrid = lb.layout === "grid";
    const cols = lb.columns ?? 2;
    const colTemplate = lb.colTemplate ?? `repeat(${cols}, 1fr)`;
    const alignMap = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
    const dir = lb.direction ?? "row";
    return (
      <div style={{
        display: isGrid ? "grid" : "flex",
        ...(isGrid
          ? {
              gridTemplateColumns: colTemplate,
              gap,
            }
          : {
              flexDirection: dir as any,
              flexWrap: dir === "row-wrap" ? "wrap" : "nowrap",
              gap,
              alignItems: dir === "column" ? (alignMap[lb.align ?? "start"] as any) : undefined,
              justifyContent: dir !== "column" ? (alignMap[lb.align ?? "start"] as any) : undefined,
            }),
        width: "100%",
        ...lb.styles,
        ...blockAnimStyle(lb.animation),
      }}>
        {lb.children.map((child) => (
          <BlockRenderer key={child.id} block={child} ctx={ctx} />
        ))}
      </div>
    );
  }

  return null;
}

function CardBlockView({ block }: { block: import("@/lib/storefront").CardBlock }) {
  const shadowMap = { none: "none", sm: "0 1px 4px rgba(0,0,0,0.08)", md: "0 4px 16px rgba(0,0,0,0.12)", lg: "0 8px 32px rgba(0,0,0,0.18)" };
  const radiusMap = { none: "0", sm: "6px", md: "12px", lg: "20px" };
  const handleCtaAction = useBlockAction(block.ctaAction);
  return (
    <div
      style={{
        overflow: "hidden",
        border: block.bordered !== false ? "1px solid hsl(var(--border))" : "none",
        borderRadius: radiusMap[block.radius ?? "md"],
        boxShadow: shadowMap[block.shadow ?? "sm"],
        background: "hsl(var(--card))",
        color: "hsl(var(--card-foreground))",
        width: "100%",
        ...block.styles,
        ...blockAnimStyle(block.animation),
      }}
    >
      {block.image ? (
        <img src={block.image} alt={block.imageAlt ?? ""} style={{ width: "100%", height: block.imageHeight ?? 200, objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: block.imageHeight ?? 180, background: "hsl(var(--muted))", display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(var(--muted-foreground))" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        </div>
      )}
      <div style={{ padding: "16px" }}>
        {block.title && <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: block.body ? 6 : 0 }}>{block.title}</div>}
        {block.body && <div style={{ fontSize: "0.875rem", opacity: 0.7, lineHeight: 1.6, marginBottom: block.ctaLabel ? 12 : 0 }}>{block.body}</div>}
        {block.ctaLabel && (
          <button
            onClick={handleCtaAction}
            style={{ marginTop: 4, padding: "8px 18px", borderRadius: "6px", border: "none", cursor: "pointer", background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", fontWeight: 600, fontSize: "0.85rem" }}
          >
            {block.ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function resolveVideoEmbed(url: string): { kind: "iframe"; src: string } | { kind: "mp4"; src: string } {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return { kind: "iframe", src: `https://www.youtube.com/embed/${ytMatch[1]}` };
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  return { kind: "mp4", src: url };
}

function CustomVideoBlock({ block }: { block: VideoBlock }) {
  const ratioMap: Record<string, string> = { "16:9": "56.25%", "9:16": "177.78%", "4:3": "75%", "1:1": "100%" };
  const paddingBottom = ratioMap[block.ratio ?? "16:9"];
  const embed = resolveVideoEmbed(block.url);

  return (
    <div style={{ ...blockAnimStyle(block.animation) }}>
      <div style={{ position: "relative", width: "100%", paddingBottom, overflow: "hidden", borderRadius: 8, ...block.styles }}>
        {embed.kind === "iframe" ? (
          <iframe
            src={embed.src}
            title={block.caption ?? "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <video
            src={embed.src}
            controls={block.controls !== false}
            autoPlay={block.autoplay}
            muted={block.muted}
            loop={block.loop}
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
      {block.caption && (
        <p style={{ marginTop: 8, fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", textAlign: "center" }}>
          {block.caption}
        </p>
      )}
    </div>
  );
}

function CustomAccordionBlock({ block }: { block: AccordionBlock }) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    block.defaultOpen ? new Set([block.defaultOpen]) : new Set()
  );

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!block.allowMultiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, ...block.styles, ...blockAnimStyle(block.animation) }}>
      {block.items.map((item) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <button
              onClick={() => toggle(item.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "14px 0", textAlign: "left", fontWeight: 500, fontSize: "0.95rem",
                color: "currentColor",
              }}
            >
              <span>{item.title}</span>
              <span style={{
                display: "inline-flex", transition: "transform 0.25s ease",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0, marginLeft: 12,
              }}>
                <ChevronDown size={16} />
              </span>
            </button>
            <div style={{
              overflow: "hidden",
              maxHeight: isOpen ? "600px" : "0px",
              transition: "max-height 0.3s ease",
            }}>
              <p style={{ margin: 0, paddingBottom: 14, fontSize: "0.9rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>
                {item.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomFormBlock({ block }: { block: import("@/lib/storefront").FormBlock }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (block.submitAction?.type === "webhook") {
        await fetch(block.submitAction.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      } else if (block.submitAction?.type === "whatsapp") {
        const msg = Object.entries(values).map(([k, v]) => `${k}: ${v}`).join("\n");
        window.open(`https://wa.me/${block.submitAction.number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
      } else if (block.submitAction?.type === "email") {
        const msg = Object.entries(values).map(([k, v]) => `${k}: ${v}`).join("%0A");
        window.open(`mailto:${block.submitAction.to}?subject=Form submission&body=${msg}`);
      }
      setSubmitted(true);
    } catch { /* silent */ }
    setLoading(false);
  };

  if (submitted) {
    return <p style={{ padding: "16px 0", fontWeight: 600 }}>{block.successMessage ?? "Thank you! We'll be in touch."}</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, ...block.styles }}>
      {block.fields.map((field) => {
        const base: React.CSSProperties = {
          width: "100%", padding: "10px 14px", borderRadius: 8,
          border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--background))",
          fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
        };
        if (field.fieldType === "textarea") return (
          <div key={field.id}>
            <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>{field.label}{field.required && " *"}</label>
            <textarea required={field.required} placeholder={field.placeholder}
              value={values[field.label] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [field.label]: e.target.value }))}
              style={{ ...base, minHeight: 100, resize: "vertical" }} />
          </div>
        );
        if (field.fieldType === "select") return (
          <div key={field.id}>
            <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>{field.label}{field.required && " *"}</label>
            <select required={field.required} value={values[field.label] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [field.label]: e.target.value }))}
              style={{ ...base }}>
              <option value="">Select…</option>
              {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        );
        if (field.fieldType === "checkbox") return (
          <label key={field.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", cursor: "pointer" }}>
            <input type="checkbox" required={field.required}
              checked={values[field.label] === "true"}
              onChange={(e) => setValues((v) => ({ ...v, [field.label]: String(e.target.checked) }))} />
            {field.label}
          </label>
        );
        if (field.fieldType === "file") return (
          <div key={field.id}>
            <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>{field.label}{field.required && " *"}</label>
            <input type="file" required={field.required}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setValues((v) => ({ ...v, [field.label]: f ? f.name : "" }));
              }}
              style={{ width: "100%", padding: 8, border: "1px solid #e5e5e5", borderRadius: 8, fontSize: "0.85rem" }} />
          </div>
        );
        return (
          <div key={field.id}>
            <label style={{ display: "block", marginBottom: 4, fontSize: "0.85rem", fontWeight: 500 }}>{field.label}{field.required && " *"}</label>
            <input type={field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : "text"}
              required={field.required} placeholder={field.placeholder}
              value={values[field.label] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [field.label]: e.target.value }))}
              style={base} />
          </div>
        );
      })}
      <button type="submit" disabled={loading}
        style={{ padding: "11px 24px", borderRadius: 8, border: "none", cursor: loading ? "wait" : "pointer", fontWeight: 600,
          backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", fontSize: "0.9rem" }}>
        {loading ? "Sending…" : (block.submitLabel ?? "Submit")}
      </button>
    </form>
  );
}

function CustomCountdownBlock({ block }: { block: CountdownBlock }) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(block.targetDate));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(block.targetDate)), 1000);
    return () => clearInterval(id);
  }, [block.targetDate]);

  if (!timeLeft) {
    return (
      <div style={{ ...block.styles, ...blockAnimStyle(block.animation) }}>
        <p style={{ fontWeight: 600, margin: 0 }}>{block.expiredText ?? "Offer ended"}</p>
      </div>
    );
  }

  const units = block.showLabels !== false
    ? [
        { v: timeLeft.days, label: "Days" },
        { v: timeLeft.hours, label: "Hours" },
        { v: timeLeft.minutes, label: "Min" },
        { v: timeLeft.seconds, label: "Sec" },
      ]
    : [
        { v: timeLeft.days, label: "" },
        { v: timeLeft.hours, label: "" },
        { v: timeLeft.minutes, label: "" },
        { v: timeLeft.seconds, label: "" },
      ];

  return (
    <div style={{ ...block.styles, ...blockAnimStyle(block.animation) }}>
      {block.label && (
        <p style={{ marginBottom: 10, fontSize: "0.85rem", fontWeight: 500, color: "hsl(var(--muted-foreground))" }}>
          {block.label}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {units.map(({ v, label }, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 56 }}>
            <div style={{
              fontSize: "clamp(1.5rem,4vw,2.5rem)", fontWeight: 700, lineHeight: 1,
              padding: "10px 14px", borderRadius: 8,
              backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))",
              minWidth: 56, textAlign: "center",
            }}>
              {String(v).padStart(2, "0")}
            </div>
            {label && <span style={{ fontSize: "0.7rem", marginTop: 4, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function calcTimeLeft(targetDate: string): { days: number; hours: number; minutes: number; seconds: number } | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CustomSlideshowBlock({ block }: { block: SlideshowBlock }) {
  const [current, setCurrent] = useState(0);
  const count = block.slides.length;

  useEffect(() => {
    if (!block.autoplay || count <= 1) return;
    const delay = block.autoplayDelay ?? 3000;
    const id = setInterval(() => setCurrent((c) => (c + 1) % count), delay);
    return () => clearInterval(id);
  }, [block.autoplay, block.autoplayDelay, count]);

  if (count === 0) return null;

  const ratioMap: Record<string, string> = { "16:9": "56.25%", "4:3": "75%", "1:1": "100%", "3:2": "66.67%" };
  const paddingBottom = ratioMap[block.ratio ?? "16:9"];

  return (
    <div style={{ ...block.styles, ...blockAnimStyle(block.animation) }}>
      <div style={{ position: "relative", width: "100%", paddingBottom, borderRadius: 10, overflow: "hidden" }}>
        {block.slides.map((slide, i) => (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: i === current ? 1 : 0, transition: "opacity 0.55s ease" }}>
            {slide.src
              ? <img src={slide.src} alt={slide.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "hsl(var(--secondary))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem" }}>Slide {i + 1}</span>
                </div>
            }
            {slide.caption && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "8px 14px", background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                color: "white", fontSize: "0.82rem",
              }}>
                {slide.caption}
              </div>
            )}
          </div>
        ))}

        {block.showArrows !== false && count > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + count) % count)}
              style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % count)}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>

      {block.showDots !== false && count > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
          {block.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0,
                background: i === current ? "hsl(var(--primary))" : "hsl(var(--border))",
                transition: "background 0.25s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomProductEmbedBlock({ block }: { block: ProductEmbedBlock }) {
  const { products } = useVendorProducts();
  const product = products.find((p) => p.slug === block.productSlug);

  if (!product) {
    return (
      <div style={{
        padding: 16, border: "2px dashed hsl(var(--border))", borderRadius: 8, textAlign: "center",
        color: "hsl(var(--muted-foreground))", fontSize: "0.85rem",
        ...block.styles, ...blockAnimStyle(block.animation),
      }}>
        Select a product in the editor
      </div>
    );
  }

  return (
    <div style={{ ...block.styles, ...blockAnimStyle(block.animation) }}>
      <ProductCard product={product} variant={block.variant ?? "classic"} />
    </div>
  );
}

const CUSTOM_KEYFRAMES = `
  @media (max-width: 640px) { .custom-row-stack { grid-template-columns: 1fr !important; } }
  @keyframes kiosk-fadeIn    { from { opacity: 0 } to { opacity: 1 } }
  @keyframes kiosk-slideUp   { from { opacity: 0; transform: translateY(32px) } to { opacity: 1; transform: none } }
  @keyframes kiosk-slideLeft { from { opacity: 0; transform: translateX(-32px) } to { opacity: 1; transform: none } }
  @keyframes kiosk-slideRight{ from { opacity: 0; transform: translateX(32px) } to { opacity: 1; transform: none } }
  @keyframes kiosk-zoomIn    { from { opacity: 0; transform: scale(0.9) } to { opacity: 1; transform: none } }
  @keyframes kiosk-bounce    { 0%,100% { transform: translateY(0) } 40% { transform: translateY(-12px) } 70% { transform: translateY(-6px) } }
  @keyframes kiosk-pulse     { 0%,100% { opacity: 1 } 50% { opacity: 0.55 } }
`;

function CustomSectionView({ s }: { s: CustomSection }) {
  const tokens = useDesignTokens();
  const gapMap = { none: 0, sm: 8, md: 16, lg: 24 };
  const gap = gapMap[s.gap ?? "md"];
  const alignMap = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
  const align = alignMap[s.align ?? "start"];
  const bodyFamily = BODY_FONT_META[tokens.fontBody ?? "inherit"]?.family;
  const direction = (s as any).direction ?? "column";

  // Same RN-font → web-font normalization as useSectionStyles(), applied here since
  // custom sections render blocks through their own path rather than that hook.
  const customElStyles = useMemo(() => {
    const raw = ((s as any).elStyles ?? {}) as Record<string, React.CSSProperties>;
    const out: Record<string, React.CSSProperties> = {};
    for (const [key, styles] of Object.entries(raw)) {
      if (!styles) continue;
      const ff = (styles as Record<string, unknown>).fontFamily;
      out[key] = ff ? { ...styles, fontFamily: resolveElFontFamily(ff) } : styles;
    }
    return out;
  }, [(s as any).elStyles]);

  useEffect(() => {
    for (const styles of Object.values(customElStyles)) {
      const ff = (styles as Record<string, unknown>)?.fontFamily;
      if (typeof ff === "string") loadGoogleFont(ff);
    }
  }, [customElStyles]);
  const PX: Record<string, string> = { none: "0", sm: "24px", md: "48px", lg: "80px" };
  const PY: Record<string, string> = { none: "0", sm: "24px", md: "40px", lg: "80px" };

  const innerPadding: React.CSSProperties = {
    padding: `${PY[(s as any).paddingY ?? "md"]} ${PX[(s as any).paddingX ?? "md"]}`,
  };

  if (s.blocks.length === 0) {
    return (
      <div style={innerPadding}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 80, border: "2px dashed hsl(var(--border))", borderRadius: 8,
          color: "hsl(var(--muted-foreground))", fontSize: "0.85rem", gap: 8,
        }}>
          <Grid size={16} />
          <span>{s.label ?? "Custom section"} — add blocks in the editor</span>
        </div>
      </div>
    );
  }

  return (
    <div style={innerPadding}>
      <style>{CUSTOM_KEYFRAMES}</style>
      <div style={{
        display: "flex",
        flexDirection: direction as any,
        flexWrap: direction === "row-wrap" ? "wrap" : "nowrap",
        gap,
        alignItems: direction === "column" ? (align as any) : undefined,
        justifyContent: direction !== "column" ? (align as any) : undefined,
        ...(bodyFamily ? { fontFamily: bodyFamily } : {}),
      }}>
        {s.blocks.map((block) => {
          const bs = (block as any).styles ?? {};
          const wrapStyle: React.CSSProperties = {
            alignSelf: bs.alignSelf ?? undefined,
            maxWidth: bs.maxWidth ?? undefined,
            marginTop: bs.marginTop ?? undefined,
            marginBottom: bs.marginBottom ?? undefined,
            opacity: bs.opacity !== undefined ? Number(bs.opacity) : undefined,
          };
          const hasWrapStyle = Object.values(wrapStyle).some((v) => v !== undefined);
          return hasWrapStyle ? (
            <div key={block.id} style={wrapStyle}>
              <BlockRenderer block={block} ctx={{ tokens, elStyles: customElStyles }} />
            </div>
          ) : (
            <BlockRenderer key={block.id} block={block} ctx={{ tokens, elStyles: customElStyles }} />
          );
        })}
      </div>
    </div>
  );
}

/** Returns inline styles for scroll-triggered entrance animation */
function useScrollReveal(animation: SectionAnimation | undefined): [React.RefObject<HTMLDivElement | null>, React.CSSProperties] {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!animation || animation === "none") return;
    // Respect reduced-motion and slow connections — skip animation
    const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = typeof navigator !== "undefined" ? (navigator as any).connection : undefined;
    const isSlowConn = conn && ["slow-2g", "2g"].includes(conn.effectiveType ?? "");
    if (prefersReduced || isSlowConn) { setVisible(true); return; }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return; }

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animation]);

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const dur = "0.65s";
  const base: React.CSSProperties = { transition: `opacity ${dur} ${ease}, transform ${dur} ${ease}`, willChange: "opacity, transform" };
  if (!animation || animation === "none") return [ref, {}];
  if (visible) return [ref, { ...base, opacity: 1, transform: "translate(0,0) scale(1)" }];
  const hidden: Record<SectionAnimation, React.CSSProperties> = {
    none: {},
    fadeIn:    { opacity: 0 },
    slideUp:   { opacity: 0, transform: "translateY(52px)" },
    slideLeft: { opacity: 0, transform: "translateX(-52px)" },
    slideRight:{ opacity: 0, transform: "translateX(52px)" },
    zoomIn:    { opacity: 0, transform: "scale(0.88)" },
  };
  return [ref, { ...base, ...(hidden[animation] ?? {}) }];
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
function ReviewsBlock({ s, vendorId }: { s: ReviewsSection; vendorId?: string }) {
  const st = useSectionStyles();
  const [liveItems, setLiveItems] = useState<ReviewsSection["testimonials"]>([]);

  useEffect(() => {
    if (!s.useRealReviews || !vendorId) return;
    const base = (import.meta.env as any)["VITE_API_BASE"] ?? "/api";
    fetch(`${base}/reviews/top?vendorId=${encodeURIComponent(vendorId)}&limit=${s.maxItems ?? 6}`)
      .then((r) => r.json())
      .then((res: any) => {
        if (Array.isArray(res?.data)) {
          setLiveItems(res.data.filter((r: any) => r.body).map((r: any) => ({
            name: r.buyerName ?? "Customer",
            rating: Math.max(1, Math.min(5, Number(r.rating))),
            text: r.body as string,
            productName: r.productName,
            date: r.createdAt,
          })));
        }
      })
      .catch(() => null);
  }, [s.useRealReviews, vendorId, s.maxItems]);

  const items = (s.useRealReviews && liveItems && liveItems.length > 0 ? liveItems : (s.testimonials ?? [])).slice(0, s.maxItems ?? 6);
  const variant = s.variant ?? "grid";

  const heading = (
    <>
      {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mb-8 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
      {items.length === 0 && (
        <p className="text-center text-sm text-muted-foreground opacity-60">No reviews yet — add them in the editor.</p>
      )}
    </>
  );

  const card = (r: (typeof items)[number], i: number, className = "") => (
    <div key={i} className={`rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 ${st.cardRadius} ${className}`} style={st.cardStyle}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, star) => (
          <span key={star} className={star < r.rating ? "text-amber-400" : "text-muted-foreground/30"}>★</span>
        ))}
      </div>
      <p className="text-sm leading-relaxed" style={st.bodyStyle}>"{r.text}"</p>
      <div className="mt-auto flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent overflow-hidden shrink-0">
          {r.avatar ? <img src={r.avatar} className="h-full w-full object-cover" alt="" /> : r.name[0]}
        </div>
        <div>
          <p className="text-xs font-semibold" style={st.headingStyle}>{r.name}</p>
          {r.productName && <p className="text-[11px] text-muted-foreground">{r.productName}</p>}
        </div>
      </div>
    </div>
  );

  if (variant === "carousel") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {heading}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {items.map((r, i) => card(r, i, "w-72 shrink-0 snap-start"))}
        </div>
      </div>
    );
  }

  if (variant === "masonry") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {heading}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {items.map((r, i) => <div key={i} className="mb-4 break-inside-avoid">{card(r, i)}</div>)}
        </div>
      </div>
    );
  }

  const cols = variant === "list" ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {heading}
      <div className={`grid gap-4 ${cols}`}>{items.map((r, i) => card(r, i))}</div>
    </div>
  );
}

// ─── Lookbook ─────────────────────────────────────────────────────────────────
function LookbookBlock({ s }: { s: LookbookSection }) {
  const st = useSectionStyles();
  const variant = s.variant ?? "grid";
  const items = s.items ?? [];

  const heading = (
    <>
      {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mb-8 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
    </>
  );

  const overlayCard = (item: (typeof items)[number], i: number, className: string) => (
    <div key={i} className={`relative overflow-hidden group cursor-pointer rounded-2xl bg-muted ${className}`} style={st.cardStyle}>
      {item.image && <img src={item.image} alt={item.title ?? ""} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={st.imageStyle} />}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4">
        {item.title && <p className="text-sm font-semibold text-white" style={st.headingStyle}>{item.title}</p>}
        {item.description && <p className="mt-0.5 text-xs text-white/80" style={st.bodyStyle}>{item.description}</p>}
        {item.link && <a href={item.link} className="mt-2 inline-block text-xs font-semibold text-white underline underline-offset-2 hover:opacity-80">Shop the look →</a>}
      </div>
    </div>
  );

  if (variant === "masonry") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {heading}
        <div className="columns-2 gap-3 sm:columns-3">
          {items.map((item, i) => (
            <div key={i} className="relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-muted group cursor-pointer" style={st.cardStyle}>
              {item.image && <img src={item.image} alt={item.title ?? ""} className="w-full transition-transform duration-500 group-hover:scale-105" style={st.imageStyle} />}
              <div className="p-3">
                {item.title && <p className="text-sm font-semibold" style={st.headingStyle}>{item.title}</p>}
                {item.description && <p className="mt-0.5 text-xs text-muted-foreground" style={st.bodyStyle}>{item.description}</p>}
                {item.link && <a href={item.link} className="mt-2 inline-block text-xs font-semibold underline underline-offset-2 hover:opacity-80">Shop the look →</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "scroller") {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="px-4">{heading}</div>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {items.map((item, i) => overlayCard(item, i, "w-64 shrink-0 snap-start aspect-[3/4]"))}
        </div>
      </div>
    );
  }

  if (variant === "editorial") {
    const [first, ...rest] = items;
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {heading}
        {first && overlayCard(first, 0, "mb-4 aspect-[16/9]")}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {rest.map((item, i) => overlayCard(item, i + 1, "aspect-[3/4]"))}
        </div>
      </div>
    );
  }

  // grid (default)
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {heading}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item, i) => overlayCard(item, i, "aspect-[3/4]"))}
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function TimelineBlock({ s }: { s: TimelineSection }) {
  const st = useSectionStyles();
  const variant = (s as any).variant ?? "vertical";
  const milestones = s.milestones ?? [];

  if (variant === "horizontal") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {s.subheading && <p className="mb-10 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {milestones.map((m, i) => (
            <div key={i} className={`w-64 shrink-0 snap-start rounded-xl p-4`} style={st.cardStyle}>
              <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">{m.year}</span>
              <p className="mt-3 font-semibold" style={st.headingStyle}>{m.title}</p>
              {m.description && <p className="mt-1 text-sm text-muted-foreground" style={st.bodyStyle}>{m.description}</p>}
              {m.image && <img src={m.image} alt={m.title} className="mt-3 rounded-xl object-cover max-h-40 w-full" style={st.imageStyle} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {s.subheading && <p className="mb-10 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        <div className="flex flex-col divide-y divide-border">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-6 py-5">
              <span className="w-16 shrink-0 text-sm font-bold text-muted-foreground">{m.year}</span>
              <div>
                <p className="font-semibold" style={st.headingStyle}>{m.title}</p>
                {m.description && <p className="mt-1 text-sm text-muted-foreground" style={st.bodyStyle}>{m.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // vertical (default)
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mb-10 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
      <div className="relative">
        <div className="absolute left-14 top-0 bottom-0 w-px bg-border" />
        <div className="flex flex-col gap-8">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-6 items-start">
              <div className="w-24 shrink-0 text-right">
                <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">{m.year}</span>
              </div>
              <div className={`relative flex-1 pb-4 rounded-xl p-3`} style={st.cardStyle}>
                <div className="absolute -left-[25px] top-4 h-3 w-3 rounded-full border-2 border-accent bg-background" />
                <p className="font-semibold" style={st.headingStyle}>{m.title}</p>
                {m.description && <p className="mt-1 text-sm text-muted-foreground" style={st.bodyStyle}>{m.description}</p>}
                {m.image && <img src={m.image} alt={m.title} className="mt-3 rounded-xl object-cover max-h-40 w-full" style={st.imageStyle} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Before / After ───────────────────────────────────────────────────────────
/** Drag-to-reveal before/after comparison — a range input drives a clip-path on the "after" layer. */
function BeforeAfterSlider({ before, after }: { before?: string; after?: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-muted select-none">
      {before && <img src={before} alt="Before" className="absolute inset-0 h-full w-full object-cover" />}
      {after && (
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={after} alt="After" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
      <span className="absolute top-3 left-3 rounded bg-black/60 px-2 py-0.5 text-xs font-bold text-white">BEFORE</span>
      <span className="absolute top-3 right-3 rounded bg-accent/80 px-2 py-0.5 text-xs font-bold text-accent-foreground">AFTER</span>
      <input
        type="range" min={0} max={100} value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-x-0 bottom-3 mx-auto w-2/3 accent-white"
      />
    </div>
  );
}

function BeforeAfterBlock({ s }: { s: BeforeAfterSection }) {
  const st = useSectionStyles();
  const variant = (s as any).variant ?? "side-by-side";
  const pairs = s.pairs ?? [];

  if (variant === "slider") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {s.subheading && <p className="mb-8 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        <div className="flex flex-col gap-8">
          {pairs.map((p, i) => (
            <div key={i} className={`rounded-2xl p-4`} style={st.cardStyle}>
              {p.label && <p className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider" style={st.headingStyle}>{p.label}</p>}
              <BeforeAfterSlider before={p.beforeImage} after={p.afterImage} />
              {p.description && <p className="mt-2 text-sm text-muted-foreground" style={st.bodyStyle}>{p.description}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pairCard = (p: (typeof pairs)[number], i: number) => (
    <div key={i} className={`rounded-2xl p-4`} style={st.cardStyle}>
      {p.label && <p className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider" style={st.headingStyle}>{p.label}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
          {p.beforeImage && <img src={p.beforeImage} alt="Before" className="h-full w-full object-cover" />}
          <span className="absolute top-3 left-3 rounded bg-black/60 px-2 py-0.5 text-xs font-bold text-white">BEFORE</span>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
          {p.afterImage && <img src={p.afterImage} alt="After" className="h-full w-full object-cover" />}
          <span className="absolute top-3 left-3 rounded bg-accent/80 px-2 py-0.5 text-xs font-bold text-accent-foreground">AFTER</span>
        </div>
      </div>
      {p.description && <p className="mt-2 text-sm text-muted-foreground" style={st.bodyStyle}>{p.description}</p>}
    </div>
  );

  if (variant === "grid") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {s.subheading && <p className="mb-8 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        <div className="grid gap-6 sm:grid-cols-2">{pairs.map(pairCard)}</div>
      </div>
    );
  }

  // side-by-side (default)
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mb-8 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
      <div className="flex flex-col gap-8">{pairs.map(pairCard)}</div>
    </div>
  );
}

// ─── Bundle Offer ─────────────────────────────────────────────────────────────
function BundleOfferBlock({ s }: { s: BundleOfferSection }) {
  const st = useSectionStyles();
  const accentColor = s.accentColor;
  const variant = (s as any).variant ?? "cards";

  if (variant === "compact") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className={`flex flex-col items-center gap-4 rounded-xl border border-border p-5 sm:flex-row sm:justify-between ${st.cardRadius}`} style={st.cardStyle}>
          <div className="text-center sm:text-left">
            {s.bundleLabel && <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{s.bundleLabel}</p>}
            {s.heading && <p className={`font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</p>}
            <div className="mt-1 flex items-baseline justify-center gap-2 sm:justify-start">
              <span className="text-xl font-bold" style={{ color: accentColor, ...st.priceStyle }}>{s.bundlePrice}</span>
              {s.originalPrice && <span className="text-sm text-muted-foreground line-through">{s.originalPrice}</span>}
            </div>
          </div>
          {s.ctaLabel && (
            <a href={s.ctaLink ?? "#"} className={`shrink-0 inline-flex items-center justify-center rounded-full px-6 py-2.5 font-bold text-white hover:opacity-90 transition-opacity`} style={{ backgroundColor: accentColor ?? "hsl(var(--accent))", ...st.btnStyle }}>
              {s.ctaLabel}
            </a>
          )}
        </div>
      </div>
    );
  }

  const isFeatured = variant === "featured";
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      {s.heading && <h2 className={`mb-2 text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mb-6 text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
      <div
        className={`${isFeatured ? "border-0 text-white" : "border-2"} rounded-2xl p-8 ${st.cardRadius}`}
        style={isFeatured ? { backgroundColor: accentColor ?? "hsl(var(--accent))" } : { borderColor: accentColor ?? "hsl(var(--accent))", ...st.cardStyle }}
      >
        {s.bundleLabel && <p className={`mb-4 text-xs font-semibold uppercase tracking-widest ${isFeatured ? "text-white/80" : "text-muted-foreground"}`}>{s.bundleLabel}</p>}
        <div className="flex items-baseline justify-center gap-3">
          <span className="text-4xl font-bold" style={isFeatured ? undefined : { color: accentColor, ...st.priceStyle }}>{s.bundlePrice}</span>
          {s.originalPrice && <span className={`text-lg line-through ${isFeatured ? "text-white/70" : "text-muted-foreground"}`}>{s.originalPrice}</span>}
        </div>
        {s.savingsLabel && (
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${isFeatured ? "bg-white/20 text-white" : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"}`}>
            {s.savingsLabel}
          </span>
        )}
        {s.ctaLabel && (
          <a
            href={s.ctaLink ?? "#"}
            className={`mt-6 inline-flex items-center justify-center rounded-xl px-8 py-3 font-bold transition-opacity hover:opacity-90 ${isFeatured ? "bg-white text-black" : "text-white"} ${st.btnRadius}`}
            style={isFeatured ? undefined : { backgroundColor: accentColor ?? "hsl(var(--accent))", ...st.btnStyle }}
          >
            {s.ctaLabel}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Video Hero ───────────────────────────────────────────────────────────────
function VideoHeroBlock({ s }: { s: VideoHeroSection }) {
  const st = useSectionStyles();
  const heightMap = { sm: "h-64", md: "h-96", lg: "h-[480px]", full: "min-h-screen" };
  const h = heightMap[s.height ?? "md"];
  const alignClass = s.align === "left" ? "items-start text-left" : s.align === "right" ? "items-end text-right" : "items-center text-center";
  const overlayOpacity = (s.overlayOpacity ?? 40) / 100;
  const variant = (s as any).variant ?? "overlay";

  const videoLayer = (className: string) =>
    s.videoUrl ? (
      <video src={s.videoUrl} poster={s.posterImage} autoPlay muted loop playsInline className={className} />
    ) : s.posterImage ? (
      <img src={s.posterImage} alt="" className={className} />
    ) : (
      <div className={`${className} bg-neutral-900`} />
    );

  if (variant === "split") {
    return (
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-16">
        <div className={`overflow-hidden ${st.cardRadius}`}>{videoLayer("aspect-video w-full object-cover")}</div>
        <div>
          {s.heading && <h1 className={`${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>}
          {s.subheading && <p className="mt-4 text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
          {s.ctaLabel && (
            <a href={s.ctaLink ?? "#"} className={`mt-6 inline-flex ${st.btn}`} style={st.btnStyle}>{s.ctaLabel}</a>
          )}
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        {s.heading && <h1 className={`${st.h1} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>}
        {s.subheading && <p className="mx-auto mt-4 max-w-xl text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        {s.ctaLabel && (
          <a href={s.ctaLink ?? "#"} className={`mt-6 inline-flex ${st.btn}`} style={st.btnStyle}>{s.ctaLabel}</a>
        )}
        <div className={`relative mt-10 overflow-hidden ${h} ${st.cardRadius}`}>
          {videoLayer("absolute inset-0 h-full w-full object-cover")}
        </div>
      </div>
    );
  }

  // overlay (default)
  return (
    <div className={`relative overflow-hidden ${h} flex flex-col justify-center px-6`}>
      {videoLayer("absolute inset-0 w-full h-full object-cover")}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
      <div className={`relative z-10 flex flex-col gap-4 max-w-3xl mx-auto w-full ${alignClass}`}>
        {s.heading && <h1 className={`text-4xl md:text-6xl font-bold text-white ${st.hFont}`} style={st.headingStyle}>{s.heading}</h1>}
        {s.subheading && <p className="text-lg text-white/80" style={st.bodyStyle}>{s.subheading}</p>}
        {s.ctaLabel && (
          <a href={s.ctaLink ?? "#"} className={`mt-2 ${st.btnWhite}`} style={st.btnStyle}>
            {s.ctaLabel}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Social Feed ──────────────────────────────────────────────────────────────
function SocialFeedBlock({ s }: { s: SocialFeedSection }) {
  const st = useSectionStyles();
  const cols = s.columns ?? 3;
  const gridClass = cols <= 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-2 sm:grid-cols-3" : cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-5";
  const variant = s.variant ?? "grid";
  const posts = s.posts ?? [];

  const heading = (s.heading || s.handle) && (
    <div className="mb-6 flex items-center justify-between">
      {s.heading && <h2 className={`text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.showHandle && s.handle && <p className="text-sm text-muted-foreground">@{s.handle}</p>}
    </div>
  );

  const tile = (post: (typeof posts)[number], i: number, className: string) => (
    <a key={i} href={post.link ?? "#"} className={`block relative overflow-hidden ${st.cardRadius} bg-muted group ${className}`} style={st.cardStyle}>
      {post.imageUri && <img src={post.imageUri} alt={post.caption ?? ""} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />}
      {post.caption && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <p className="text-xs text-white line-clamp-2">{post.caption}</p>
        </div>
      )}
    </a>
  );

  if (variant === "scroller") {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="px-4">{heading}</div>
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2">
          {posts.map((post, i) => tile(post, i, "aspect-square w-32 shrink-0 snap-start sm:w-40"))}
        </div>
      </div>
    );
  }

  if (variant === "masonry") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {heading}
        <div className="columns-2 gap-2 sm:columns-3">
          {posts.map((post, i) => (
            <div key={i} className="mb-2 break-inside-avoid">{tile(post, i, "aspect-square")}</div>
          ))}
        </div>
      </div>
    );
  }

  // grid (default)
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {heading}
      <div className={`grid gap-2 ${gridClass}`}>
        {posts.map((post, i) => tile(post, i, "aspect-square"))}
      </div>
    </div>
  );
}

// ─── Map & Location ───────────────────────────────────────────────────────────
function MapLocationBlock({ s }: { s: MapLocationSection }) {
  const st = useSectionStyles();
  const infoCard = (
    <div className={`rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 ${st.cardRadius}`} style={st.cardStyle}>
      {s.heading && <h2 className={`text-xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className="flex flex-col gap-3 text-sm">
        {s.address && (
          <div className="flex gap-2 items-start">
            <GeoAlt className="mt-0.5 shrink-0 text-muted-foreground" size={15} />
            <span style={st.bodyStyle}>{s.address}</span>
          </div>
        )}
        {s.phone && (
          <div className="flex gap-2 items-center">
            <Telephone className="shrink-0 text-muted-foreground" size={15} />
            <a href={`tel:${s.phone}`} className="hover:underline" style={st.bodyStyle}>{s.phone}</a>
          </div>
        )}
        {s.email && (
          <div className="flex gap-2 items-center">
            <Envelope className="shrink-0 text-muted-foreground" size={15} />
            <a href={`mailto:${s.email}`} className="hover:underline" style={st.bodyStyle}>{s.email}</a>
          </div>
        )}
        {s.hours && (
          <div className="flex gap-2 items-start">
            <Sun className="mt-0.5 shrink-0 text-muted-foreground" size={15} />
            <span style={st.bodyStyle}>{s.hours}</span>
          </div>
        )}
      </div>
      {s.ctaLabel && (
        <a href={s.ctaLink ?? `https://www.google.com/maps/search/${encodeURIComponent(s.address ?? "")}`} target="_blank" rel="noopener noreferrer" className={`mt-2 ${st.btn}`} style={st.btnStyle}>
          {s.ctaLabel}
        </a>
      )}
    </div>
  );
  // Declared variants are simple/split/card (see kioskm SECTION_VARIANTS) — this
  // used to check for "stacked", a value the editor's picker can never actually
  // send, so every real choice fell through to the same layout.
  const variant = (s as any).variant ?? "split";

  if (variant === "simple") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        {infoCard}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        {s.mapEmbedUrl && (
          <div className={`mb-6 overflow-hidden ${st.cardRadius}`}>
            <iframe src={s.mapEmbedUrl} className="w-full" height="280" loading="lazy" />
          </div>
        )}
        {infoCard}
      </div>
    );
  }

  // split (default)
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {infoCard}
        {s.mapEmbedUrl && <iframe src={s.mapEmbedUrl} className="w-full rounded-2xl" height="400" loading="lazy" />}
      </div>
    </div>
  );
}

// ─── Size Guide ───────────────────────────────────────────────────────────────
function SizeGuideBlock({ s }: { s: SizeGuideSection }) {
  const st = useSectionStyles();
  const cols = s.columns ?? [];
  const rows = s.rows ?? [];
  const variant = (s as any).variant ?? "table";
  const [openSize, setOpenSize] = useState<string | null>(null);

  const heading = (
    <>
      {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mb-6 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
      {s.unit && <p className="mb-4 text-center text-xs text-muted-foreground uppercase tracking-wider">All measurements in {s.unit}</p>}
    </>
  );

  if (variant === "cards") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        {heading}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rows.map((row, i) => (
            <div key={i} className={`rounded-xl border border-border p-4 ${st.cardRadius}`} style={st.cardStyle}>
              <p className="font-bold" style={st.headingStyle}>{row.size}</p>
              <dl className="mt-2 space-y-1 text-xs text-muted-foreground">
                {cols.map((col, j) => (
                  <div key={j} className="flex justify-between gap-2">
                    <dt>{col}</dt>
                    <dd>{row[col] ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        {s.note && <p className="mt-4 text-center text-xs text-muted-foreground" style={st.bodyStyle}>{s.note}</p>}
      </div>
    );
  }

  if (variant === "accordion") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        {heading}
        <div className="divide-y divide-border rounded-xl border border-border" style={st.cardStyle}>
          {rows.map((row, i) => {
            const open = openSize === row.size;
            return (
              <div key={i}>
                <button type="button" onClick={() => setOpenSize(open ? null : row.size)} className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold">
                  {row.size}
                  <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <dl className="grid grid-cols-2 gap-1 px-4 pb-4 text-sm text-muted-foreground">
                    {cols.map((col, j) => (
                      <div key={j} className="flex justify-between gap-2">
                        <dt>{col}</dt>
                        <dd>{row[col] ?? "—"}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
        {s.note && <p className="mt-4 text-center text-xs text-muted-foreground" style={st.bodyStyle}>{s.note}</p>}
      </div>
    );
  }

  // table (default)
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {heading}
      <div className="overflow-x-auto rounded-2xl border border-border" style={st.cardStyle}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold" style={st.headingStyle}>Size</th>
              {cols.map((col, i) => (
                <th key={i} className="px-4 py-3 text-left font-semibold" style={st.headingStyle}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-semibold" style={st.bodyStyle}>{row.size}</td>
                {cols.map((col, j) => (
                  <td key={j} className="px-4 py-3 text-muted-foreground" style={st.bodyStyle}>{row[col] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s.note && <p className="mt-4 text-center text-xs text-muted-foreground" style={st.bodyStyle}>{s.note}</p>}
    </div>
  );
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
function PortfolioBlock({ s }: { s: PortfolioSection }) {
  const st = useSectionStyles();
  const cols = s.columns ?? 3;
  const gridClass = cols === 2 ? "grid-cols-1 sm:grid-cols-2" : cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3";
  const variant = (s as any).variant ?? "grid";
  const items = s.items ?? [];

  const heading = (
    <>
      {s.heading && <h2 className={`mb-2 text-center text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mb-8 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
    </>
  );

  const card = (item: (typeof items)[number], i: number) => (
    <div key={i} className={`rounded-2xl overflow-hidden border border-border bg-card ${st.cardRadius}`} style={st.cardStyle}>
      {item.image && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" style={st.imageStyle} />
        </div>
      )}
      <div className="p-4">
        {item.category && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.category}</p>}
        <p className="font-semibold" style={st.headingStyle}>{item.title}</p>
        {item.description && <p className="mt-1 text-sm text-muted-foreground" style={st.bodyStyle}>{item.description}</p>}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((t, ti) => (
              <span key={ti} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className={`mt-3 ${st.btnOutline} text-sm`} style={st.btnStyle}>
            View project <BoxArrowUpRight size={13} />
          </a>
        )}
      </div>
    </div>
  );

  if (variant === "masonry") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {heading}
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {items.map((item, i) => <div key={i} className="mb-6 break-inside-avoid">{card(item, i)}</div>)}
        </div>
      </div>
    );
  }

  if (variant === "editorial") {
    const [first, ...rest] = items;
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {heading}
        {first && <div className="mb-6">{card(first, 0)}</div>}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((item, i) => card(item, i + 1))}
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        {heading}
        <div className="divide-y divide-border">
          {items.map((item, i) => (
            <a key={i} href={item.link ?? undefined} target={item.link ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center justify-between gap-4 py-4 group">
              <div>
                {item.category && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.category}</p>}
                <p className="font-semibold group-hover:underline" style={st.headingStyle}>{item.title}</p>
              </div>
              {item.link && <BoxArrowUpRight size={14} className="shrink-0 text-muted-foreground" />}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // grid (default)
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {heading}
      <div className={`grid gap-6 ${gridClass}`}>{items.map(card)}</div>
    </div>
  );
}

// ─── WhatsApp CTA ─────────────────────────────────────────────────────────────
function WhatsAppCtaBlock({ s }: { s: WhatsAppCtaSection }) {
  const st = useSectionStyles();
  const phone = (s.phone ?? "").replace(/\D/g, "");
  const waUrl = phone ? `https://wa.me/${phone}${s.prefilledMessage ? `?text=${encodeURIComponent(s.prefilledMessage)}` : ""}` : "#";

  if (s.variant === "minimal") {
    return (
      <div className="py-10 flex flex-col items-center gap-4 text-center px-4">
        {s.heading && <h2 className={`text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {s.subheading && <p className="text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white hover:opacity-90 transition-opacity`} style={{ backgroundColor: "#25D366", ...st.btnStyle }}>
          <Whatsapp size={20} /> {s.buttonLabel ?? "Chat on WhatsApp"}
        </a>
      </div>
    );
  }

  if (s.variant === "banner") {
    return (
      <div className="relative overflow-hidden rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 mx-4 my-6" style={{ backgroundColor: "#f0fdf4", ...st.cardStyle }}>
        <div className="flex flex-col gap-2">
          {s.heading && <h2 className={`text-2xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
          {s.subheading && <p className="text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        </div>
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={`shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white hover:opacity-90 transition-opacity`} style={{ backgroundColor: "#25D366", ...st.btnStyle }}>
          <Whatsapp size={20} /> {s.buttonLabel ?? "Chat on WhatsApp"}
        </a>
      </div>
    );
  }

  // card (default)
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className={`rounded-2xl p-8 text-center flex flex-col items-center gap-4 border border-border ${st.cardRadius}`} style={st.cardStyle}>
        <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#25D366" }}>
          <Whatsapp size={32} color="#fff" />
        </div>
        {s.heading && <h2 className={`text-xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {s.subheading && <p className="text-muted-foreground text-sm" style={st.bodyStyle}>{s.subheading}</p>}
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white hover:opacity-90 transition-opacity`} style={{ backgroundColor: "#25D366", ...st.btnStyle }}>
          <Whatsapp size={18} /> {s.buttonLabel ?? "Chat on WhatsApp"}
        </a>
      </div>
    </div>
  );
}

// ─── Trust Badges ─────────────────────────────────────────────────────────────
const TRUST_ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  shield: Shield, lock: Lock, check: CheckCircle, truck: Truck, award: Award,
  star: Star, heart: Heart, gift: Gift, lightning: Lightning,
};

function TrustBadgesBlock({ s }: { s: TrustBadgesSection }) {
  const st = useSectionStyles();
  const badges = s.badges ?? [];
  const variant = s.variant ?? "row";

  if (variant === "minimal") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        {s.heading && <h2 className={`mb-4 text-center text-xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {badges.map((badge, i) => {
            const Icon = TRUST_ICON_MAP[badge.icon] ?? Shield;
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Icon size={15} className="text-primary" />
                <span style={st.bodyStyle}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const isGrid = variant === "grid";
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {s.heading && <h2 className={`mb-6 text-center text-xl font-bold ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className={isGrid ? "grid grid-cols-2 sm:grid-cols-3 gap-4" : "flex flex-wrap justify-center gap-4"}>
        {badges.map((badge, i) => {
          const Icon = TRUST_ICON_MAP[badge.icon] ?? Shield;
          return (
            <div key={i} className={`flex ${isGrid ? "flex-col items-center text-center gap-2" : "flex-row items-center gap-3"} rounded-2xl border border-border bg-card p-4 ${st.cardRadius}`} style={st.cardStyle}>
              <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={st.headingStyle}>{badge.label}</p>
                {badge.description && <p className="text-xs text-muted-foreground mt-0.5" style={st.bodyStyle}>{badge.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payment Methods ──────────────────────────────────────────────────────────
const PM_COLORS: Record<string, string> = {
  paystack: "#00C3F7", flutterwave: "#F5A623", opay: "#1AC94E",
  palmpay: "#06C270", monnify: "#0066CC", bank: "#3B5BDB",
  "bank-transfer": "#3B5BDB", card: "#374151", ussd: "#9333EA", cash: "#16A34A",
};

// Paystack SVG logo mark: teal background + white check
const PaystackLogo = () => (
  <svg width="20" height="20" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="7" fill="#00C3F7"/>
    <path d="M9 18.5L15 25L27 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Flutterwave SVG logo mark: orange background + white wave lines
const FlutterwaveLogo = () => (
  <svg width="20" height="20" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="7" fill="#F5A623"/>
    <path d="M7 14 Q12 9 18 14 Q24 19 29 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M7 20 Q12 15 18 20 Q24 25 29 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M7 26 Q12 21 18 26 Q24 31 29 26" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.55"/>
  </svg>
);

// Icon mapping for other providers
function PMIcon({ id, color }: { id: string; color: string }) {
  const s = { color, fontSize: "14px" };
  switch (id) {
    case "opay":         return <span style={s}><Telephone /></span>;
    case "palmpay":      return <span style={s}><Gift /></span>;
    case "monnify":      return <span style={s}><Shield /></span>;
    case "bank":
    case "bank-transfer":return <span style={s}><CreditCard2Front /></span>;
    case "card":         return <span style={s}><CreditCard2Front /></span>;
    case "ussd":         return <span style={s}><Telephone /></span>;
    case "cash":         return <span style={s}><Award /></span>;
    default:             return <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />;
  }
}

function PaymentMethodsBlock({ s }: { s: PaymentMethodsSection }) {
  const st = useSectionStyles();
  const methods = (s.methods ?? []).filter((m) => m.enabled);
  const isGrid = s.variant === "grid";
  const isBrand = (id: string) => id === "paystack" || id === "flutterwave";
  return (
    <div className="mx-auto max-w-4xl px-4">
      {s.heading && <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground" style={st.headingStyle}>{s.heading}</p>}
      <div className={isGrid ? "grid grid-cols-2 sm:grid-cols-3 gap-3" : "flex flex-wrap justify-center gap-3"}>
        {methods.map((m) => {
          const color = PM_COLORS[m.id] ?? "#6b7280";
          return (
            <div key={m.id} className="inline-flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-shadow hover:shadow-sm"
              style={{ borderColor: color + "50", backgroundColor: color + "10", ...st.cardStyle }}>
              {m.id === "paystack" ? <PaystackLogo /> :
               m.id === "flutterwave" ? <FlutterwaveLogo /> :
               <div className="flex h-5 w-5 items-center justify-center rounded" style={{ backgroundColor: color }}>
                 <PMIcon id={m.id} color="#fff" />
               </div>}
              <span style={isBrand(m.id) ? { color, fontWeight: 700 } : st.bodyStyle}>{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Columns (free-layout) ───────────────────────────────────────────────────
function ColumnsBlock({ s }: { s: ColumnsSection }) {
  const st = useSectionStyles();
  const variant = (s as any).variant ?? "plain";
  const count = s.count ?? 2;
  const gapClass = s.gap === "sm" ? "gap-4" : s.gap === "lg" ? "gap-10" : "gap-6";
  const gridClass = count === 2 ? "grid-cols-1 sm:grid-cols-2" : count === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-3";
  const imgRatio = s.imgAspectRatio ?? 1;

  const ColItem = ({ col, i }: { col: ColumnItem; i: number }) => {
    if (variant === "image-side") {
      return (
        <div className="flex gap-4 items-start">
          {col.imageUri ? (
            <img src={col.imageUri} alt={col.heading ?? ""} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" style={st.imageStyle} />
          ) : col.iconName ? (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xl" style={{ backgroundColor: (st.headingStyle.color as string) ?? "var(--primary)" }}>
              <BoxArrowUpRight />
            </div>
          ) : null}
          <div>
            {col.heading && <h3 className="font-bold text-base mb-1" style={st.headingStyle}>{col.heading}</h3>}
            {col.body && <p className="text-sm text-muted-foreground leading-relaxed" style={st.bodyStyle}>{col.body}</p>}
            {col.ctaLabel && col.ctaHref && (
              <a href={col.ctaHref} className="text-sm font-semibold mt-2 inline-block" style={{ color: (st.headingStyle.color as string) ?? "var(--primary)" }}>{col.ctaLabel} →</a>
            )}
          </div>
        </div>
      );
    }
    if (variant === "numbered") {
      return (
        <div className="flex gap-4 items-start">
          <span className="text-5xl font-black leading-none flex-shrink-0 opacity-20" style={st.headingStyle}>{String(i + 1).padStart(2, "0")}</span>
          <div className="pt-2">
            {col.heading && <h3 className="font-bold text-base mb-1" style={st.headingStyle}>{col.heading}</h3>}
            {col.body && <p className="text-sm text-muted-foreground leading-relaxed" style={st.bodyStyle}>{col.body}</p>}
            {col.ctaLabel && col.ctaHref && (
              <a href={col.ctaHref} className="text-sm font-semibold mt-2 inline-block" style={st.btnStyle}>{col.ctaLabel}</a>
            )}
          </div>
        </div>
      );
    }
    if (variant === "feature") {
      return (
        <div>
          {col.iconName ? (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl mb-4" style={{ backgroundColor: (st.headingStyle.color as string) ?? "var(--primary)" }}>
              <BoxArrowUpRight />
            </div>
          ) : col.imageUri ? (
            <img src={col.imageUri} alt={col.heading ?? ""} className="rounded-xl mb-4 object-cover w-full" style={{ aspectRatio: imgRatio, ...st.imageStyle }} />
          ) : null}
          {col.heading && <h3 className="font-bold text-lg mb-2" style={st.headingStyle}>{col.heading}</h3>}
          {col.body && <p className="text-sm text-muted-foreground leading-relaxed" style={st.bodyStyle}>{col.body}</p>}
          {col.ctaLabel && col.ctaHref && (
            <a href={col.ctaHref} className="text-sm font-semibold mt-3 inline-block" style={{ color: (st.headingStyle.color as string) ?? "var(--primary)" }}>{col.ctaLabel} →</a>
          )}
        </div>
      );
    }
    if (variant === "cards") {
      return (
        <div className="border rounded-xl p-6 h-full" style={st.cardStyle}>
          {col.imageUri && <img src={col.imageUri} alt={col.heading ?? ""} className="rounded-lg mb-4 object-cover w-full" style={{ aspectRatio: imgRatio, ...st.imageStyle }} />}
          {col.iconName && (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: st.headingStyle.color ? (st.headingStyle.color as string) + "18" : "#0001" }}>
              <BoxArrowUpRight className="text-lg" style={{ color: st.headingStyle.color }} />
            </div>
          )}
          {col.heading && <h3 className="font-bold text-base mb-2" style={st.headingStyle}>{col.heading}</h3>}
          {col.body && <p className="text-sm text-muted-foreground leading-relaxed" style={st.bodyStyle}>{col.body}</p>}
          {col.ctaLabel && col.ctaHref && (
            <a href={col.ctaHref} className="inline-block mt-4 px-5 py-2 rounded-full text-sm font-semibold text-white" style={st.btnStyle}>{col.ctaLabel}</a>
          )}
        </div>
      );
    }
    // PLAIN (default)
    return (
      <div>
        {col.imageUri && <img src={col.imageUri} alt={col.heading ?? ""} className="rounded-xl mb-4 object-cover w-full" style={{ aspectRatio: imgRatio, ...st.imageStyle }} />}
        {col.iconName && (
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: st.headingStyle.color ? (st.headingStyle.color as string) + "18" : "#0001" }}>
            <BoxArrowUpRight style={{ color: st.headingStyle.color }} />
          </div>
        )}
        {col.heading && <h3 className="font-bold text-base mb-2" style={st.headingStyle}>{col.heading}</h3>}
        {col.body && <p className="text-sm text-muted-foreground leading-relaxed" style={st.bodyStyle}>{col.body}</p>}
        {col.ctaLabel && col.ctaHref && (
          <a href={col.ctaHref} className="inline-block mt-3 px-5 py-2 rounded-full text-sm font-semibold text-white" style={st.btnStyle}>{col.ctaLabel}</a>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-6">
      {(s.heading || s.subheading) && (
        <div className="mb-10 text-left">
          {s.heading && <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
          {s.subheading && <p className="mt-2 text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        </div>
      )}
      <div className={`grid ${gridClass} ${gapClass}`}>
        {s.items.slice(0, count).map((col, i) => <ColItem key={i} col={col} i={i} />)}
      </div>
    </div>
  );
}

// ─── Pricing Plans ────────────────────────────────────────────────────────────
function PricingPlansBlock({ s }: { s: PricingPlansSection }) {
  const st = useSectionStyles();
  const variant = s.variant ?? "cards";

  const openPlan = (plan: PricingPlan) => {
    if (plan.paystackLink) {
      window.open(plan.paystackLink, "_blank", "noopener,noreferrer");
    } else if (plan.ctaLink) {
      window.location.href = plan.ctaLink;
    }
  };

  const PlanCard = ({ plan }: { plan: PricingPlan }) => (
    <div className={`border rounded-2xl p-7 flex flex-col transition-shadow hover:shadow-lg ${plan.highlighted ? "ring-2" : ""}`}
      style={{ ...(plan.highlighted ? { borderColor: st.headingStyle.color ?? "var(--primary)", ringColor: st.headingStyle.color } : {}), ...st.cardStyle }}>
      {plan.highlighted && (
        <div className="self-center mb-3 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: st.headingStyle.color ?? "var(--primary)" }}>POPULAR</div>
      )}
      <h3 className="font-bold text-center text-lg mb-1" style={st.headingStyle}>{plan.name}</h3>
      <div className="flex items-baseline justify-center gap-1 my-3">
        <span className="text-4xl font-black" style={plan.highlighted ? st.headingStyle : st.bodyStyle}>{plan.price}</span>
        {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
      </div>
      {plan.description && <p className="text-sm text-center text-muted-foreground mb-4" style={st.bodyStyle}>{plan.description}</p>}
      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 flex-shrink-0 text-green-500" />
            <span style={st.bodyStyle}>{f}</span>
          </li>
        ))}
      </ul>
      {plan.paystackLink && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-green-600 mb-3">
          <Lock /> Secure Paystack checkout
        </p>
      )}
      <button onClick={() => openPlan(plan)}
        className="w-full py-3 rounded-full font-semibold text-sm transition-opacity hover:opacity-90"
        style={plan.highlighted ? st.btnStyle : { borderWidth: 1, borderColor: (st.headingStyle.color as string) ?? "var(--primary)", color: st.headingStyle.color ?? "var(--primary)" }}>
        {plan.ctaLabel}
      </button>
    </div>
  );

  // TABLE: horizontal scroll comparison
  if (variant === "table") {
    return (
      <div className="mx-auto max-w-5xl px-4">
        {s.heading && <h2 className={`${st.h2} ${st.hFont} text-center`} style={st.headingStyle}>{s.heading}</h2>}
        {s.subheading && <p className="text-center text-muted-foreground mt-2 mb-10" style={st.bodyStyle}>{s.subheading}</p>}
        <div className="overflow-x-auto">
          <div className="flex gap-5 min-w-max pb-4">
            {s.plans.map((plan, i) => (
              <div key={i} className="w-64"><PlanCard plan={plan} /></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // CARDS (default)
  const gridClass = s.plans.length === 2 ? "grid-cols-1 sm:grid-cols-2" : s.plans.length >= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3";
  return (
    <div className="mx-auto max-w-5xl px-4">
      {s.heading && <h2 className={`${st.h2} ${st.hFont} text-center`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="text-center text-muted-foreground mt-2 mb-10" style={st.bodyStyle}>{s.subheading}</p>}
      <div className={`grid ${gridClass} gap-6`}>
        {s.plans.map((plan, i) => <PlanCard key={i} plan={plan} />)}
      </div>
    </div>
  );
}

function useCountdown(target: string) {
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    const calc = () => {
      const t = new Date(target).getTime() - Date.now();
      if (!Number.isFinite(t)) { setLeft(null); return; }
      setLeft({
        d: Math.max(0, Math.floor(t / 86400000)),
        h: Math.max(0, Math.floor((t % 86400000) / 3600000)),
        m: Math.max(0, Math.floor((t % 3600000) / 60000)),
        s: Math.max(0, Math.floor((t % 60000) / 1000)),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

function CountdownBlock({ s }: { s: CountdownSection }) {
  const st = useSectionStyles();
  const left = useCountdown(s.targetDate);
  const variant = (s as any).variant ?? "box";
  const boxes = left ? [
    { v: String(left.d).padStart(2, "0"), l: "Days" },
    { v: String(left.h).padStart(2, "0"), l: "Hours" },
    { v: String(left.m).padStart(2, "0"), l: "Minutes" },
    { v: String(left.s).padStart(2, "0"), l: "Seconds" },
  ] : [];

  if (variant === "banner") {
    return (
      <section className="mx-auto flex max-w-5xl flex-col items-center gap-4 border border-border px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left" style={st.cardStyle}>
        <div>
          {s.heading && <h2 className={`${st.hFont} text-lg font-bold`} style={st.headingStyle}>{s.heading}</h2>}
          {s.body && <p className="mt-0.5 text-sm text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
        </div>
        {left ? (
          <div className="flex items-center gap-2 md:gap-3">
            {boxes.map((b) => (
              <div key={b.l} className="flex min-w-14 flex-col items-center">
                <span className="text-xl font-bold tabular-nums" style={st.headingStyle}>{b.v}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.l}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Offer has ended</p>
        )}
        {s.ctaLabel && s.ctaLink && (
          <Link to={s.ctaLink} className={`shrink-0 ${st.btn}`} style={st.btnStyle}>
            {s.ctaLabel}
          </Link>
        )}
      </section>
    );
  }

  // box (default)
  return (
    <section className="mx-auto max-w-4xl px-6 py-10 text-center">
      {s.heading && <h2 className={`${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.body && <p className="mt-3 text-muted-foreground" style={st.bodyStyle}>{s.body}</p>}
      {left ? (
        <div className="mt-8 flex items-center justify-center gap-3 md:gap-5">
          {boxes.map((b) => (
            <div key={b.l} className="flex min-w-[72px] flex-col items-center rounded-lg border border-border bg-card p-4" style={st.cardStyle}>
              <span className="text-3xl font-bold tabular-nums md:text-4xl" style={st.headingStyle}>{b.v}</span>
              <span className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{b.l}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Offer has ended</p>
      )}
      {s.ctaLabel && s.ctaLink && (
        <Link to={s.ctaLink} className={`mt-8 inline-flex ${st.btn}`} style={st.btnStyle}>
          {st.btnIcon?.pos === "left" && <SectionIcon def={st.btnIcon} />}
          {s.ctaLabel}
          {st.btnIcon ? (st.btnIcon.pos === "right" ? <SectionIcon def={st.btnIcon} /> : null) : <ArrowRight size={16} />}
        </Link>
      )}
    </section>
  );
}

function StatsBlock({ s }: { s: StatsSection }) {
  const st = useSectionStyles();
  const variant = (s as any).variant ?? "centered";

  if (variant === "badges") {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10">
        {s.heading && <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className="flex flex-wrap justify-center gap-4">
          {s.items.map((it, i) => (
            <div key={i} className={`flex items-center gap-3 border border-border px-5 py-3 ${st.cardRadius}`} style={st.cardStyle}>
              <span className={`${st.hFont} text-2xl font-bold`} style={st.headingStyle}>{it.value}</span>
              <div className="text-left">
                <p className="text-xs font-medium leading-tight">{it.label}</p>
                {it.description && <p className="text-[11px] leading-tight text-muted-foreground">{it.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (variant === "minimal") {
    return (
      <section className="mx-auto max-w-4xl px-6 py-10">
        {s.heading && <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        <div className="flex flex-wrap items-baseline justify-center divide-x divide-border">
          {s.items.map((it, i) => (
            <div key={i} className="px-6 py-2 text-center first:pl-0 last:pr-0">
              <span className={`${st.hFont} text-2xl font-bold`} style={st.headingStyle}>{it.value}</span>
              <span className="ml-2 text-sm text-muted-foreground">{it.label}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // centered (default)
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      {s.heading && <h2 className={`mb-8 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {s.items.map((it, i) => (
          <div key={i} className="text-center">
            <p className={`${st.h1} ${st.hFont} text-3xl md:text-4xl`} style={st.headingStyle}>{it.value}</p>
            <p className="mt-1 text-sm font-medium">{it.label}</p>
            {it.description && <p className="mt-1 text-xs text-muted-foreground">{it.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function TeamBlock({ s }: { s: TeamSection }) {
  const st = useSectionStyles();
  const variant = (s as any).variant ?? "cards";

  if (variant === "minimal") {
    return (
      <section className="mx-auto max-w-3xl px-6 py-10">
        {s.heading && <h2 className={`mb-2 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
        {s.subheading && <p className="mb-8 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
        <div className="divide-y divide-border">
          {s.members.map((m, i) => (
            <div key={i} className="flex items-center gap-4 py-4">
              {m.avatar
                ? <img src={m.avatar} alt={m.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Person size={20} /></div>}
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // cards (default)
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      {s.heading && <h2 className={`mb-2 text-center ${st.h2} ${st.hFont}`} style={st.headingStyle}>{s.heading}</h2>}
      {s.subheading && <p className="mb-8 text-center text-muted-foreground" style={st.bodyStyle}>{s.subheading}</p>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {s.members.map((m, i) => (
          <div key={i} className="text-center">
            {m.avatar
              ? <img src={m.avatar} alt={m.name} className="mx-auto h-28 w-28 rounded-full object-cover" />
              : <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Person size={36} /></div>}
            <p className="mt-4 text-base font-semibold">{m.name}</p>
            <p className="text-sm text-muted-foreground">{m.role}</p>
            {m.bio && <p className="mx-auto mt-2 max-w-xs text-xs text-muted-foreground">{m.bio}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SectionRenderer({ section, vendorId }: { section: Section; vendorId?: string }) {
  const [animRef, animStyle] = useScrollReveal(section.animation);

  const node = (() => {
    switch (section.type) {
      case "announcement": return <Announcement s={section} />;
      case "hero": return <Hero s={section} />;
      case "featured-products": return <FeaturedProducts s={section} />;
      case "image-text": return <ImageText s={section} />;
      case "rich-text": return <RichText s={section} />;
      case "gallery": return <Gallery s={section} />;
      case "collection-list": return <CollectionList s={section} />;
      case "newsletter": return <Newsletter s={section} vendorId={vendorId} />;
      case "cta-banner": return <CtaBanner s={section} />;
      case "text-columns": return <TextColumns s={section} />;
      case "testimonials": return <Testimonials s={section} vendorId={vendorId} />;
      case "logo-bar": return <LogoBar s={section} />;
      case "faq": return <Faq s={section} />;
      case "video": return <Video s={section} />;
      case "spacer": return <Spacer s={section} />;
      case "related-products": return <RelatedProducts s={section} />;
      case "search": return <SearchInline s={section} />;
      case "product-detail": return <ProductDetailSectionView s={section} />;
      case "checkout-form": return <CheckoutFormSectionView s={section} vendorId={vendorId} />;
      case "contact-form": return <ContactFormSectionView s={section} />;
      case "shop-grid": return <ShopGrid s={section} />;
      case "custom-html": return <CustomHtmlBlock s={section} />;
      case "auth-login": return <AuthLogin s={section} vendorId={vendorId} />;
      case "auth-signup": return <AuthSignup s={section} vendorId={vendorId} />;
      case "buyer-orders": return <BuyerOrders s={section} vendorId={vendorId} />;
      case "buyer-referrals": return <BuyerReferrals s={section} vendorId={vendorId} />;
      case "about": return <AboutSectionView s={section} />;
      case "contact": return <ContactSectionView s={section} />;
      case "reviews": return <ReviewsBlock s={section} vendorId={vendorId} />;
      case "lookbook": return <LookbookBlock s={section} />;
      case "timeline": return <TimelineBlock s={section} />;
      case "before-after": return <BeforeAfterBlock s={section} />;
      case "bundle-offer": return <BundleOfferBlock s={section} />;
      case "video-hero": return <VideoHeroBlock s={section} />;
      case "social-feed": return <SocialFeedBlock s={section} />;
      case "map-location": return <MapLocationBlock s={section} />;
      case "size-guide": return <SizeGuideBlock s={section} />;
      case "portfolio": return <PortfolioBlock s={section} />;
      case "whatsapp-cta": return <WhatsAppCtaBlock s={section} />;
      case "trust-badges": return <TrustBadgesBlock s={section} />;
      case "payment-methods": return <PaymentMethodsBlock s={section} />;
      case "columns": return <ColumnsBlock s={section} />;
      case "pricing-plans": return <PricingPlansBlock s={section} />;
      case "countdown": return <CountdownBlock s={section} />;
      case "stats": return <StatsBlock s={section} />;
      case "team": return <TeamBlock s={section} />;
      case "custom": return <CustomSectionView s={section} />;
    }
  })();

  // Build wrapper style
  const style: React.CSSProperties = {};

  // Background: solid color
  if (section.bgColor) style.backgroundColor = section.bgColor;

  // Background: gradient (stacks on top of bgColor, overrides it visually)
  if (section.bgGradient) {
    style.backgroundImage = section.bgGradient;
    style.backgroundSize = "cover";
  }

  // Background: image with optional dark overlay (stacks on gradient if both set)
  if (section.bgImage) {
    const op = (section.bgOpacity ?? 0) / 100;
    const imgLayer = `url(${section.bgImage})`;
    const overlay = op > 0 ? `linear-gradient(rgba(0,0,0,${op}),rgba(0,0,0,${op}))` : null;
    const gradientLayer = section.bgGradient ?? null;
    const layers = [overlay, gradientLayer, imgLayer].filter(Boolean).join(",");
    style.backgroundImage = layers;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }

  // Text color with CSS variable cascade
  if (section.textColor) {
    style.color = section.textColor;
    const hsl = hexToHslChannels(section.textColor);
    const cssVal = hsl ?? section.textColor;
    (style as Record<string, string>)["--foreground"] = cssVal;
    (style as Record<string, string>)["--muted-foreground"] = cssVal;
  }

  // Decorative border dividers
  if (section.borderTop) style.borderTop = `1px solid ${section.borderColor ?? "hsl(var(--border))"}`;
  if (section.borderBottom) style.borderBottom = `1px solid ${section.borderColor ?? "hsl(var(--border))"}`;

  // Corner rounding
  if (section.borderRadius != null && section.borderRadius > 0) {
    style.borderRadius = section.borderRadius >= 9999 ? "9999px" : `${section.borderRadius}px`;
    style.overflow = "hidden";
  }

  // Section opacity
  if (section.sectionOpacity != null && section.sectionOpacity < 100) {
    style.opacity = section.sectionOpacity / 100;
  }

  // Custom padding overrides (take precedence over Tailwind padding preset)
  if (section.paddingTopPx != null) style.paddingTop = `${section.paddingTopPx}px`;
  if (section.paddingBottomPx != null) style.paddingBottom = `${section.paddingBottomPx}px`;
  if (section.paddingXPx != null) { style.paddingLeft = `${section.paddingXPx}px`; style.paddingRight = `${section.paddingXPx}px`; }
  // Independent L/R overrides (win over paddingXPx)
  if (section.paddingLeftPx != null) style.paddingLeft = `${section.paddingLeftPx}px`;
  if (section.paddingRightPx != null) style.paddingRight = `${section.paddingRightPx}px`;

  // Section margins
  if (section.marginTopPx != null) style.marginTop = `${section.marginTopPx}px`;
  if (section.marginBottomPx != null) style.marginBottom = `${section.marginBottomPx}px`;

  // Minimum height
  if (section.minHeight != null && section.minHeight > 0) style.minHeight = `${section.minHeight}px`;

  // Full-viewport height
  if (section.fullViewport) style.minHeight = "100vh";

  // Section-level text alignment
  if (section.textAlign) style.textAlign = section.textAlign as "left" | "center" | "right";

  // Custom CSS escape hatch — merged last so it wins over everything above
  if (section.customCss) Object.assign(style, parseCssText(section.customCss));

  const shadowClass =
    section.shadow === "sm" ? "shadow-sm" :
    section.shadow === "md" ? "shadow-md" :
    section.shadow === "lg" ? "shadow-lg" :
    section.shadow === "xl" ? "shadow-xl" : "";

  const selfPadded = ["announcement", "hero", "newsletter", "cta-banner", "spacer", "product-detail", "checkout-form", "contact-form", "shop-grid", "about", "contact", "custom"];
  const pad = section.padding ?? "md";
  const bg = (section.bgColor || section.bgImage)
    ? ""
    : section.background === "muted"
      ? "bg-secondary"
      : section.background === "primary"
        ? "bg-primary text-primary-foreground"
        : "";

  // Background video — only for non-self-padded sections (self-padded handle their own media)
  const hasBgVideo = !selfPadded.includes(section.type) && !!section.bgVideo;
  const bgVideoEl = hasBgVideo ? (
    <video
      src={section.bgVideo}
      autoPlay
      muted={section.bgVideoMuted !== false}
      loop={section.bgVideoLoop !== false}
      playsInline
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
    />
  ) : null;

  const innerNode = hasBgVideo
    ? <div style={{ position: "relative", zIndex: 1 }}>{node}</div>
    : node;

  const wrapExtra: React.CSSProperties = hasBgVideo
    ? { position: "relative", overflow: "hidden" }
    : {};

  const wrapped = selfPadded.includes(section.type)
    ? <div ref={animRef} className={shadowClass} style={{ ...style, ...wrapExtra, ...animStyle }}>{bgVideoEl}{innerNode}</div>
    : <div ref={animRef} className={`${PADDING_CLASS[pad]} ${bg} ${shadowClass}`} style={{ ...style, ...wrapExtra, ...animStyle }}>{bgVideoEl}{innerNode}</div>;

  return (
    <SectionOverrideCtx.Provider value={{
      headingColor: section.headingColor,
      accentColor: section.accentColor,
      fontSize: section.fontSize,
      headingFont: (section as any).headingFont,
      headingWeight: section.headingWeight,
      headingLetterSpacing: section.headingLetterSpacing,
      bodySize: section.bodySize,
      bodyLineHeight: section.bodyLineHeight,
      elStyles: section.elStyles,
      elCustomCss: section.elCustomCss,
      elIcons: section.elIcons as SectionOverride["elIcons"],
    }}>
      {wrapped}
    </SectionOverrideCtx.Provider>
  );
}
