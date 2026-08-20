import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import hero from "@/assets/hero.jpg";
import { products } from "./products";
import { setActiveVendorId } from "./vendorProducts";

export type LinkTarget = string;
export type Padding = "none" | "sm" | "md" | "lg";
export type Theme = "light" | "dark";

/* ------------- Design Tokens (per-template visual style) ------------- */
export type FontHeading =
  | "serif" | "sans"
  | "playfair" | "lora" | "cormorant" | "cinzel"
  | "poppins" | "raleway" | "josefin" | "oswald" | "montserrat" | "nunito"
  | "bebas" | "barlow" | "righteous" | "lobster"
  | "dancing" | "greatvibes" | "pacifico" | "satisfy" | "sacramento"
  | "abril"
  // legacy aliases kept for backwards-compat
  | "dm-sans";

export type FontBody = "inherit" | "sans" | "poppins" | "dm-sans" | "nunito" | "raleway";
export type FontMeta = { twClass: string; family: string | null; googleId: string | null };

export const HEADING_FONT_META: Record<string, FontMeta> = {
  // System
  serif:      { twClass: "font-serif",         family: null,                                  googleId: null },
  sans:       { twClass: "font-sans font-bold", family: null,                                 googleId: null },
  "dm-sans":  { twClass: "font-sans",          family: "'DM Sans', sans-serif",               googleId: "DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700" },
  // Serifs
  playfair:   { twClass: "font-serif",         family: "'Playfair Display', serif",           googleId: "Playfair+Display:ital,wght@0,400;0,700;1,400" },
  lora:       { twClass: "font-serif",         family: "'Lora', serif",                       googleId: "Lora:ital,wght@0,400;0,700;1,400" },
  cormorant:  { twClass: "font-serif",         family: "'Cormorant Garamond', serif",         googleId: "Cormorant+Garamond:ital,wght@0,400;0,700;1,400" },
  cinzel:     { twClass: "font-serif",         family: "'Cinzel', serif",                     googleId: "Cinzel:wght@400;700;900" },
  // Sans-serifs
  poppins:    { twClass: "font-sans",          family: "'Poppins', sans-serif",               googleId: "Poppins:wght@400;600;700" },
  raleway:    { twClass: "font-sans",          family: "'Raleway', sans-serif",               googleId: "Raleway:wght@300;400;600;700" },
  josefin:    { twClass: "font-sans",          family: "'Josefin Sans', sans-serif",          googleId: "Josefin+Sans:wght@300;400;600;700" },
  oswald:     { twClass: "font-sans",          family: "'Oswald', sans-serif",                googleId: "Oswald:wght@400;600;700" },
  montserrat: { twClass: "font-sans",          family: "'Montserrat', sans-serif",            googleId: "Montserrat:wght@400;600;700" },
  nunito:     { twClass: "font-sans",          family: "'Nunito', sans-serif",                googleId: "Nunito:wght@400;600;700" },
  // Fashion / condensed display
  bebas:      { twClass: "font-sans",          family: "'Bebas Neue', cursive",               googleId: "Bebas+Neue" },
  barlow:     { twClass: "font-sans",          family: "'Barlow Condensed', sans-serif",      googleId: "Barlow+Condensed:wght@400;600;700" },
  righteous:  { twClass: "font-sans",          family: "'Righteous', cursive",                googleId: "Righteous" },
  lobster:    { twClass: "font-sans",          family: "'Lobster', cursive",                  googleId: "Lobster" },
  abril:      { twClass: "font-serif",         family: "'Abril Fatface', cursive",            googleId: "Abril+Fatface" },
  // Scripts / calligraphy
  dancing:    { twClass: "font-sans",          family: "'Dancing Script', cursive",           googleId: "Dancing+Script:wght@400;700" },
  greatvibes: { twClass: "font-sans",          family: "'Great Vibes', cursive",              googleId: "Great+Vibes" },
  satisfy:    { twClass: "font-sans",          family: "'Satisfy', cursive",                  googleId: "Satisfy" },
  sacramento: { twClass: "font-sans",          family: "'Sacramento', cursive",               googleId: "Sacramento" },
  pacifico:   { twClass: "font-sans",          family: "'Pacifico', cursive",                 googleId: "Pacifico" },
};

export const BODY_FONT_META: Record<string, FontMeta> = {
  inherit:   { twClass: "", family: null,                     googleId: null },
  sans:      { twClass: "", family: "system-ui, sans-serif",  googleId: null },
  poppins:   { twClass: "", family: "'Poppins', sans-serif",  googleId: "Poppins:wght@300;400;500" },
  "dm-sans": { twClass: "", family: "'DM Sans', sans-serif",  googleId: "DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500" },
  nunito:    { twClass: "", family: "'Nunito', sans-serif",   googleId: "Nunito:wght@300;400;500;600" },
  raleway:   { twClass: "", family: "'Raleway', sans-serif",  googleId: "Raleway:wght@300;400;600" },
};

export type DesignTokens = {
  fontHeading: FontHeading;
  fontBody?: FontBody;
  cardRadius: "none" | "sm" | "md" | "lg" | "full";
  buttonShape: "pill" | "rounded" | "square";
  productImageRatio: "square" | "portrait";
  headingCase?: "normal" | "uppercase";
};
export const defaultDesignTokens: DesignTokens = {
  fontHeading: "serif",
  cardRadius: "md",
  buttonShape: "pill",
  productImageRatio: "portrait",
};
export type Align9 =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export type CartBtnStyle = "plus" | "cart" | "text" | "plus-text" | "cart-text";
export type SectionAnimation = "none" | "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "zoomIn";

export type SectionBase = {
  id: string;
  /** Scroll-triggered entrance animation for this section */
  animation?: SectionAnimation;
  padding?: Padding;
  background?: "default" | "muted" | "primary";
  bgColor?: string;
  textColor?: string;
  headingColor?: string;
  accentColor?: string;
  fontSize?: "sm" | "md" | "lg" | "xl";
  borderTop?: boolean;
  borderBottom?: boolean;
  borderColor?: string;
  bgImage?: string;
  bgOpacity?: number;
  variant?: string;
  /** Corner rounding in px (0 = sharp, 9999 = full pill) */
  borderRadius?: number;
  /** Box shadow preset */
  shadow?: "sm" | "md" | "lg" | "xl";
  /** Section opacity 10â€“100 (default 100) */
  sectionOpacity?: number;
  /** Custom padding overrides in px â€” override the padding preset */
  paddingTopPx?: number;
  paddingBottomPx?: number;
  paddingXPx?: number;
  /** Whole-section text alignment */
  textAlign?: "left" | "center" | "right";
  /** Heading typography overrides */
  headingWeight?: "300" | "400" | "500" | "600" | "700" | "800" | "900";
  headingLetterSpacing?: "tight" | "normal" | "wide" | "wider";
  /** Body text overrides */
  bodySize?: "xs" | "sm" | "base" | "lg" | "xl";
  bodyLineHeight?: "tight" | "normal" | "relaxed" | "loose";
  /** Independent left/right padding (override paddingXPx per side) */
  paddingLeftPx?: number;
  paddingRightPx?: number;
  /** Section vertical margins â€” space above/below the section */
  marginTopPx?: number;
  marginBottomPx?: number;
  /** Section minimum height in px */
  minHeight?: number;
  /** CSS gradient string, e.g. “linear-gradient(135deg,#667eea,#764ba2)” */
  bgGradient?: string;
  /** Direct MP4/WebM URL rendered as a fullscreen background video (muted autoplay) */
  bgVideo?: string;
  bgVideoMuted?: boolean;
  bgVideoLoop?: boolean;
  /** Section fills 100vh regardless of content */
  fullViewport?: boolean;
  /** Raw CSS escape hatch â€” any valid CSS property:value pairs */
  customCss?: string;
  /** Per-element CSS overrides â€” applied to specific parts inside the section */
  elStyles?: {
    heading?: CSSProperties;
    body?: CSSProperties;
    button?: CSSProperties;
    image?: CSSProperties;
    card?: CSSProperties;
    eyebrow?: CSSProperties;
    subheading?: CSSProperties;
    price?: CSSProperties;
    productCard?: CSSProperties;
    productTitle?: CSSProperties;
  };
  /** Raw CSS escape hatch per element â€” merged after elStyles */
  elCustomCss?: {
    heading?: string;
    body?: string;
    button?: string;
    image?: string;
    card?: string;
    eyebrow?: string;
    subheading?: string;
    price?: string;
    productCard?: string;
    productTitle?: string;
  };
  /** Per-element icon decorations â€” shown on buttons/headings if the section renders them */
  elIcons?: {
    button?: { name: string; pos: "left" | "right"; size?: number };
    heading?: { name: string; pos: "left" | "right"; size?: number };
  };
};

export type AnnouncementSection = SectionBase & { type: "announcement"; text: string; link?: LinkTarget };

/** A single slide used by the hero "carousel" variant */
export type HeroSlide = {
  eyebrow?: string;
  heading?: string;
  body?: string;
  image?: string;
  ctaLabel?: string;
  ctaLink?: LinkTarget;
};

export type HeroSection = SectionBase & {
  type: "hero"; eyebrow?: string; heading: string; body?: string;
  image?: string;
  /** Slides used only when variant === "carousel". If empty the single hero fields are used. */
  slides?: HeroSlide[];
  /** Show prev/next arrows on the carousel hero (default false) */
  showCarouselArrows?: boolean;
  ctaLabel?: string; ctaLink?: LinkTarget; align: Align9; height?: "sm" | "md" | "lg";
  ctaLabel2?: string; ctaLink2?: LinkTarget;
};
/** A single slide in a standalone Carousel section. */
export type CarouselSlide = {
  image?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaLink?: LinkTarget;
};
export type CarouselSection = SectionBase & {
  type: "carousel";
  slides: CarouselSlide[];
  variant?: "banner" | "cards" | "fullwidth" | "thumbnail" | "fade";
  autoplay?: boolean;
  autoplaySeconds?: number;
  showArrows?: boolean;
  showDots?: boolean;
  height?: "sm" | "md" | "lg" | "full";
};
export type CartBtnLayout = "below" | "right";
export type ProductCardVariant = "classic" | "minimal" | "overlay" | "horizontal" | "bordered" | "floating" | "editorial" | "chip";

export type FeaturedProductsSection = SectionBase & {
  type: "featured-products"; heading: string; subheading?: string; productSlugs: string[]; columns: 2 | 3 | 4;
  productLink?: string;
  /** "inventory" = live vendor products; "manual" = template default/demo products */
  sourceMode?: "manual" | "inventory";
  cardVariant?: ProductCardVariant;
  cartBtnStyle?: CartBtnStyle;
  cartBtnBg?: string;
  cartBtnColor?: string;
  cartBtnLabel?: string;
  cartBtnLayout?: CartBtnLayout;
};
export type ImageTextSection = SectionBase & {
  type: "image-text"; heading: string; body: string; image: string;
  imageSide: "left" | "right"; ctaLabel?: string; ctaLink?: LinkTarget;
};
export type RichTextSection = SectionBase & { type: "rich-text"; heading?: string; body: string; align: "left" | "center" | "right" };
export type GallerySection = SectionBase & {
  type: "gallery"; heading?: string; images: string[]; columns?: 2 | 3 | 4;
  variant?: "grid" | "masonry" | "featured" | "minimal";
};
export type CollectionListSection = SectionBase & {
  type: "collection-list"; heading: string; items: { label: string; image: string; link: LinkTarget }[];
};
export type NewsletterSection = SectionBase & {
  type: "newsletter"; heading: string; body?: string; buttonLabel: string;
  webhookUrl?: string;
  successMessage?: string;
};
export type CtaBannerSection = SectionBase & {
  type: "cta-banner"; heading: string; body?: string; ctaLabel: string; ctaLink: LinkTarget; image?: string;
};
export type TextColumnsSection = SectionBase & {
  type: "text-columns"; heading?: string;
  columns: { icon?: string; title: string; body: string }[];
};
export type TestimonialsSection = SectionBase & {
  type: "testimonials"; heading?: string;
  useLiveReviews?: boolean;
  items: { quote: string; author: string; role?: string; avatar?: string }[];
};
export type LogoBarSection = SectionBase & { type: "logo-bar"; heading?: string; logos: { src: string; alt: string }[] };
export type FaqSection = SectionBase & { type: "faq"; heading: string; items: { question: string; answer: string }[] };
export type VideoSection = SectionBase & { type: "video"; heading?: string; url: string };
export type SpacerSection = SectionBase & { type: "spacer"; size: "sm" | "md" | "lg" | "xl" };
export type RelatedProductsSection = SectionBase & {
  type: "related-products"; heading: string; sourceSlug: string; limit: number;
};
export type SearchSection = SectionBase & {
  type: "search"; heading?: string; placeholder?: string; showFilters: boolean;
};
export type ProductDetailSection = SectionBase & {
  type: "product-detail";
  productSlug: string;
  extraImages: string[];
};
export type CheckoutFormSection = SectionBase & {
  type: "checkout-form";
  heading?: string;
};
export type ContactFormSection = SectionBase & {
  type: "contact-form";
  heading?: string;
  subheading?: string;
};
export type ShopGridSection = SectionBase & {
  type: "shop-grid";
  heading?: string;
  showFilters?: boolean;
  filterStyle?: "pills" | "sidebar" | "dropdown";
  columns?: 2 | 3 | 4;
  pageSize?: number;
  cardVariant?: ProductCardVariant;
  cartBtnStyle?: CartBtnStyle;
  cartBtnBg?: string;
  cartBtnColor?: string;
  cartBtnLabel?: string;
  cartBtnLayout?: CartBtnLayout;
};
export type CustomHtmlSection = SectionBase & {
  type: "custom-html";
  html: string;
  label?: string;
};
export type AboutSection = SectionBase & {
  type: "about";
  heading?: string;
  subheading?: string;
  body?: string;
  image?: string;
  image2?: string;
  ctaLabel?: string;
  ctaLink?: LinkTarget;
  team?: { name: string; role: string; image?: string }[];
};
export type ContactSection = SectionBase & {
  type: "contact";
  heading?: string;
  subheading?: string;
  email?: string;
  phone?: string;
  address?: string;
  hours?: string;
  showForm?: boolean;
  mapEmbedUrl?: string;
};

export type AuthLoginSection = SectionBase & {
  type: "auth-login";
  heading?: string;
  subheading?: string;
  image?: string;
  imageSide?: "left" | "right" | "background";
  signupLink?: string;
};
export type AuthSignupSection = SectionBase & {
  type: "auth-signup";
  heading?: string;
  subheading?: string;
  image?: string;
  imageSide?: "left" | "right" | "background";
  loginLink?: string;
};
export type BuyerOrdersSection = SectionBase & {
  type: "buyer-orders";
  heading?: string;
  subheading?: string;
};
export type BuyerReferralsSection = SectionBase & {
  type: "buyer-referrals";
  heading?: string;
  subheading?: string;
  rewardLabel?: string;
};

/* ------------- Custom Section Block System ------------- */

export type BlockAction =
  | { type: "navigate"; href: string }
  | { type: "open-cart" }
  | { type: "open-search" }
  | { type: "scroll-top" }
  | { type: "whatsapp"; number: string; message?: string }
  | { type: "none" };

export type BlockAnimation = "none" | "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "zoomIn" | "bounce" | "pulse";

export type BlockStyles = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  letterSpacing?: string;
  lineHeight?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  fontStyle?: "normal" | "italic";
  padding?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  margin?: string;
  marginTop?: string;
  marginBottom?: string;
  width?: string;
  maxWidth?: string;
  height?: string;
  borderRadius?: string;
  border?: string;
  opacity?: number;
  objectFit?: "cover" | "contain" | "fill";
  alignSelf?: "flex-start" | "center" | "flex-end" | "stretch";
  cursor?: string;
  boxShadow?: string;
  gap?: string;
};

export type TextBlock = {
  id: string;
  type: "text";
  tag: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "label";
  content: string;
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type ButtonBlock = {
  id: string;
  type: "button";
  label: string;
  action?: BlockAction;
  iconName?: string;
  iconPos?: "left" | "right";
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type IconBlock = {
  id: string;
  type: "icon";
  name: string;
  size?: number;
  color?: string;
  action?: BlockAction;
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type ImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt?: string;
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type SpacerBlock = {
  id: string;
  type: "spacer";
  height: number;
};

export type DividerBlock = {
  id: string;
  type: "divider";
  color?: string;
  thickness?: number;
  marginY?: number;
  lineStyle?: "solid" | "dashed" | "dotted";
};

export type FormField = {
  id: string;
  label: string;
  placeholder?: string;
  fieldType: "text" | "email" | "phone" | "textarea" | "select" | "checkbox" | "file";
  required?: boolean;
  options?: string[];
};

export type FormBlock = {
  id: string;
  type: "form";
  fields: FormField[];
  submitLabel?: string;
  submitAction?: { type: "email"; to: string } | { type: "webhook"; url: string } | { type: "whatsapp"; number: string };
  successMessage?: string;
  styles?: BlockStyles;
};

export type RowBlock = {
  id: string;
  type: "row";
  cols: Block[][];
  colCount: 2 | 3 | 4;
  gap?: "none" | "sm" | "md" | "lg";
  verticalAlign?: "top" | "center" | "bottom";
  stackOnMobile?: boolean;
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type VideoBlock = {
  id: string;
  type: "video";
  url: string;
  caption?: string;
  ratio?: "16:9" | "9:16" | "4:3" | "1:1";
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type AccordionItem = { id: string; title: string; body: string };

export type AccordionBlock = {
  id: string;
  type: "accordion";
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string;
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type CountdownBlock = {
  id: string;
  type: "countdown";
  targetDate: string;
  label?: string;
  expiredText?: string;
  showLabels?: boolean;
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type SlideshowSlide = { src: string; alt?: string; caption?: string; link?: string };

export type SlideshowBlock = {
  id: string;
  type: "slideshow";
  slides: SlideshowSlide[];
  autoplay?: boolean;
  autoplayDelay?: number;
  showDots?: boolean;
  showArrows?: boolean;
  ratio?: "16:9" | "4:3" | "1:1" | "3:2";
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type ProductEmbedBlock = {
  id: string;
  type: "product-embed";
  productSlug: string;
  showDescription?: boolean;
  variant?: ProductCardVariant;
  animation?: BlockAnimation;
  styles?: BlockStyles;
};

export type BadgeBlock = {
  id: string;
  type: "badge";
  text: string;
  color?: string;
  bgColor?: string;
  size?: "sm" | "md" | "lg";
  styles?: BlockStyles;
  animation?: BlockAnimation;
};

export type ListBlock = {
  id: string;
  type: "list";
  items: string[];
  ordered?: boolean;
  iconName?: string;
  styles?: BlockStyles;
  animation?: BlockAnimation;
};

export type CardBlock = {
  id: string;
  type: "card";
  title?: string;
  body?: string;
  image?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaAction?: BlockAction;
  bordered?: boolean;
  shadow?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg";
  imageHeight?: number;
  styles?: BlockStyles;
  animation?: BlockAnimation;
};

export type GroupBlock = {
  id: string;
  type: "group";
  label?: string;
  children: Block[];
  direction?: "column" | "row" | "row-wrap";
  gap?: "none" | "sm" | "md" | "lg";
  align?: "start" | "center" | "end" | "stretch";
  styles?: BlockStyles;
  animation?: BlockAnimation;
};

export type LayoutBoxBlock = {
  id: string;
  type: "layout-box";
  label?: string;
  children: Block[];
  /** "flex" uses flexbox (same as group), "grid" uses CSS grid */
  layout: "flex" | "grid";
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: "none" | "sm" | "md" | "lg";
  align?: "start" | "center" | "end" | "stretch";
  direction?: "column" | "row" | "row-wrap";
  /** Each column's min/max width for grid — e.g. "1fr" or "minmax(200px,1fr)" */
  colTemplate?: string;
  styles?: BlockStyles;
  animation?: BlockAnimation;
};

export type Block =
  | TextBlock
  | ButtonBlock
  | IconBlock
  | ImageBlock
  | SpacerBlock
  | DividerBlock
  | FormBlock
  | RowBlock
  | VideoBlock
  | AccordionBlock
  | CountdownBlock
  | SlideshowBlock
  | ProductEmbedBlock
  | BadgeBlock
  | ListBlock
  | CardBlock
  | GroupBlock
  | LayoutBoxBlock;

export type CustomSection = SectionBase & {
  type: "custom";
  label?: string;
  blocks: Block[];
  gap?: "none" | "sm" | "md" | "lg";
  align?: "start" | "center" | "end" | "stretch";
};

export type BlockType = Block["type"];

export function createDefaultBlock(type: BlockType): Block {
  const id = Math.random().toString(36).slice(2, 10);
  switch (type) {
    case "text":      return { id, type, tag: "p", content: "Your text here" };
    case "button":    return { id, type, label: "Click me", action: { type: "none" } };
    case "icon":      return { id, type, name: "star", size: 32 };
    case "image":     return { id, type, src: "", alt: "", styles: { width: "100%", borderRadius: "8px" } };
    case "spacer":    return { id, type, height: 32 };
    case "divider":   return { id, type, color: "currentColor", thickness: 1, marginY: 8 };
    case "form":      return { id, type, fields: [{ id: Math.random().toString(36).slice(2, 10), label: "Name", fieldType: "text", required: true }], submitLabel: "Submit" };
    case "row":       return { id, type, cols: [[], []], colCount: 2, gap: "md", stackOnMobile: true };
    case "video":     return { id, type, url: "", ratio: "16:9", controls: true };
    case "accordion":     return { id, type, items: [{ id: Math.random().toString(36).slice(2, 10), title: "Question?", body: "Answer goes here." }] };
    case "countdown":     return { id, type, targetDate: new Date(Date.now() + 7 * 86400000).toISOString(), label: "Sale ends in", showLabels: true };
    case "slideshow":     return { id, type, slides: [{ src: "", alt: "Slide 1" }], autoplay: true, autoplayDelay: 3000, showDots: true, showArrows: true, ratio: "16:9" };
    case "product-embed": return { id, type, productSlug: "", variant: "classic", showDescription: false };
    case "badge": return { id, type, text: "New", bgColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", size: "md" };
    case "list": return { id, type, items: ["First item", "Second item", "Third item"], ordered: false };
    case "card": return { id, type, title: "Card Title", body: "Add a description here.", bordered: true, shadow: "sm", radius: "md" };
    case "group": return { id, type, label: "Group", children: [], direction: "column", gap: "md", align: "start" };
    case "layout-box": return { id, type, label: "Layout Box", children: [], layout: "grid", columns: 2, gap: "md", align: "start" };
  }
}

// ── Section Presets ────────────────────────────────────────────────────────────
// Pre-made block layouts for the custom section block palette.
// Each preset returns fresh IDs on every call so they can be added multiple times.

const bid = () => Math.random().toString(36).slice(2, 10);

export type SectionPreset = {
  key: string;
  label: string;
  description: string;
  icon: string;
  create: () => Block[];
};

export const SECTION_PRESETS: SectionPreset[] = [
  {
    key: "hero-cta",
    label: "Hero with CTA",
    description: "Big heading, tagline, and a call-to-action button",
    icon: "home",
    create: () => [
      { id: bid(), type: "text", tag: "h1", content: "Your headline here", styles: { fontSize: "2.8rem", fontWeight: "700", textAlign: "center", lineHeight: "1.1" } },
      { id: bid(), type: "text", tag: "p", content: "Add a short description to support your headline.", styles: { textAlign: "center", color: "hsl(var(--muted-foreground))", maxWidth: "480px", alignSelf: "center" } },
      { id: bid(), type: "button", label: "Shop now", action: { type: "navigate", href: "/shop" } },
    ],
  },
  {
    key: "feature-columns",
    label: "3 Feature columns",
    description: "Three columns each with an icon, heading, and short text",
    icon: "columns",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Why choose us", styles: { fontSize: "1.8rem", fontWeight: "700", textAlign: "center" } },
      {
        id: bid(), type: "row", colCount: 3, gap: "lg", stackOnMobile: true,
        cols: [
          [
            { id: bid(), type: "icon", name: "star", size: 32, color: "hsl(var(--primary))" },
            { id: bid(), type: "text", tag: "h4", content: "Quality products", styles: { fontWeight: "600" } },
            { id: bid(), type: "text", tag: "p", content: "We source only the best materials.", styles: { color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" } },
          ],
          [
            { id: bid(), type: "icon", name: "truck", size: 32, color: "hsl(var(--primary))" },
            { id: bid(), type: "text", tag: "h4", content: "Fast delivery", styles: { fontWeight: "600" } },
            { id: bid(), type: "text", tag: "p", content: "Orders delivered within 2–5 business days.", styles: { color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" } },
          ],
          [
            { id: bid(), type: "icon", name: "shield", size: 32, color: "hsl(var(--primary))" },
            { id: bid(), type: "text", tag: "h4", content: "Secure payment", styles: { fontWeight: "600" } },
            { id: bid(), type: "text", tag: "p", content: "Your payment details are always protected.", styles: { color: "hsl(var(--muted-foreground))", fontSize: "0.9rem" } },
          ],
        ],
      },
    ],
  },
  {
    key: "testimonial",
    label: "Testimonial",
    description: "Customer quote with name and star rating",
    icon: "chat",
    create: () => [
      { id: bid(), type: "icon", name: "star-fill", size: 20, color: "#f59e0b", styles: { alignSelf: "center" } },
      { id: bid(), type: "text", tag: "p", content: '"This is the best store I have ever shopped from. The quality is outstanding and delivery was super fast!"', styles: { textAlign: "center", fontSize: "1.1rem", fontStyle: "italic", maxWidth: "560px", alignSelf: "center" } },
      { id: bid(), type: "text", tag: "p", content: "— Amaka O., Lagos", styles: { textAlign: "center", fontWeight: "600", color: "hsl(var(--muted-foreground))" } },
    ],
  },
  {
    key: "image-text",
    label: "Image + Text",
    description: "Two-column layout with an image on the left and text on the right",
    icon: "layout",
    create: () => [
      {
        id: bid(), type: "row", colCount: 2, gap: "lg", stackOnMobile: true, verticalAlign: "center",
        cols: [
          [{ id: bid(), type: "image", src: "", alt: "Feature image", styles: { width: "100%", borderRadius: "12px", objectFit: "cover" } }],
          [
            { id: bid(), type: "text", tag: "h2", content: "Your story starts here", styles: { fontSize: "1.8rem", fontWeight: "700" } },
            { id: bid(), type: "text", tag: "p", content: "Tell your brand story, explain a product, or highlight a collection.", styles: { color: "hsl(var(--muted-foreground))", lineHeight: "1.7" } },
            { id: bid(), type: "button", label: "Learn more", action: { type: "navigate", href: "/about" } },
          ],
        ],
      },
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    description: "Accordion with frequently asked questions",
    icon: "question",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Frequently asked questions", styles: { fontSize: "1.8rem", fontWeight: "700", textAlign: "center" } },
      {
        id: bid(), type: "accordion", allowMultiple: false,
        items: [
          { id: bid(), title: "What is your delivery time?", body: "We deliver within 2–5 business days across Nigeria." },
          { id: bid(), title: "Do you offer returns?", body: "Yes, we accept returns within 7 days of delivery on undamaged items." },
          { id: bid(), title: "How do I contact support?", body: "Send us a WhatsApp message or email and we will respond within 24 hours." },
        ],
      },
    ],
  },
  {
    key: "contact-form",
    label: "Contact form",
    description: "Heading and a contact form with name, email, and message",
    icon: "email",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Get in touch", styles: { fontSize: "1.8rem", fontWeight: "700", textAlign: "center" } },
      { id: bid(), type: "text", tag: "p", content: "We would love to hear from you. Fill in the form below.", styles: { textAlign: "center", color: "hsl(var(--muted-foreground))" } },
      {
        id: bid(), type: "form", submitLabel: "Send message",
        fields: [
          { id: bid(), label: "Full name", fieldType: "text", required: true },
          { id: bid(), label: "Email address", fieldType: "email", required: true },
          { id: bid(), label: "Message", fieldType: "textarea", required: true },
        ],
      },
    ],
  },
  {
    key: "sale-countdown",
    label: "Sale countdown",
    description: "Live countdown timer with a heading and shop button",
    icon: "fire",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "🔥 Flash sale ending soon", styles: { fontSize: "1.8rem", fontWeight: "700", textAlign: "center" } },
      { id: bid(), type: "text", tag: "p", content: "Up to 50% off — grab yours before time runs out!", styles: { textAlign: "center", color: "hsl(var(--muted-foreground))" } },
      { id: bid(), type: "countdown", targetDate: new Date(Date.now() + 2 * 86400000).toISOString(), label: "Sale ends in", showLabels: true, styles: { alignSelf: "center" } },
      { id: bid(), type: "button", label: "Shop the sale", action: { type: "navigate", href: "/shop" } },
    ],
  },
  {
    key: "social-links",
    label: "Social links",
    description: "Row of social media icon buttons",
    icon: "share",
    create: () => [
      { id: bid(), type: "text", tag: "h3", content: "Follow us", styles: { textAlign: "center", fontWeight: "600" } },
      {
        id: bid(), type: "row", colCount: 4, gap: "md", stackOnMobile: false,
        cols: [
          [{ id: bid(), type: "icon", name: "instagram", size: 28, action: { type: "navigate", href: "https://instagram.com" }, styles: { alignSelf: "center", cursor: "pointer" } }],
          [{ id: bid(), type: "icon", name: "facebook", size: 28, action: { type: "navigate", href: "https://facebook.com" }, styles: { alignSelf: "center", cursor: "pointer" } }],
          [{ id: bid(), type: "icon", name: "twitter", size: 28, action: { type: "navigate", href: "https://twitter.com" }, styles: { alignSelf: "center", cursor: "pointer" } }],
          [{ id: bid(), type: "icon", name: "whatsapp", size: 28, action: { type: "whatsapp", number: "+2348000000000" }, styles: { alignSelf: "center", cursor: "pointer", color: "#25D366" } }],
        ],
      },
    ],
  },
  {
    key: "announcement",
    label: "Announcement bar",
    description: "Full-width promotional text banner",
    icon: "bell",
    create: () => [
      { id: bid(), type: "text", tag: "p", content: "🎉 Free delivery on orders over ₦15,000 — Use code FREESHIP", styles: { textAlign: "center", fontWeight: "600", padding: "12px 24px", backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "8px", width: "100%" } },
    ],
  },
  {
    key: "pricing-card",
    label: "Pricing card",
    description: "Single pricing plan with features list and CTA",
    icon: "credit-card",
    create: () => [
      { id: bid(), type: "badge", text: "Most popular", bgColor: "hsl(var(--accent))", color: "hsl(var(--accent-foreground))", size: "sm", styles: { alignSelf: "center" } },
      { id: bid(), type: "text", tag: "h2", content: "Basic Plan", styles: { textAlign: "center", fontWeight: "700", fontSize: "1.6rem" } },
      { id: bid(), type: "text", tag: "p", content: "₦4,999 / month", styles: { textAlign: "center", fontSize: "2rem", fontWeight: "800", color: "hsl(var(--primary))" } },
      { id: bid(), type: "list", items: ["Unlimited products", "Custom storefront", "WhatsApp checkout", "Analytics dashboard", "Priority support"], styles: { alignSelf: "center", maxWidth: "320px" } },
      { id: bid(), type: "button", label: "Get started", action: { type: "navigate", href: "/shop" }, styles: { alignSelf: "center" } },
    ] as Block[],
  },
  {
    key: "stats-row",
    label: "Stats / numbers",
    description: "Three key metrics side by side",
    icon: "graph",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Our impact in numbers", styles: { fontSize: "1.8rem", fontWeight: "700", textAlign: "center" } },
      {
        id: bid(), type: "row", colCount: 3, gap: "lg", stackOnMobile: true,
        cols: [
          [
            { id: bid(), type: "text", tag: "h2", content: "5,000+", styles: { fontSize: "3rem", fontWeight: "800", textAlign: "center", color: "hsl(var(--primary))" } },
            { id: bid(), type: "text", tag: "p", content: "Happy customers", styles: { textAlign: "center", color: "hsl(var(--muted-foreground))", fontWeight: "500" } },
          ],
          [
            { id: bid(), type: "text", tag: "h2", content: "98%", styles: { fontSize: "3rem", fontWeight: "800", textAlign: "center", color: "hsl(var(--primary))" } },
            { id: bid(), type: "text", tag: "p", content: "Satisfaction rate", styles: { textAlign: "center", color: "hsl(var(--muted-foreground))", fontWeight: "500" } },
          ],
          [
            { id: bid(), type: "text", tag: "h2", content: "48h", styles: { fontSize: "3rem", fontWeight: "800", textAlign: "center", color: "hsl(var(--primary))" } },
            { id: bid(), type: "text", tag: "p", content: "Average delivery", styles: { textAlign: "center", color: "hsl(var(--muted-foreground))", fontWeight: "500" } },
          ],
        ],
      },
    ],
  },
  {
    key: "team-member",
    label: "Team member",
    description: "Profile card with photo, name, and role",
    icon: "person",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Meet the team", styles: { fontSize: "1.8rem", fontWeight: "700", textAlign: "center" } },
      {
        id: bid(), type: "row", colCount: 3, gap: "lg", stackOnMobile: true,
        cols: [
          [
            { id: bid(), type: "image", src: "", alt: "Team member", styles: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", alignSelf: "center" } },
            { id: bid(), type: "text", tag: "h4", content: "Aisha Okafor", styles: { fontWeight: "700", textAlign: "center" } },
            { id: bid(), type: "badge", text: "Founder & CEO", size: "sm", styles: { alignSelf: "center" } },
          ],
          [
            { id: bid(), type: "image", src: "", alt: "Team member", styles: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", alignSelf: "center" } },
            { id: bid(), type: "text", tag: "h4", content: "Emeka Eze", styles: { fontWeight: "700", textAlign: "center" } },
            { id: bid(), type: "badge", text: "Head of Design", size: "sm", styles: { alignSelf: "center" } },
          ],
          [
            { id: bid(), type: "image", src: "", alt: "Team member", styles: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", alignSelf: "center" } },
            { id: bid(), type: "text", tag: "h4", content: "Fatima Bello", styles: { fontWeight: "700", textAlign: "center" } },
            { id: bid(), type: "badge", text: "Operations Lead", size: "sm", styles: { alignSelf: "center" } },
          ],
        ],
      },
    ] as Block[],
  },
  {
    key: "newsletter-strip",
    label: "Newsletter strip",
    description: "Email capture with heading and subscribe button",
    icon: "envelope",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Join our community", styles: { textAlign: "center", fontWeight: "700", fontSize: "1.6rem" } },
      { id: bid(), type: "text", tag: "p", content: "Get exclusive deals, early access to new products, and insider tips.", styles: { textAlign: "center", color: "hsl(var(--muted-foreground))" } },
      {
        id: bid(), type: "form", submitLabel: "Subscribe",
        fields: [{ id: bid(), label: "Email address", fieldType: "email", required: true, placeholder: "you@example.com" }],
        styles: { maxWidth: "440px", alignSelf: "center", width: "100%" },
      },
    ] as Block[],
  },
  {
    key: "image-gallery",
    label: "Image gallery",
    description: "Three-column photo grid",
    icon: "image",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Our gallery", styles: { fontSize: "1.8rem", fontWeight: "700", textAlign: "center" } },
      {
        id: bid(), type: "row", colCount: 3, gap: "sm", stackOnMobile: true,
        cols: [
          [{ id: bid(), type: "image", src: "", alt: "Gallery image 1", styles: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "8px" } }],
          [{ id: bid(), type: "image", src: "", alt: "Gallery image 2", styles: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "8px" } }],
          [{ id: bid(), type: "image", src: "", alt: "Gallery image 3", styles: { width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "8px" } }],
        ],
      },
    ],
  },
  {
    key: "two-cta",
    label: "Two-button CTA",
    description: "Strong heading with two side-by-side action buttons",
    icon: "lightning",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Ready to get started?", styles: { fontSize: "2rem", fontWeight: "800", textAlign: "center" } },
      { id: bid(), type: "text", tag: "p", content: "Join thousands of happy customers shopping with us today.", styles: { textAlign: "center", color: "hsl(var(--muted-foreground))" } },
      {
        id: bid(), type: "row", colCount: 2, gap: "md", stackOnMobile: true,
        cols: [
          [{ id: bid(), type: "button", label: "Shop now", action: { type: "navigate", href: "/shop" }, styles: { width: "100%", justifyContent: "center", backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } }],
          [{ id: bid(), type: "button", label: "Learn more", action: { type: "navigate", href: "/about" }, styles: { width: "100%", justifyContent: "center", backgroundColor: "transparent", border: "2px solid hsl(var(--primary))", color: "hsl(var(--primary))" } }],
        ],
      },
    ],
  },
  {
    key: "benefits-list",
    label: "Benefits list",
    description: "Heading with an icon-decorated bullet list",
    icon: "check",
    create: () => [
      { id: bid(), type: "text", tag: "h2", content: "Everything you need", styles: { fontSize: "1.8rem", fontWeight: "700" } },
      { id: bid(), type: "text", tag: "p", content: "We have built the most complete solution for Nigerian merchants.", styles: { color: "hsl(var(--muted-foreground))", lineHeight: "1.7" } },
      { id: bid(), type: "list", items: ["Zero setup fees — start selling today", "Accept payments via bank transfer, card & USSD", "Real-time inventory management", "Automated WhatsApp order notifications", "Powerful analytics dashboard"] },
      { id: bid(), type: "button", label: "Create your store", action: { type: "navigate", href: "/shop" } },
    ] as Block[],
  },
];

/* ------------------------------------------------------- */

export type ReviewsSection = SectionBase & {
  type: "reviews";
  heading?: string;
  subheading?: string;
  useRealReviews?: boolean;
  minRating?: number;
  maxItems?: number;
  testimonials?: Array<{ name: string; rating: number; text: string; productName?: string; date?: string; avatar?: string }>;
};

export type LookbookSection = SectionBase & {
  type: "lookbook";
  heading?: string;
  subheading?: string;
  items: Array<{ image: string; title?: string; description?: string; link?: string; tags?: string[] }>;
};

export type TimelineSection = SectionBase & {
  type: "timeline";
  heading?: string;
  subheading?: string;
  milestones: Array<{ year: string; title: string; description?: string; image?: string }>;
};

export type BeforeAfterSection = SectionBase & {
  type: "before-after";
  heading?: string;
  subheading?: string;
  pairs: Array<{ beforeImage: string; afterImage: string; label?: string; description?: string }>;
};

export type BundleOfferSection = SectionBase & {
  type: "bundle-offer";
  heading?: string;
  subheading?: string;
  bundleLabel?: string;
  ctaLabel?: string;
  ctaLink?: string;
  productSlugs: string[];
  bundlePrice?: string;
  originalPrice?: string;
  savingsLabel?: string;
};

export type VideoHeroSection = SectionBase & {
  type: "video-hero";
  heading?: string;
  subheading?: string;
  videoUrl?: string;
  posterImage?: string;
  ctaLabel?: string;
  ctaLink?: LinkTarget;
  overlayOpacity?: number;
  height?: "sm" | "md" | "lg" | "full";
  align?: "left" | "center" | "right";
};

export type SocialFeedSection = SectionBase & {
  type: "social-feed";
  heading?: string;
  handle?: string;
  posts?: Array<{ imageUri: string; caption?: string; link?: string }>;
  columns?: 2 | 3 | 4 | 5 | 6;
  showHandle?: boolean;
};

export type MapLocationSection = SectionBase & {
  type: "map-location";
  heading?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  mapEmbedUrl?: string;
  latitude?: number;
  longitude?: number;
  ctaLabel?: string;
  ctaLink?: LinkTarget;
};

export type SizeGuideSection = SectionBase & {
  type: "size-guide";
  heading?: string;
  subheading?: string;
  unit?: "cm" | "inches";
  categories?: string[];
  rows: Array<{ size: string; [key: string]: string }>;
  columns: string[];
  note?: string;
};

export type PortfolioSection = SectionBase & {
  type: "portfolio";
  heading?: string;
  subheading?: string;
  columns?: 2 | 3 | 4;
  items: Array<{
    title: string;
    category?: string;
    image?: string;
    description?: string;
    link?: string;
    tags?: string[];
  }>;
};

export type WhatsAppCtaSection = SectionBase & {
  type: "whatsapp-cta";
  heading?: string;
  subheading?: string;
  phone?: string;
  buttonLabel?: string;
  prefilledMessage?: string;
};

export type TrustBadgesSection = SectionBase & {
  type: "trust-badges";
  heading?: string;
  badges?: Array<{ icon: string; label: string; description?: string }>;
};

export type PaymentMethodsSection = SectionBase & {
  type: "payment-methods";
  heading?: string;
  methods?: Array<{ id: string; label: string; enabled: boolean }>;
};

export type ColumnItem = {
  heading?: string;
  body?: string;
  imageUri?: string;
  iconName?: string;
  iconBg?: string;
  ctaLabel?: string;
  ctaHref?: string;
};
export type ColumnsSection = SectionBase & {
  type: "columns";
  heading?: string;
  subheading?: string;
  count: 2 | 3 | 4;
  items: ColumnItem[];
  gap?: "sm" | "md" | "lg";
  verticalAlign?: "top" | "center" | "bottom";
  imgAspectRatio?: number;
  stackOnMobile?: boolean;
};

export type PricingPlan = {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  ctaLabel: string;
  ctaLink: string;
  paystackLink?: string;
  highlighted?: boolean;
};
export type PricingPlansSection = SectionBase & {
  type: "pricing-plans";
  heading?: string;
  subheading?: string;
  plans: PricingPlan[];
};

export type CountdownSection = SectionBase & {
  type: "countdown";
  heading?: string;
  body?: string;
  targetDate: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type StatsSection = SectionBase & {
  type: "stats";
  heading?: string;
  items: Array<{ value: string; label: string; description?: string }>;
};

export type TeamSection = SectionBase & {
  type: "team";
  heading?: string;
  subheading?: string;
  members: Array<{ name: string; role: string; bio?: string; avatar?: string }>;
};

export type Section =
  | AnnouncementSection | HeroSection | CarouselSection | FeaturedProductsSection | ImageTextSection | RichTextSection
  | GallerySection | CollectionListSection | NewsletterSection | CtaBannerSection | TextColumnsSection
  | TestimonialsSection | LogoBarSection | FaqSection | VideoSection | SpacerSection
  | RelatedProductsSection | SearchSection | ProductDetailSection | CheckoutFormSection | ContactFormSection
  | ShopGridSection | CustomHtmlSection | AboutSection | ContactSection
  | AuthLoginSection | AuthSignupSection | BuyerOrdersSection | BuyerReferralsSection
  | ReviewsSection | LookbookSection | TimelineSection | BeforeAfterSection | BundleOfferSection
  | VideoHeroSection | SocialFeedSection | MapLocationSection | SizeGuideSection | PortfolioSection
  | WhatsAppCtaSection | TrustBadgesSection | PaymentMethodsSection
  | ColumnsSection | PricingPlansSection | CountdownSection | StatsSection | TeamSection
  | CustomSection;

export type SectionType = Section["type"];

export const SECTION_LABELS: Record<SectionType, string> = {
  announcement: "Announcement bar",
  hero: "Hero banner",
  carousel: "Carousel",
  "featured-products": "Featured products",
  "image-text": "Image with text",
  "rich-text": "Rich text",
  gallery: "Gallery",
  "collection-list": "Collection list",
  newsletter: "Newsletter",
  "cta-banner": "CTA banner",
  "text-columns": "Text columns / Features",
  testimonials: "Testimonials",
  "logo-bar": "Logo bar",
  faq: "FAQ",
  video: "Video",
  spacer: "Spacer",
  "related-products": "Related products",
  search: "Search with filters",
  "product-detail": "Product detail (with gallery & cart)",
  "checkout-form": "Checkout form",
  "contact-form": "Contact form",
  "shop-grid": "Shop grid (products + filters)",
  "custom-html": "Custom HTML / Embed",
  "auth-login": "Login page",
  "auth-signup": "Sign up page",
  "buyer-orders": "My orders (buyer dashboard)",
  "buyer-referrals": "Refer & Earn (buyer dashboard)",
  about: "About us",
  contact: "Contact info",
  reviews: "Customer reviews",
  lookbook: "Lookbook",
  timeline: "Brand timeline",
  "before-after": "Before & After",
  "bundle-offer": "Bundle offer",
  "video-hero": "Video hero",
  "social-feed": "Social feed",
  "map-location": "Map & location",
  "size-guide": "Size guide",
  portfolio: "Portfolio",
  "whatsapp-cta": "WhatsApp chat",
  "trust-badges": "Trust badges",
  "payment-methods": "Payment methods",
  columns: "Free-layout columns",
  "pricing-plans": "Pricing plans",
  countdown: "Countdown timer",
  stats: "Stats / Social proof",
  team: "Team members",
  custom: "Section Studio",
};

/** Variant options per section type. Empty means single variant. */
export const SECTION_VARIANTS: Partial<Record<SectionType, string[]>> = {
  hero: ["overlay", "split", "split-right", "split-left", "stacked", "text-only", "fullscreen", "boxed-right", "boxed-left", "minimal", "centered", "editorial", "magazine", "immersive", "glass", "diagonal", "duo", "bold", "reveal", "carousel"],
  "featured-products": ["grid", "list", "carousel"],
  testimonials: ["cards", "quotes", "grid"],
  "cta-banner": ["centered", "split"],
  "image-text": ["side-by-side", "stacked"],
  "product-detail": ["classic", "editorial", "gallery-left", "minimal"],
  gallery: ["grid", "masonry", "featured", "minimal"],
  "shop-grid": ["grid", "list", "compact", "editorial", "masonry"],
  about: ["story", "split", "team", "magazine"],
  contact: ["simple", "split", "cards", "full"],
  reviews: ["grid", "list", "carousel"],
  lookbook: ["grid", "masonry"],
  "video-hero": ["overlay", "split", "minimal"],
  "social-feed": ["grid", "masonry", "row"],
  "map-location": ["split", "stacked", "minimal"],
  "size-guide": ["table", "cards", "minimal"],
  portfolio: ["grid", "masonry", "list"],
  "whatsapp-cta": ["card", "banner", "minimal"],
  "trust-badges": ["row", "grid", "minimal"],
  "payment-methods": ["row", "grid"],
  columns: ["plain", "cards", "feature", "numbered", "image-side"],
  "pricing-plans": ["cards", "table"],
};

const uid = () => Math.random().toString(36).slice(2, 10);

/* ------------- Navbar + Footer ------------- */

export type NavLinkAction = "navigate" | "whatsapp" | "scroll-top" | "open-cart" | "open-search";
export type NavbarSearchStyle = "dropdown" | "expand" | "slide" | "overlay" | "drawer";
export type NavLink = {
  label: string;
  href: LinkTarget;
  isButton?: boolean;
  btnStyle?: "solid" | "outline" | "ghost";
  icon?: string;
  action?: NavLinkAction;
};
export type NavbarLogoMode = "text" | "logo" | "both";
export type NavbarStyle = "default" | "transparent" | "filled" | "minimal" | "bordered";
export type SidebarAnimation = "slide" | "fade" | "spring" | "bounce" | "none";
export type SidebarListStyle = "plain" | "chevron" | "arrow" | "dot" | "numbered";
export type SidebarTheme = "solid" | "glass" | "dark" | "minimal" | "accent";
export type NavbarLayout = "logo-left" | "logo-center" | "logo-right";
export type MobileMenuStyle = "left" | "right" | "bottom" | "fullscreen";
export type CartDrawerStyle = "right" | "left" | "bottom" | "center";
export type NavbarConfig = {
  brand: string;
  logoImage?: string;
  logoMode?: NavbarLogoMode;
  logoHeight?: number;
  links: NavLink[];
  showSearch: boolean;
  showCart: boolean;
  showThemeToggle: boolean;
  sticky: boolean;
  sidebarAnimation?: SidebarAnimation;
  listStyle?: SidebarListStyle;
  sidebarTheme?: SidebarTheme;
  layout?: NavbarLayout;
  showCartCount?: boolean;
  cartBadgeColor?: string;
  navbarStyle?: NavbarStyle;
  navbarBg?: string;
  showProfileIcon?: boolean;
  profileLink?: string;
  searchStyle?: NavbarSearchStyle;
  searchIcon?: string;
  cartIcon?: string;
  menuIcon?: string;
  profileIcon?: string;
  /** Custom font for the brand name text (e.g. Playfair Display for a luxury look) */
  brandFont?: FontHeading;
  /** Custom font size for the brand name */
  brandFontSize?: number;
  /** Which edge/shape the mobile menu panel opens from (default: "left") */
  mobileMenuStyle?: MobileMenuStyle;
  /** Which edge/shape the cart panel opens from (default: "right") */
  cartDrawerStyle?: CartDrawerStyle;
  ctaButtons?: Array<{
    label: string;
    href: string;
    style: "solid" | "outline" | "ghost";
    btnBg?: string;
    btnColor?: string;
    showInSidebar?: boolean;
    navPosition?: "left" | "right";
  }>;
};
export type FooterColumn = { title: string; links: NavLink[] };
export type FooterSocialPlatform = "instagram" | "twitter" | "facebook" | "tiktok" | "youtube" | "whatsapp" | "linkedin" | "pinterest" | "snapchat";
export type FooterConfig = {
  brand: string;
  tagline: string;
  columns: FooterColumn[];
  showSocial: boolean;
  socialLinks?: Array<{ platform: FooterSocialPlatform; url: string }>;
  textAlign?: "left" | "center" | "right";
  logoImage?: string;
  logoMode?: "text" | "logo" | "both";
  logoHeight?: number;
  ctaButtons?: Array<{ label: string; href: string; style: "solid" | "outline" | "ghost"; btnBg?: string; btnColor?: string }>;
};

export const defaultNavbar: NavbarConfig = {
  brand: "ATELIER",
  logoMode: "text",
  logoHeight: 28,
  links: [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "About", href: "/about" },
  ],
  showSearch: true,
  showCart: true,
  showThemeToggle: true,
  sticky: true,
};

export const defaultFooter: FooterConfig = {
  brand: "Atelier",
  tagline: "Considered objects, made to last.",
  columns: [
    { title: "Shop", links: [{ label: "All products", href: "/shop" }, { label: "New arrivals", href: "/shop" }] },
    { title: "Company", links: [{ label: "About", href: "/about" }, { label: "Journal", href: "/" }] },
    { title: "Help", links: [{ label: "Contact", href: "/" }, { label: "Shipping", href: "/" }] },
  ],
  showSocial: true,
};

/* ------------- Payment Config ------------- */

export type PaymentProvider = "none" | "flutterwave" | "paystack" | "both";
export type PaymentConfig = {
  provider: PaymentProvider;
  currency?: string;
};
export const defaultPaymentConfig: PaymentConfig = { provider: "none", currency: "NGN" };

/* ------------- Pages ------------- */

export type Page = {
  id: string;
  name: string;
  slug: string;
  sections: Section[];
  /** @deprecated kept for backward-compat only â€” use getPageUrl(slug) instead */
  path?: string;
};

/**
 * Returns the live URL for a page.
 * Slugs are now stored as the full URL path (e.g. "/about", "/product/:slug").
 * This function normalises legacy bare-word slugs on the way out.
 */
export function getPageUrl(slug: string): string {
  if (!slug || slug === "/") return "/";
  if (slug.startsWith("/")) return slug;
  // Legacy bare-word slugs â†’ canonical paths
  const legacy: Record<string, string> = {
    shop: "/shop", product: "/product/:slug", checkout: "/checkout",
    about: "/about", search: "/search", contact: "/contact",
  };
  return legacy[slug] ?? `/${slug}`;
}

export const defaultHomeSections = (): Section[] => [
  { id: uid(), type: "announcement", text: "Free shipping on orders over â‚¦15,000 â€” nationwide", link: "/shop" },
  {
    id: uid(), type: "hero", eyebrow: "New Â· Autumn collection",
    heading: "Considered objects for everyday life",
    body: "A small, slow shop of pieces designed in our studio and made by people we know.",
    image: hero, ctaLabel: "Shop the collection", ctaLink: "/shop", align: "bottom-left", height: "lg",
    variant: "overlay",
  },
  {
    id: uid(), type: "collection-list", heading: "Shop by category",
    items: [
      { label: "Home", image: products[0].image, link: "/shop" },
      { label: "Accessories", image: products[1].image, link: "/shop" },
      { label: "Apparel", image: products[3].image, link: "/shop" },
      { label: "Tech", image: products[5].image, link: "/shop" },
    ],
  },
  {
    id: uid(), type: "featured-products", heading: "Featured products",
    subheading: "A few favorites from the studio",
    productSlugs: products.slice(0, 4).map((p) => p.slug), columns: 4, variant: "grid",
  },
  {
    id: uid(), type: "image-text", heading: "Designed to be lived with",
    body: "Every piece is something we wanted ourselves and couldn't find done well.",
    image: products[1].image, imageSide: "right", ctaLabel: "Our story", ctaLink: "/about",
  },
  { id: uid(), type: "newsletter", heading: "Join the list", body: "New arrivals, studio notes, and the occasional discount.", buttonLabel: "Subscribe" },
];

export const defaultPages = (): Page[] => [
  { id: uid(), name: "Home", slug: "/", sections: defaultHomeSections() },
  { id: uid(), name: "Shop", slug: "/shop", sections: [] },
  { id: uid(), name: "Product", slug: "/product/:slug", sections: [] },
  { id: uid(), name: "Checkout", slug: "/checkout", sections: [] },
  { id: uid(), name: "About", slug: "/about", sections: [] },
  { id: uid(), name: "Contact", slug: "/contact", sections: [] },
];

export function createDefaultSection(type: SectionType): Section {
  const id = uid();
  switch (type) {
    case "announcement": return { id, type, text: "Free shipping on orders over â‚¦15,000", link: "/shop" };
    case "hero": return { id, type, heading: "New heading", body: "Short supporting copy goes here.", image: hero, ctaLabel: "Shop now", ctaLink: "/shop", align: "bottom-left", height: "md", variant: "overlay" };
    case "carousel": return {
      id, type, variant: "banner", autoplay: true, autoplaySeconds: 5, showArrows: true, showDots: true, height: "md",
      slides: [
        { heading: "Big summer sale", body: "Up to 40% off storewide", image: hero, ctaLabel: "Shop now", ctaLink: "/shop" },
        { heading: "New arrivals", body: "Fresh drops every week", eyebrow: "Just in", image: products[0].image, ctaLabel: "Explore", ctaLink: "/shop" },
      ],
    };
    case "featured-products": return { id, type, heading: "Featured products", productSlugs: products.slice(0, 3).map((p) => p.slug), columns: 3, variant: "grid" };
    case "image-text": return { id, type, heading: "Tell your story", body: "Pair text with a great image.", image: products[0].image, imageSide: "right", ctaLabel: "Learn more", ctaLink: "/about", variant: "side-by-side" };
    case "rich-text": return { id, type, heading: "About us", body: "Write whatever you'd like here.", align: "center" };
    case "gallery": return { id, type, heading: "Gallery", images: [products[0].image, products[1].image, products[2].image], columns: 3 };
    case "collection-list": return { id, type, heading: "Shop by category", items: [
      { label: "Home", image: products[0].image, link: "/shop" },
      { label: "Accessories", image: products[1].image, link: "/shop" },
      { label: "Apparel", image: products[3].image, link: "/shop" },
    ] };
    case "newsletter": return { id, type, heading: "Stay in touch", body: "Subscribe for updates.", buttonLabel: "Subscribe" };
    case "cta-banner": return { id, type, heading: "Ready to get started?", body: "Join thousands of happy customers.", ctaLabel: "Shop now", ctaLink: "/shop", background: "primary", variant: "centered" };
    case "text-columns": return { id, type, heading: "Why choose us", columns: [
      { title: "Made to last", body: "Materials chosen to improve with age." },
      { title: "Fair pricing", body: "Direct from our workshop to your door." },
      { title: "Free shipping", body: "On all orders over â‚¦15,000." },
    ] };
    case "testimonials": return { id, type, heading: "What customers say", variant: "cards", items: [
      { quote: "Beautifully made and arrived quickly. I'm in love.", author: "Sara K.", role: "Verified buyer" },
      { quote: "The quality is unreal for the price.", author: "Marcus T.", role: "Verified buyer" },
    ] };
    case "logo-bar": return { id, type, heading: "As featured in", logos: [
      { src: products[0].image, alt: "Press 1" }, { src: products[1].image, alt: "Press 2" },
      { src: products[2].image, alt: "Press 3" }, { src: products[3].image, alt: "Press 4" },
    ] };
    case "faq": return { id, type, heading: "Frequently asked", items: [
      { question: "How long does shipping take?", answer: "Most orders ship within 2 business days." },
      { question: "What is your return policy?", answer: "Free returns within 30 days." },
    ] };
    case "video": return { id, type, heading: "Watch", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" };
    case "spacer": return { id, type, size: "md" };
    case "related-products": return { id, type, heading: "You may also like", sourceSlug: products[0].slug, limit: 4 };
    case "search": return { id, type, heading: "Search products", placeholder: "Searchâ€¦", showFilters: true };
    case "product-detail": return { id, type, productSlug: products[0].slug, extraImages: [] };
    case "checkout-form": return { id, type, heading: "Checkout" };
    case "contact-form": return { id, type, heading: "Get in touch", subheading: "Fill in the form below and we'll get back to you shortly." };
    case "shop-grid": return { id, type, heading: "All products", showFilters: true, columns: 3 };
    case "custom-html": return { id, type, html: "<p>Paste your HTML or embed code here.</p>", label: "Custom block" };
    case "about": return {
      id, type, variant: "story",
      heading: "Our story",
      body: "We started with a single idea: make things worth keeping. Every piece is designed in-house and crafted by makers we trust.",
      image: products[1].image,
      ctaLabel: "Shop now", ctaLink: "/shop",
    };
    case "contact": return {
      id, type, variant: "split",
      heading: "Get in touch",
      subheading: "We'd love to hear from you. Reach us any time.",
      email: "hello@yourbrand.com",
      phone: "+234 800 000 0000",
      address: "123 Main Street, Lagos, Nigeria",
      hours: "Mon â€“ Fri, 9am â€“ 6pm",
      showForm: true,
    };
    case "auth-login": return { id, type, heading: "Sign in", subheading: "Welcome back!", imageSide: "left" as const };
    case "auth-signup": return { id, type, heading: "Create account", subheading: "Join us today.", imageSide: "left" as const };
    case "buyer-orders": return { id, type, heading: "My orders" };
    case "buyer-referrals": return { id, type, heading: "Refer & Earn", rewardLabel: "10% off their next order" };
    case "reviews": return { id, type, heading: "What Our Customers Say", useRealReviews: false, testimonials: [{ name: "Happy Customer", rating: 5, text: "Absolutely love this product! Great quality and fast delivery." }] };
    case "lookbook": return { id, type, heading: "The Lookbook", items: [{ image: "", title: "Look 1", description: "Shop the look" }] };
    case "timeline": return { id, type, heading: "Our Story", milestones: [{ year: "2020", title: "Founded", description: "We started with a simple idea." }] };
    case "before-after": return { id, type, heading: "See the Difference", pairs: [{ beforeImage: "", afterImage: "", label: "Transformation" }] };
    case "bundle-offer": return { id, type, heading: "Best Value Bundle", productSlugs: [], bundlePrice: "₦15,000", originalPrice: "₦22,000", savingsLabel: "Save ₦7,000", ctaLabel: "Get the Bundle" };
    case "video-hero": return { id, type, heading: "Bold headline", subheading: "Supporting text goes here.", ctaLabel: "Shop now", ctaLink: "/shop", overlayOpacity: 40, height: "md", align: "center" };
    case "social-feed": return { id, type, heading: "Follow us", handle: "yourbrand", posts: [], columns: 3, showHandle: true };
    case "map-location": return { id, type, heading: "Find us", address: "123 Main Street, Lagos, Nigeria", phone: "+234 800 000 0000", email: "hello@yourbrand.com", hours: "Mon – Fri, 9am – 6pm" };
    case "size-guide": return { id, type, heading: "Size guide", rows: [{ size: "S", Chest: "86–91", Waist: "71–76" }, { size: "M", Chest: "96–101", Waist: "81–86" }, { size: "L", Chest: "106–111", Waist: "91–96" }], columns: ["Chest", "Waist"], unit: "cm" };
    case "portfolio": return { id, type, heading: "Our work", items: [{ title: "Project 1", category: "Design", description: "Short description of this project." }], columns: 3 };
    case "whatsapp-cta": return { id, type, heading: "Have questions?", subheading: "Chat with us directly on WhatsApp — we reply fast.", phone: "", buttonLabel: "Chat on WhatsApp", prefilledMessage: "Hello, I have a question about your products." };
    case "trust-badges": return { id, type, heading: "Why shop with us", badges: [{ icon: "shield", label: "Secure payment", description: "SSL encrypted checkout" }, { icon: "truck", label: "Fast delivery", description: "2–5 business days" }, { icon: "check", label: "Verified sellers", description: "All sellers are vetted" }] };
    case "payment-methods": return { id, type, heading: "We accept", methods: [{ id: "paystack", label: "Paystack", enabled: true }, { id: "flutterwave", label: "Flutterwave", enabled: true }, { id: "opay", label: "OPay", enabled: true }, { id: "palmpay", label: "PalmPay", enabled: true }, { id: "bank", label: "Bank transfer", enabled: true }, { id: "ussd", label: "USSD", enabled: true }] };
    case "columns": return { id, type, heading: "What we offer", count: 3, variant: "plain", items: [
      { iconName: "star", heading: "Premium quality", body: "We source only the finest products for our customers." },
      { iconName: "truck", heading: "Fast delivery", body: "Get your orders delivered across Nigeria within 2-3 days." },
      { iconName: "shield", heading: "Buyer protection", body: "Every purchase is secured by our escrow payment system." },
    ]};
    case "pricing-plans": return { id, type, heading: "Simple, transparent pricing", subheading: "Choose the plan that works for you", variant: "cards", plans: [
      { name: "Starter", price: "Free", features: ["5 products", "Basic analytics", "WhatsApp support"], ctaLabel: "Get started", ctaLink: "/shop" },
      { name: "Growth", price: "₦5,000", period: "/month", features: ["Unlimited products", "Advanced analytics", "Priority support", "Custom domain"], ctaLabel: "Subscribe", ctaLink: "/shop", highlighted: true },
      { name: "Enterprise", price: "Custom", features: ["Everything in Growth", "Dedicated account manager", "API access", "SLA"], ctaLabel: "Contact us", ctaLink: "/contact" },
    ]};
    case "countdown": return { id, type, heading: "Sale ends in", body: "Grab them before they're gone", targetDate: new Date(Date.now() + 7 * 86400000).toISOString(), ctaLabel: "Shop now", ctaLink: "/shop" };
    case "stats": return { id, type, heading: "Our numbers", items: [
      { value: "10K+", label: "Happy customers", description: "Across Nigeria" },
      { value: "500+", label: "Products", description: "Curated just for you" },
      { value: "4.9", label: "Average rating", description: "From verified buyers" },
      { value: "24h", label: "Dispatch time", description: "On in-stock items" },
    ] };
    case "team": return { id, type, heading: "Meet the team", subheading: "The people behind the brand", members: [
      { name: "Akin S.", role: "Founder", avatar: "" },
      { name: "Tolu O.", role: "Head of Design", avatar: "" },
      { name: "Ngozi A.", role: "Customer Care", avatar: "" },
      { name: "Emeka U.", role: "Logistics", avatar: "" },
    ] };
    case "custom": return { id, type, label: "Custom section", blocks: [], gap: "md", align: "start" };
  }
}

/* ------------- Templates ------------- */

export type ReferralSettings = {
  enabled: boolean;
  rewardLabel?: string;
};
export type DeliveryFees = {
  lagos: number;
  other: number;
  freeThreshold: number;
};
export const defaultDeliveryFees: DeliveryFees = {
  lagos: 1500,
  other: 3500,
  freeThreshold: 15000,
};
export type Template = {
  id: string;
  name: string;
  thumbnail?: string;
  pages: Page[];
  navbar: NavbarConfig;
  footer: FooterConfig;
  theme: Theme;
  paymentConfig?: PaymentConfig;
  designTokens?: DesignTokens;
  referrals?: ReferralSettings;
};

export const createBlankTemplate = (name = "Untitled template"): Template => ({
  id: uid(), name,
  thumbnail: ATELIER_THUMB,
  pages: defaultPages(),
  navbar: { ...defaultNavbar },
  footer: { ...defaultFooter, columns: defaultFooter.columns.map((c) => ({ ...c, links: [...c.links] })) },
  theme: "light",
  paymentConfig: { ...defaultPaymentConfig },
  designTokens: { ...defaultDesignTokens },
});

/** Completely blank template — all pages start with zero sections. Vendor builds everything from scratch. */
export const createEmptyTemplate = (name = "Blank template"): Template => ({
  id: uid(), name,
  pages: [
    { id: uid(), name: "Home", slug: "/", sections: [] },
    { id: uid(), name: "Shop", slug: "/shop", sections: [] },
    { id: uid(), name: "Product", slug: "/product/:slug", sections: [] },
    { id: uid(), name: "Checkout", slug: "/checkout", sections: [] },
    { id: uid(), name: "About", slug: "/about", sections: [] },
    { id: uid(), name: "Contact", slug: "/contact", sections: [] },
  ],
  navbar: { ...defaultNavbar, brand: name },
  footer: { brand: name, tagline: "", columns: [], showSocial: false },
  theme: "light",
  paymentConfig: { ...defaultPaymentConfig },
  designTokens: { ...defaultDesignTokens },
});

export const ATELIER_THUMB =`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 200'><rect width='320' height='200' fill='%23f8f6f2'/><rect y='0' width='320' height='88' fill='%232c2c2c'/><text x='160' y='40' font-size='18' fill='white' text-anchor='middle' font-family='Georgia,serif'>ATELIER</text><text x='160' y='60' font-size='7' fill='%23aaa' text-anchor='middle' font-family='sans-serif'>Considered objects for everyday life</text><rect x='16' y='100' width='86' height='64' rx='3' fill='%23e5e1d8'/><rect x='117' y='100' width='86' height='64' rx='3' fill='%23e5e1d8'/><rect x='218' y='100' width='86' height='64' rx='3' fill='%23e5e1d8'/><rect x='16' y='170' width='55' height='4' rx='2' fill='%23ccc'/><rect x='117' y='170' width='55' height='4' rx='2' fill='%23ccc'/><rect x='218' y='170' width='55' height='4' rx='2' fill='%23ccc'/></svg>`;

/**
 * Rewrite a deployed vendor template's internal links so navigation stays inside
 * the vendor store. Static page links (/about, /shop, custom pages, section CTAs)
 * become /@username/…; platform-owned routes (/product/*, /checkout, /search, …)
 * are left untouched because they are vendor-scoped via setActiveVendorId.
 * Page slugs are preserved so subpath routing still matches.
 */
export function scopeTemplateToVendor(tpl: Template, username: string): Template {
  const owner = username.toLowerCase();
  const PLATFORM_ROUTES = new Set([
    "/product", "/checkout", "/search", "/order", "/invoice", "/review",
    "/login", "/admin", "/admin-login", "/dashboard", "/templates",
  ]);
  const ASSET_EXT = /\.(png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|ogg|pdf|woff2?|ttf|eot|json)$/i;

  const prefix = (href: string): string => {
    if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/@")) return href;
    const path = href.split(/[?#]/)[0];
    const first = "/" + (path.split("/").filter(Boolean)[0] ?? "");
    if (PLATFORM_ROUTES.has(first)) return href;
    if (ASSET_EXT.test(path)) return href;
    return `/@${owner}${href === "/" ? "" : href}`;
  };

  const rewriteValue = (v: unknown): unknown => {
    if (typeof v === "string") return prefix(v);
    if (Array.isArray(v)) return v.map(rewriteValue);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) out[k] = rewriteValue(x);
      return out;
    }
    return v;
  };

  return {
    ...tpl,
    navbar: rewriteValue(tpl.navbar) as NavbarConfig,
    footer: rewriteValue(tpl.footer) as FooterConfig,
    pages: tpl.pages.map((p) => ({ ...p, sections: rewriteValue(p.sections) as Section[] })),
  };
}

/* ------------- State ------------- */

type Ctx = {
  pages: Page[];
  navbar: NavbarConfig;
  footer: FooterConfig;
  theme: Theme;
  setTheme: (t: Theme) => void;
  activePageId: string;
  setActivePageId: (id: string) => void;
  activePage: Page;
  // pages CRUD
  addPage: (name: string, slug: string) => string;
  deletePage: (id: string) => void;
  updatePage: (id: string, patch: Partial<Pick<Page, "name" | "slug">>) => void;
  // sections (operate on active page)
  sections: Section[];
  update: (id: string, patch: Partial<Section>) => void;
  add: (type: SectionType, index?: number) => string;
  remove: (id: string) => void;
  move: (id: string, dir: -1 | 1) => void;
  moveTo: (id: string, pos: "top" | "bottom") => void;
  duplicate: (id: string) => void;
  // navbar / footer
  updateNavbar: (patch: Partial<NavbarConfig>) => void;
  updateFooter: (patch: Partial<FooterConfig>) => void;
  // payment
  paymentConfig: PaymentConfig;
  updatePaymentConfig: (patch: Partial<PaymentConfig>) => void;
  // vendor-configured delivery charges
  deliveryFees: DeliveryFees;
  setDeliveryFees: (fees: Partial<DeliveryFees>) => void;
  /**
   * Scoped vendor-storefront hydration. Overrides pages, navbar, footer, theme,
   * design tokens (fonts), payment config, and referrals with a vendor template
   * so deployed shops never fall back to admin/default data. Pass null to
   * restore the admin editor state. Not persisted to localStorage.
   */
  hydrateVendorTemplate: (tpl: Template | null) => void;
  /** True until vendor-scope hydration has resolved one way or the other on
   * this mount. Routes whose behavior depends on vendor choices (payment
   * provider, above all) should avoid acting on defaults while this is true. */
  vendorHydrating: boolean;
  // design tokens
  designTokens: DesignTokens;
  updateDesignTokens: (patch: Partial<DesignTokens>) => void;
  // referrals
  referrals: ReferralSettings;
  updateReferrals: (patch: Partial<ReferralSettings>) => void;
  // templates
  templates: Template[];
  activeTemplateId: string;
  applyTemplate: (id: string) => void;
  saveAsTemplate: (name: string) => string;
  duplicateTemplate: (id: string) => string;
  deleteTemplate: (id: string) => void;
  renameTemplate: (id: string, name: string) => void;
  patchTemplate: (id: string, patch: Partial<Pick<Template, "name" | "thumbnail">>) => void;
  newTemplate: (name: string) => string;
  newBlankTemplate: (name: string) => string;
  // undo / redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  // export
  reset: () => void;
  exportJson: () => string;
  importJson: (raw: string) => boolean;
};

const StoreCtx = createContext<Ctx | null>(null);
const DesignCtx = createContext<DesignTokens>(defaultDesignTokens);
/** Read the active template's design tokens (safe outside StorefrontProvider â€” returns defaults). */
export const useDesignTokens = () => useContext(DesignCtx);
const BASE_KEY = "storefront.v3";
// Returns a per-vendor key when a vendor is logged in, preventing cross-vendor bleed in localStorage
function getStorageKey(): string {
  try {
    const vid = typeof localStorage !== "undefined" ? localStorage.getItem("kiosk_editor_active_vendor") : null;
    return vid ? `${BASE_KEY}.${vid}` : BASE_KEY;
  } catch { return BASE_KEY; }
}

// "Platform" routes (checkout, product, shop, about, contact, search, order,
// invoice, review) don't carry /@username in their own URL — they rely on the
// vendor scope already being hydrated from an earlier page in the same visit.
// A fresh load or refresh of one of those (very common: a payment gateway's
// hosted checkout redirecting back to /checkout) had no way to know which
// vendor it belonged to, so it silently fell back to the bundled default
// template's nav/footer/payment provider/etc. Persist the vendor slug here —
// sessionStorage, not localStorage, so it never bleeds across browser
// sessions/devices — so any route can re-hydrate on a fresh mount.
const ACTIVE_VENDOR_SLUG_KEY = "kiosk_active_vendor_slug";
export function getPersistedVendorSlug(): string | null {
  try { return typeof window !== "undefined" ? sessionStorage.getItem(ACTIVE_VENDOR_SLUG_KEY) : null; } catch { return null; }
}
export function setPersistedVendorSlug(slug: string) {
  try { if (typeof window !== "undefined") sessionStorage.setItem(ACTIVE_VENDOR_SLUG_KEY, slug); } catch { /* best-effort */ }
}
/** True for the platform's own domains (path-based /@username stores live here) — false for a vendor's custom domain. */
export function isPlatformHost(host: string): boolean {
  return (
    host === "localhost" || host === "127.0.0.1" || host === "keeosk.store" ||
    host.endsWith(".localhost") || host.endsWith(".keeosk.store") ||
    host.endsWith(".pages.dev") || host.endsWith(".workers.dev")
  );
}

type Persisted = {
  templates: Template[];
  activeTemplateId: string;
  theme: Theme;
  _mv?: number; // migration version
};

const CURRENT_MV = 7;

function makeInitial(): Persisted {
  const t1 = createBlankTemplate("Atelier (default)");
  return { templates: [t1], activeTemplateId: t1.id, theme: "light", _mv: CURRENT_MV };
}

function migratePersistedState(obj: Persisted): Persisted {
  let templates = obj.templates;
  const mv = obj._mv ?? 0;

  // v7: remove legacy Bloom/Maison/Luma preset templates (vendors keep their custom templates)
  if (mv < 7) {
    templates = templates.filter((t) => !["Bloom Market", "Maison", "Luma"].includes(t.name));
    if (templates.length === 0) templates = [createBlankTemplate("Atelier (default)")];
  }

  // v3: strip legacy system/path fields from pages; seed design tokens
  if (mv < 3) {
    templates = templates.map((t: Template) => ({
      ...t,
      designTokens: t.designTokens ?? { ...defaultDesignTokens },
      pages: t.pages.map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { system: _s, path: _p, ...rest } = p as any;
        void _s; void _p;
        return rest as Page;
      }),
    }));
  }

  // v4: convert bare-word slugs to full URL paths
  if (mv < 4) {
    const toPath = (slug: string): string => {
      if (!slug || slug === "/") return "/";
      if (slug.startsWith("/")) return slug;
      const known: Record<string, string> = {
        shop: "/shop", product: "/product/:slug", checkout: "/checkout",
        about: "/about", search: "/search", contact: "/contact",
      };
      return known[slug] ?? `/${slug}`;
    };
    templates = templates.map((t: Template) => ({
      ...t,
      pages: t.pages.map((p) => ({ ...p, slug: toPath(p.slug) })),
    }));
  }

  // v6: strip /p/ prefix from slugs (legacy artifact where pages were saved as /p/something)
  if (mv < 6) {
    templates = templates.map((t: Template) => ({
      ...t,
      pages: t.pages.map((p) => ({
        ...p,
        slug: p.slug.startsWith('/p/') ? p.slug.slice(2) : p.slug,
      })),
    }));
  }

  // stamp thumbnails if missing
  templates = templates.map((t: Template) => {
    if (!t.thumbnail) {
      return { ...t, thumbnail: ATELIER_THUMB };
    }
    return t;
  });
  return { ...obj, templates, _mv: CURRENT_MV };
}

// useLayoutEffect fires synchronously before the first browser paint â€” no flash.
// Falls back to useEffect on the server (where localStorage doesn't exist anyway).
const useClientLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(makeInitial);
  const [activePageId, setActivePageIdState] = useState<string>(() => state.templates[0].pages[0].id);
  const [hydrated, setHydrated] = useState(false);
  // Vendor delivery charges — hydated from the live store API (not persisted in the template).
  const [deliveryFeesState, setDeliveryFeesState] = useState<DeliveryFees>(defaultDeliveryFees);
  // Vendor storefront override — set while viewing a deployed @username shop so the
  // whole template (pages, fonts, navbar, footer, theme, payments) drives the UI.
  // Deliberately separate from `state` so it is never persisted to localStorage.
  const [vendorTpl, setVendorTpl] = useState<Template | null>(null);
  // True only once a real vendor template has been confirmed absent (not a
  // vendor context) or successfully hydrated — lets pages that render
  // something the vendor's own choices affect (payment provider, above all)
  // wait a beat instead of briefly showing the platform default.
  const [vendorHydrating, setVendorHydrating] = useState(true);

  // Root-level fallback hydration: $.tsx (/@username/*) and index.tsx (custom
  // domain root) already hydrate for their own routes. This covers every
  // other route on a fresh mount, using whichever vendor scope is already
  // known — the current hostname for a custom domain, or the last-visited
  // vendor slug (sessionStorage) for the path-based platform domains.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    // $.tsx owns hydration for these — leave vendorHydrating as-is (still true)
    // so it keeps reflecting THAT fetch's real progress; it calls
    // hydrateVendorTemplate() on both success and failure, which is what
    // actually resolves it, rather than us short-circuiting it to false here
    // before the real fetch has even started.
    if (/^\/@[a-z0-9_]+/i.test(path)) return;
    // The admin/template-builder routes are the local editor itself — they must
    // keep reading/writing `active` (the in-progress draft), never a fetched
    // read-only vendor snapshot, even if this browser tab previously visited a
    // live shop and left a vendor slug behind in sessionStorage.
    if (/^\/(admin|templates)(\/|$)/i.test(path)) { setVendorHydrating(false); return; }
    const host = window.location.hostname;
    const base = (import.meta as any).env?.["VITE_API_BASE"] ?? "/api";
    const url = !isPlatformHost(host)
      ? `${base}/store/by-domain?domain=${encodeURIComponent(host)}` // index.tsx also owns "/" itself, but re-hydrating there is harmless
      : (() => {
          const slug = getPersistedVendorSlug();
          return slug ? `${base}/store/${encodeURIComponent(slug)}` : null;
        })();
    if (!url) { setVendorHydrating(false); return; }
    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((json: { success?: boolean; paused?: boolean; templateJson?: string; deliveryFees?: DeliveryFees; vendorId?: string }) => {
        if (cancelled || !json.success || json.paused || !json.templateJson) return;
        setVendorTpl(JSON.parse(json.templateJson) as Template);
        if (json.deliveryFees) setDeliveryFeesState((f) => ({ ...f, ...json.deliveryFees }));
        // Also recover product/cart scope (vendorProducts.tsx, cart.tsx) on the
        // same fresh mount, not just template-derived nav/footer/payment.
        if (json.vendorId) setActiveVendorId(json.vendorId);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setVendorHydrating(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Undo / redo history (stored in refs to avoid spurious re-renders)
  const historyRef = useRef<Persisted[]>([]);
  const futureRef = useRef<Persisted[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useClientLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey());
      if (raw) {
        const obj = JSON.parse(raw) as Persisted;
        if (obj?.templates?.length) {
          const migrated = migratePersistedState(obj);
          setState(migrated);
          const t = migrated.templates.find((x) => x.id === migrated.activeTemplateId) ?? migrated.templates[0];
          setActivePageIdState(t.pages[0]?.id ?? "");
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(getStorageKey(), JSON.stringify(state));
  }, [state, hydrated]);

  const active = state.templates.find((t) => t.id === state.activeTemplateId) ?? state.templates[0];
  const activeDeliveryFees = deliveryFeesState;
  const activePage = active.pages.find((p) => p.id === activePageId) ?? active.pages[0];
  // Effective values — vendor scope wins over admin editor state when present.
  const effectiveTheme = vendorTpl?.theme ?? state.theme;
  const effectiveTokens = vendorTpl?.designTokens ?? active.designTokens ?? defaultDesignTokens;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
  }, [effectiveTheme]);

  const effectiveNavbarBrandFont = (vendorTpl?.navbar ?? active.navbar)?.brandFont;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const tokens = effectiveTokens;
    const hMeta = HEADING_FONT_META[tokens.fontHeading ?? "serif"] ?? HEADING_FONT_META.serif;
    const bMeta = BODY_FONT_META[tokens.fontBody ?? "inherit"] ?? BODY_FONT_META["inherit"];
    // Navbar's own "Brand font" override (site-header.tsx) needs its Google Font
    // loaded too when it differs from the store-wide heading font.
    const brandMeta = effectiveNavbarBrandFont ? HEADING_FONT_META[effectiveNavbarBrandFont] : undefined;
    const needed = [hMeta.googleId, bMeta.googleId, brandMeta?.googleId].filter((id): id is string => !!id);
    const existing = new Set(
      Array.from(document.querySelectorAll<HTMLLinkElement>("link[data-kf]")).map((el) => el.getAttribute("data-kf")),
    );
    needed.forEach((googleId) => {
      if (existing.has(googleId)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${googleId}&display=swap`;
      link.setAttribute("data-kf", googleId);
      document.head.appendChild(link);
    });
  }, [effectiveTokens, effectiveNavbarBrandFont]);

  // Record current state to history before a mutation
  const recordHistory = (prev: Persisted) => {
    historyRef.current = [...historyRef.current.slice(-49), prev];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const mutateActive = (fn: (t: Template) => Template) => {
    recordHistory(state);
    setState((s) => ({
      ...s,
      templates: s.templates.map((t) => (t.id === s.activeTemplateId ? fn(t) : t)),
    }));
  };
  const mutatePage = (fn: (p: Page) => Page) => {
    mutateActive((t) => ({
      ...t,
      pages: t.pages.map((p) => (p.id === activePage.id ? fn(p) : p)),
    }));
  };

  const undo = () => {
    const prev = historyRef.current[historyRef.current.length - 1];
    if (!prev) return;
    futureRef.current = [state, ...futureRef.current.slice(0, 49)];
    historyRef.current = historyRef.current.slice(0, -1);
    setState(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  };

  const redo = () => {
    const next = futureRef.current[0];
    if (!next) return;
    historyRef.current = [...historyRef.current.slice(-49), state];
    futureRef.current = futureRef.current.slice(1);
    setState(next);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  };

  const value = useMemo<Ctx>(() => ({
    pages: vendorTpl?.pages ?? active.pages,
    navbar: vendorTpl?.navbar ?? active.navbar,
    footer: vendorTpl?.footer ?? active.footer,
    theme: effectiveTheme,
    setTheme: (t) => setState((s) => ({ ...s, theme: t })),
    activePageId: activePage.id,
    setActivePageId: setActivePageIdState,
    activePage,

    addPage: (name, slug) => {
      const id = uid();
      const raw = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-");
      const normSlug = raw === "/" ? "/" : raw.startsWith("/") ? raw : `/${raw}`;
      mutateActive((t) => ({
        ...t,
        pages: [...t.pages, { id, name, slug: normSlug, sections: [] }],
        navbar: { ...t.navbar, links: [...t.navbar.links, { label: name, href: normSlug }] },
      }));
      setActivePageIdState(id);
      return id;
    },
    deletePage: (id) => {
      mutateActive((t) => {
        const target = t.pages.find((p) => p.id === id);
        if (!target || t.pages.length <= 1) return t;
        return { ...t, pages: t.pages.filter((p) => p.id !== id) };
      });
      if (activePageId === id) setActivePageIdState(active.pages.find((p) => p.id !== id)?.id ?? "");
    },
    updatePage: (id, patch) => mutateActive((t) => ({ ...t, pages: t.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

    sections: activePage.sections,
    update: (id, patch) => mutatePage((p) => ({ ...p, sections: p.sections.map((s) => (s.id === id ? { ...s, ...patch } as Section : s)) })),
    add: (type, index) => {
      const sec = createDefaultSection(type);
      mutatePage((p) => {
        const next = [...p.sections];
        next.splice(index ?? next.length, 0, sec);
        return { ...p, sections: next };
      });
      return sec.id;
    },
    remove: (id) => mutatePage((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== id) })),
    move: (id, dir) => mutatePage((p) => {
      const i = p.sections.findIndex((s) => s.id === id); const j = i + dir;
      if (i < 0 || j < 0 || j >= p.sections.length) return p;
      const next = [...p.sections]; [next[i], next[j]] = [next[j], next[i]];
      return { ...p, sections: next };
    }),
    moveTo: (id, pos) => mutatePage((p) => {
      const i = p.sections.findIndex((s) => s.id === id); if (i < 0) return p;
      const next = [...p.sections]; const [item] = next.splice(i, 1);
      if (pos === "top") next.unshift(item); else next.push(item);
      return { ...p, sections: next };
    }),
    duplicate: (id) => mutatePage((p) => {
      const i = p.sections.findIndex((s) => s.id === id); if (i < 0) return p;
      const copy = { ...p.sections[i], id: uid() } as Section;
      const next = [...p.sections]; next.splice(i + 1, 0, copy);
      return { ...p, sections: next };
    }),

    updateNavbar: (patch) => mutateActive((t) => ({ ...t, navbar: { ...t.navbar, ...patch } })),
    updateFooter: (patch) => mutateActive((t) => ({ ...t, footer: { ...t.footer, ...patch } })),

    paymentConfig: vendorTpl?.paymentConfig ?? active.paymentConfig ?? defaultPaymentConfig,
    updatePaymentConfig: (patch: Partial<PaymentConfig>) => mutateActive((t: Template) => ({
      ...t,
      paymentConfig: { ...(t.paymentConfig ?? defaultPaymentConfig), ...patch },
    })),

    deliveryFees: activeDeliveryFees,
    setDeliveryFees: (fees: Partial<DeliveryFees>) => setDeliveryFeesState((prev) => ({ ...prev, ...fees })),

    hydrateVendorTemplate: (tpl) => { setVendorTpl(tpl); setVendorHydrating(false); },
    vendorHydrating,

    designTokens: effectiveTokens,
    updateDesignTokens: (patch: Partial<DesignTokens>) => mutateActive((t: Template) => ({
      ...t,
      designTokens: { ...(t.designTokens ?? defaultDesignTokens), ...patch },
    })),

    referrals: vendorTpl?.referrals ?? active.referrals ?? { enabled: false },
    updateReferrals: (patch: Partial<ReferralSettings>) => mutateActive((t: Template) => ({
      ...t,
      referrals: { ...(t.referrals ?? { enabled: false }), ...patch },
    })),

    templates: state.templates,
    activeTemplateId: state.activeTemplateId,
    applyTemplate: (id) => {
      setState((s) => ({ ...s, activeTemplateId: id }));
      const t = state.templates.find((x) => x.id === id);
      if (t) setActivePageIdState(t.pages[0]?.id ?? "");
    },
    saveAsTemplate: (name) => {
      const copy: Template = { ...active, id: uid(), name, pages: JSON.parse(JSON.stringify(active.pages)) };
      setState((s) => ({ ...s, templates: [...s.templates, copy] }));
      return copy.id;
    },
    duplicateTemplate: (id) => {
      const src = state.templates.find((t) => t.id === id); if (!src) return "";
      const copy: Template = JSON.parse(JSON.stringify(src));
      copy.id = uid(); copy.name = `${src.name} copy`;
      setState((s) => ({ ...s, templates: [...s.templates, copy] }));
      return copy.id;
    },
    deleteTemplate: (id) => {
      setState((s) => {
        if (s.templates.length <= 1) return s;
        const templates = s.templates.filter((t) => t.id !== id);
        const activeTemplateId = s.activeTemplateId === id ? templates[0].id : s.activeTemplateId;
        return { ...s, templates, activeTemplateId };
      });
    },
    renameTemplate: (id, name) => setState((s) => ({ ...s, templates: s.templates.map((t) => (t.id === id ? { ...t, name } : t)) })),
    patchTemplate: (id, patch) => setState((s) => ({ ...s, templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    newTemplate: (name) => {
      const t = createBlankTemplate(name);
      setState((s) => ({ ...s, templates: [...s.templates, t], activeTemplateId: t.id }));
      setActivePageIdState(t.pages[0].id);
      return t.id;
    },
    newBlankTemplate: (name) => {
      const t = createEmptyTemplate(name);
      setState((s) => ({ ...s, templates: [...s.templates, t], activeTemplateId: t.id }));
      setActivePageIdState(t.pages[0].id);
      return t.id;
    },

    undo,
    redo,
    canUndo,
    canRedo,

    reset: () => {
      // Clear history so reset cannot be undone
      historyRef.current = [];
      futureRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      setState((s) => ({
        ...s,
        templates: s.templates.map((t: Template) =>
          t.id === s.activeTemplateId
            ? { ...t, pages: defaultPages(), navbar: { ...defaultNavbar }, footer: { ...defaultFooter } }
            : t
        ),
      }));
    },
    exportJson: () => JSON.stringify({ version: CURRENT_MV, ...state }, null, 2),
    importJson: (raw) => {
      try {
        const obj = JSON.parse(raw);
        if (!obj?.templates?.length) return false;
        historyRef.current = [];
        futureRef.current = [];
        setCanUndo(false);
        setCanRedo(false);
        const migrated = migratePersistedState({
          templates: obj.templates,
          activeTemplateId: obj.activeTemplateId ?? obj.templates[0].id,
          theme: obj.theme ?? "light",
          _mv: obj._mv ?? 0,
        });
        setState(migrated);
        setActivePageIdState(migrated.templates[0].pages[0]?.id ?? "");
        return true;
      } catch { return false; }
    },
  }), [state, activePageId, active, activePage, canUndo, canRedo, vendorTpl, vendorHydrating, effectiveTheme, effectiveTokens, deliveryFeesState]);

  return (
    <StoreCtx.Provider value={value}>
      <DesignCtx.Provider value={effectiveTokens}>
        {children}
      </DesignCtx.Provider>
    </StoreCtx.Provider>
  );
}

export const useStorefront = () => {
  const c = useContext(StoreCtx); if (!c) throw new Error("useStorefront outside provider"); return c;
};

/** Resolve link options from current state (pages + products). */
export function useLinkOptions() {
  const { pages } = useStorefront();
  const opts: { label: string; value: string }[] = [];
  for (const p of pages) {
    if (p.slug.includes(":")) continue; // skip dynamic routes like /product/:slug
    opts.push({ label: `Page Â· ${p.name}`, value: getPageUrl(p.slug) });
  }
  for (const p of products) opts.push({ label: `Product Â· ${p.name}`, value: `/product/${p.slug}` });
  return opts;
}

/** Static fallback for places that can't use the hook (kept for safety). */
export const LINK_OPTIONS: { label: string; value: string }[] = [
  { label: "Home", value: "/" },
  { label: "Shop", value: "/shop" },
  { label: "About", value: "/about" },
  ...products.map((p) => ({ label: `Product Â· ${p.name}`, value: `/product/${p.slug}` })),
];

export const PADDING_CLASS: Record<Padding, string> = {
  none: "py-0", sm: "py-6", md: "py-12", lg: "py-20",
};

export const ALIGN9_CLASS: Record<Align9, string> = {
  "top-left": "items-start justify-start text-left",
  "top-center": "items-center justify-start text-center",
  "top-right": "items-end justify-start text-right",
  "middle-left": "items-start justify-center text-left",
  "middle-center": "items-center justify-center text-center",
  "middle-right": "items-end justify-center text-right",
  "bottom-left": "items-start justify-end text-left",
  "bottom-center": "items-center justify-end text-center",
  "bottom-right": "items-end justify-end text-right",
};
