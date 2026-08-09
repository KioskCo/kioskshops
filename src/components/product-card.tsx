import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BagPlus, Cart3, Plus } from "react-bootstrap-icons";
import { formatPrice, type Product } from "@/lib/products";
import { useDesignTokens, HEADING_FONT_META, type CartBtnStyle, type ProductCardVariant } from "@/lib/storefront";

function useSaleActive(saleEndsAt?: string | null): boolean {
  const [active, setActive] = useState(() => !!saleEndsAt && new Date(saleEndsAt) > new Date());
  useEffect(() => {
    if (!saleEndsAt) { setActive(false); return; }
    const t = setInterval(() => setActive(new Date(saleEndsAt) > new Date()), 5000);
    return () => clearInterval(t);
  }, [saleEndsAt]);
  return active;
}

const radiusMap: Record<string, string> = {
  none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-2xl",
};

function CartButton({
  style, label, bg, color, btnRadius, onClick,
}: {
  style?: CartBtnStyle; label?: string; bg?: string; color?: string; btnRadius: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  if (!style || style === "text") {
    return (
      <button onClick={onClick} aria-label={label ?? "Add to cart"}
        className={`shrink-0 h-8 px-3 text-xs font-medium bg-primary text-primary-foreground transition-opacity hover:opacity-80 ${btnRadius}`}
        style={{ backgroundColor: bg, color }}>
        {label ?? "Add to cart"}
      </button>
    );
  }
  if (style === "plus") {
    return (
      <button onClick={onClick} aria-label="Add to cart"
        className={`shrink-0 h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground transition-opacity hover:opacity-80 ${btnRadius}`}
        style={{ backgroundColor: bg, color }}>
        <Plus size={16} />
      </button>
    );
  }
  if (style === "cart") {
    return (
      <button onClick={onClick} aria-label="Add to cart"
        className={`shrink-0 h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground transition-opacity hover:opacity-80 ${btnRadius}`}
        style={{ backgroundColor: bg, color }}>
        <Cart3 size={15} />
      </button>
    );
  }
  if (style === "plus-text") {
    return (
      <button onClick={onClick} aria-label={label ?? "Add to cart"}
        className={`shrink-0 h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground transition-opacity hover:opacity-80 ${btnRadius}`}
        style={{ backgroundColor: bg, color }}>
        <Plus size={14} />{label ?? "Add to cart"}
      </button>
    );
  }
  return (
    <button onClick={onClick} aria-label={label ?? "Add to cart"}
      className={`shrink-0 h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-primary text-primary-foreground transition-opacity hover:opacity-80 ${btnRadius}`}
      style={{ backgroundColor: bg, color }}>
      <BagPlus size={14} />{label ?? "Add to cart"}
    </button>
  );
}

interface CardInnerProps {
  product: Product;
  cardStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  priceStyle?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  onAddToCart?: (product: Product) => void;
  cartBtnStyle?: CartBtnStyle;
  cartBtnBg?: string;
  cartBtnColor?: string;
  cartBtnLabel?: string;
  cartBtnLayout?: "below" | "right";
  radius: string;
  btnRadius: string;
  isPortrait: boolean;
  saleActive: boolean;
  isPreorder: boolean;
  releaseLabel?: string;
  displayPrice: number;
  isOOS: boolean;
  hoverImage?: string;
  hMeta: { twClass: string; family?: string | null };
  handleAddToCart: (e: React.MouseEvent) => void;
}

// ── Badge helpers shared by all variants ──────────────────────────────────────

function SaleBadge() {
  return (
    <span className="absolute top-2 left-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide">
      SALE
    </span>
  );
}

function PreorderBadge() {
  return (
    <span className="absolute top-2 left-2 z-10 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white tracking-wide">
      PREORDER
    </span>
  );
}

function statusBadge(isPreorder: boolean, saleActive: boolean) {
  if (isPreorder) return <PreorderBadge />;
  if (saleActive) return <SaleBadge />;
  return null;
}

function OOSOverlay() {
  return (
    <div className="absolute inset-0 flex items-end justify-center bg-black/30 pb-4 z-10">
      <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-700">
        Out of Stock
      </span>
    </div>
  );
}

// ── Variant: classic ──────────────────────────────────────────────────────────
// Image top (portrait or square), name + category + price + cart below
function ClassicInner({ product, radius, btnRadius, isPortrait, saleActive, isPreorder, releaseLabel, displayPrice, isOOS, hoverImage, hMeta, titleStyle, priceStyle, imageStyle, onAddToCart, cartBtnStyle, cartBtnBg, cartBtnColor, cartBtnLabel, cartBtnLayout, handleAddToCart }: CardInnerProps) {
  return (
    <>
      <div className={`relative overflow-hidden bg-secondary ${radius} ${isPortrait ? "aspect-[3/4]" : "aspect-square"}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"} ${isOOS && !isPreorder ? "opacity-60" : ""}`}
          style={imageStyle} />
        {hoverImage && (
          <img src={hoverImage} alt={product.name} loading="lazy" decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 ${isOOS && !isPreorder ? "opacity-0 group-hover:opacity-40" : "opacity-0 group-hover:opacity-100"}`}
            style={imageStyle} />
        )}
        {isOOS && !isPreorder && <OOSOverlay />}
        {statusBadge(isPreorder, saleActive)}
      </div>
      {cartBtnLayout === "right" && onAddToCart && cartBtnStyle && !isOOS ? (
        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className={`truncate text-base leading-tight ${hMeta.twClass}`}
              style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
            <div className="flex items-center gap-1.5">
              {saleActive && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
              <span className={`text-sm font-medium ${saleActive ? "text-red-600" : ""}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</span>
            </div>
            {releaseLabel && <p className="text-[11px] text-indigo-600">{releaseLabel}</p>}
          </div>
          <CartButton style={cartBtnStyle} label={cartBtnLabel} bg={cartBtnBg} color={cartBtnColor} btnRadius={btnRadius} onClick={handleAddToCart} />
        </div>
      ) : (
        <div className="mt-3 space-y-1">
          <h3 className={`text-base leading-tight ${hMeta.twClass}`}
            style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.category}</p>
            <div className="flex items-center gap-1.5">
              {saleActive && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
              <span className={`text-sm font-medium ${saleActive ? "text-red-600" : ""}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</span>
            </div>
          </div>
          {releaseLabel && <p className="text-[11px] font-medium text-indigo-600">{releaseLabel}</p>}
          {onAddToCart && cartBtnStyle && !isOOS && (
            <div className="pt-1.5">
              <CartButton style={cartBtnStyle} label={cartBtnLabel} bg={cartBtnBg} color={cartBtnColor} btnRadius={btnRadius} onClick={handleAddToCart} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Variant: minimal ──────────────────────────────────────────────────────────
// Ultra-clean — image, name, price only. No category. Very airy.
function MinimalInner({ product, radius, isPortrait, saleActive, isPreorder, releaseLabel, displayPrice, isOOS, hoverImage, hMeta, titleStyle, priceStyle, imageStyle }: CardInnerProps) {
  return (
    <>
      <div className={`relative overflow-hidden bg-muted ${radius} ${isPortrait ? "aspect-[3/4]" : "aspect-square"}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isOOS && !isPreorder ? "opacity-50" : ""}`}
          style={imageStyle} />
        {hoverImage && (
          <img src={hoverImage} alt="" loading="lazy" decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${isOOS && !isPreorder ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`} />
        )}
        {isOOS && !isPreorder && <OOSOverlay />}
        {statusBadge(isPreorder, saleActive)}
      </div>
      <div className="mt-2.5 space-y-0.5">
        <h3 className={`text-sm leading-snug ${hMeta.twClass}`}
          style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
        <div className="flex items-center gap-1.5">
          {saleActive && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
          <span className={`text-xs ${saleActive ? "text-red-600 font-medium" : "text-muted-foreground"}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</span>
        </div>
        {releaseLabel && <p className="text-[11px] font-medium text-indigo-600">{releaseLabel}</p>}
      </div>
    </>
  );
}

// ── Variant: overlay ─────────────────────────────────────────────────────────
// Image fills full card, gradient overlay at bottom, text + cart inside
function OverlayInner({ product, radius, isPortrait, saleActive, isPreorder, displayPrice, isOOS, hoverImage, hMeta, titleStyle, priceStyle, onAddToCart, cartBtnStyle, cartBtnBg, cartBtnColor, cartBtnLabel, btnRadius, handleAddToCart }: CardInnerProps) {
  return (
    <div className={`relative overflow-hidden ${radius} ${isPortrait ? "aspect-[3/4]" : "aspect-square"}`}>
      <img src={product.image} alt={product.name} loading="lazy" decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isOOS && !isPreorder ? "opacity-60" : ""}`} />
      {hoverImage && (
        <img src={hoverImage} alt="" loading="lazy" decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700 opacity-0 group-hover:opacity-100" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      {statusBadge(isPreorder, saleActive)}
      {isOOS && !isPreorder && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <span className="rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-800">Out of Stock</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`text-white text-sm font-semibold leading-tight truncate ${hMeta.twClass}`}
              style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              {saleActive && <span className="text-xs text-white/60 line-through">{formatPrice(product.price)}</span>}
              <span className={`text-sm font-bold ${saleActive ? "text-red-300" : "text-white"}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</span>
            </div>
            {isPreorder && <p className="text-[11px] font-medium text-white/80">Preorder — payable now, ships on release</p>}
          </div>
          {onAddToCart && cartBtnStyle && !isOOS && (
            <CartButton style={cartBtnStyle} label={cartBtnLabel} bg={cartBtnBg} color={cartBtnColor} btnRadius={btnRadius} onClick={handleAddToCart} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Variant: horizontal ───────────────────────────────────────────────────────
// Image left 40%, text right 60% — good for list/editorial views
function HorizontalInner({ product, radius, saleActive, isPreorder, releaseLabel, displayPrice, isOOS, hMeta, titleStyle, priceStyle, imageStyle, onAddToCart, cartBtnStyle, cartBtnBg, cartBtnColor, cartBtnLabel, btnRadius, handleAddToCart }: CardInnerProps) {
  return (
    <div className="flex gap-3.5 items-start">
      <div className={`relative shrink-0 w-28 aspect-square overflow-hidden bg-secondary ${radius}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOOS && !isPreorder ? "opacity-60" : ""}`}
          style={imageStyle} />
        {isOOS && !isPreorder && <OOSOverlay />}
        {statusBadge(isPreorder, saleActive)}
      </div>
      <div className="flex-1 min-w-0 py-0.5 space-y-1.5">
        <h3 className={`text-sm font-semibold leading-snug ${hMeta.twClass}`}
          style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.category}</p>
        <div className="flex items-center gap-1.5">
          {saleActive && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
          <span className={`text-sm font-semibold ${saleActive ? "text-red-600" : ""}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</span>
        </div>
        {releaseLabel && <p className="text-[11px] font-medium text-indigo-600">{releaseLabel}</p>}
        {isOOS && !isPreorder ? (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Out of stock</span>
        ) : onAddToCart && cartBtnStyle ? (
          <CartButton style={cartBtnStyle} label={cartBtnLabel} bg={cartBtnBg} color={cartBtnColor} btnRadius={btnRadius} onClick={handleAddToCart} />
        ) : null}
      </div>
    </div>
  );
}

// ── Variant: bordered ────────────────────────────────────────────────────────
// Card box with border + subtle shadow, image top, padded text section below
function BorderedInner({ product, radius, btnRadius, isPortrait, saleActive, isPreorder, releaseLabel, displayPrice, isOOS, hoverImage, hMeta, titleStyle, priceStyle, imageStyle, onAddToCart, cartBtnStyle, cartBtnBg, cartBtnColor, cartBtnLabel, handleAddToCart }: CardInnerProps) {
  return (
    <div className={`border border-border bg-card shadow-sm overflow-hidden transition-shadow duration-300 group-hover:shadow-md ${radius}`}>
      <div className={`relative overflow-hidden bg-secondary ${isPortrait ? "aspect-[3/4]" : "aspect-square"}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${hoverImage ? "group-hover:opacity-0" : "group-hover:scale-105"} ${isOOS && !isPreorder ? "opacity-50" : ""}`}
          style={imageStyle} />
        {hoverImage && (
          <img src={hoverImage} alt="" loading="lazy" decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        )}
        {isOOS && !isPreorder && <OOSOverlay />}
        {statusBadge(isPreorder, saleActive)}
      </div>
      <div className="px-3.5 py-3 space-y-1.5">
        <h3 className={`text-sm font-semibold leading-snug ${hMeta.twClass}`}
          style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{product.category}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {saleActive && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
            <span className={`text-sm font-bold ${saleActive ? "text-red-600" : ""}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</span>
          </div>
        </div>
        {releaseLabel && <p className="text-[11px] font-medium text-indigo-600">{releaseLabel}</p>}
        {onAddToCart && cartBtnStyle && !isOOS && (
          <div className="pt-1">
            <CartButton style={cartBtnStyle} label={cartBtnLabel} bg={cartBtnBg} color={cartBtnColor} btnRadius={btnRadius} onClick={handleAddToCart} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Variant: floating ────────────────────────────────────────────────────────
// Full-width image, strong shadow card below — boutique/luxury feel
function FloatingInner({ product, radius, btnRadius, isPortrait, saleActive, isPreorder, releaseLabel, displayPrice, isOOS, hoverImage, hMeta, titleStyle, priceStyle, imageStyle, onAddToCart, cartBtnStyle, cartBtnBg, cartBtnColor, cartBtnLabel, handleAddToCart }: CardInnerProps) {
  return (
    <>
      <div className={`relative overflow-hidden bg-secondary ${radius} ${isPortrait ? "aspect-[3/4]" : "aspect-square"}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isOOS && !isPreorder ? "opacity-50" : ""}`}
          style={imageStyle} />
        {hoverImage && (
          <img src={hoverImage} alt="" loading="lazy" decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        )}
        {isOOS && !isPreorder && <OOSOverlay />}
        {statusBadge(isPreorder, saleActive)}
      </div>
      <div className={`mx-2 -mt-4 relative z-10 bg-card border border-border rounded-xl shadow-lg shadow-black/10 px-4 py-3 space-y-1.5 transition-shadow duration-300 group-hover:shadow-xl`}>
        <h3 className={`text-sm font-semibold leading-snug truncate ${hMeta.twClass}`}
          style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.category}</p>
          <div className="flex items-center gap-1.5">
            {saleActive && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>}
            <span className={`text-sm font-bold ${saleActive ? "text-red-600" : ""}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</span>
          </div>
        </div>
        {releaseLabel && <p className="text-[11px] font-medium text-indigo-600">{releaseLabel}</p>}
        {onAddToCart && cartBtnStyle && !isOOS && (
          <div className="pt-0.5">
            <CartButton style={cartBtnStyle} label={cartBtnLabel} bg={cartBtnBg} color={cartBtnColor} btnRadius={btnRadius} onClick={handleAddToCart} />
          </div>
        )}
      </div>
    </>
  );
}

// ── Variant: editorial ───────────────────────────────────────────────────────
// Wide landscape image (4:3), large bold name, minimal text — magazine feel
function EditorialInner({ product, radius, btnRadius, saleActive, isPreorder, displayPrice, isOOS, hoverImage, hMeta, titleStyle, priceStyle, imageStyle, onAddToCart, cartBtnStyle, cartBtnBg, cartBtnColor, cartBtnLabel, handleAddToCart }: CardInnerProps) {
  return (
    <div className={`relative overflow-hidden ${radius} aspect-[4/3]`}>
      <img src={product.image} alt={product.name} loading="lazy" decoding="async"
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isOOS && !isPreorder ? "opacity-60" : ""}`}
        style={imageStyle} />
      {hoverImage && (
        <img src={hoverImage} alt="" loading="lazy" decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      {statusBadge(isPreorder, saleActive)}
      {isOOS && !isPreorder && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <span className="rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-800">Out of Stock</span>
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-5 z-10">
        <p className="mb-1 text-[10px] uppercase tracking-widest text-white/60">{product.category}</p>
        <div className="flex items-end justify-between gap-3">
          <h3 className={`text-xl font-bold text-white leading-tight max-w-[70%] ${hMeta.twClass}`}
            style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
          <div className="shrink-0 text-right">
            {saleActive && <p className="text-xs text-white/50 line-through">{formatPrice(product.price)}</p>}
            <p className={`text-lg font-bold ${saleActive ? "text-red-300" : "text-white"}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</p>
            {isPreorder && <p className="text-[11px] font-medium text-white/80">Preorder now</p>}
            {onAddToCart && cartBtnStyle && !isOOS && (
              <div className="mt-1.5">
                <CartButton style={cartBtnStyle} label={cartBtnLabel} bg={cartBtnBg} color={cartBtnColor} btnRadius={btnRadius} onClick={handleAddToCart} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Variant: chip ────────────────────────────────────────────────────────────
// Compact square card — image, name (1 line), price — for dense grids
function ChipInner({ product, radius, saleActive, isPreorder, displayPrice, isOOS, hMeta, titleStyle, priceStyle, imageStyle }: CardInnerProps) {
  return (
    <>
      <div className={`relative overflow-hidden bg-secondary aspect-square ${radius}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOOS && !isPreorder ? "opacity-50" : ""}`}
          style={imageStyle} />
        {!isOOS && statusBadge(isPreorder, saleActive)}
        {isOOS && !isPreorder && <OOSOverlay />}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className={`text-xs font-semibold truncate leading-tight ${hMeta.twClass}`}
          style={{ ...(hMeta.family ? { fontFamily: hMeta.family } : {}), ...titleStyle }}>{product.name}</h3>
        <div className="mt-0.5 flex items-center gap-1">
          {saleActive && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.price)}</span>}
          <span className={`text-[11px] font-semibold ${saleActive ? "text-red-600" : "text-foreground"}`} style={saleActive ? undefined : priceStyle}>{formatPrice(displayPrice)}</span>
        </div>
        {isPreorder && <p className="text-[10px] font-medium text-indigo-600">Preorder</p>}
      </div>
    </>
  );
}

// ── Main ProductCard ──────────────────────────────────────────────────────────

export function ProductCard({
  product,
  linkOverride,
  variant = "classic",
  cardStyle,
  titleStyle,
  priceStyle,
  imageStyle,
  onAddToCart,
  cartBtnStyle,
  cartBtnBg,
  cartBtnColor,
  cartBtnLabel,
  cartBtnLayout = "below",
}: {
  product: Product;
  linkOverride?: string;
  variant?: ProductCardVariant;
  cardStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  priceStyle?: React.CSSProperties;
  imageStyle?: React.CSSProperties;
  onAddToCart?: (product: Product) => void;
  cartBtnStyle?: CartBtnStyle;
  cartBtnBg?: string;
  cartBtnColor?: string;
  cartBtnLabel?: string;
  cartBtnLayout?: "below" | "right";
}) {
  const tokens = useDesignTokens();
  const radius = radiusMap[tokens.cardRadius ?? "md"];
  const isPortrait = (tokens.productImageRatio ?? "portrait") === "portrait";
  const saleActive = useSaleActive((product as any).saleEndsAt);
  const hMeta = HEADING_FONT_META[tokens.fontHeading ?? "serif"] ?? HEADING_FONT_META.serif;
  const displayPrice = saleActive && (product as any).salePrice
    ? parseFloat((product as any).salePrice) : product.price;
  const btnRadius =
    tokens.buttonShape === "square" ? "rounded-none" :
    tokens.buttonShape === "rounded" ? "rounded-md" : "rounded-full";
  const isOOS = (product as any).stock === 0;
  const isPreorder = (product as any).preorder === true;
  const canPurchase = !isOOS || isPreorder;
  const releaseLabel = isPreorder && (product as any).preorderReleaseDate
    ? `Ships ${new Date((product as any).preorderReleaseDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
    : undefined;
  const hoverImage: string | undefined = (product as any).images?.[0] ?? undefined;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (canPurchase) onAddToCart?.(product);
  };

  const innerProps: CardInnerProps = {
    product, cardStyle, titleStyle, priceStyle, imageStyle,
    onAddToCart, cartBtnStyle, cartBtnBg, cartBtnColor, cartBtnLabel, cartBtnLayout,
    radius, btnRadius, isPortrait, saleActive, isPreorder, releaseLabel, displayPrice, isOOS, hoverImage, hMeta,
    handleAddToCart,
  };

  const variantInner: Record<ProductCardVariant, React.ReactNode> = {
    classic: <ClassicInner {...innerProps} />,
    minimal: <MinimalInner {...innerProps} />,
    overlay: <OverlayInner {...innerProps} />,
    horizontal: <HorizontalInner {...innerProps} />,
    bordered: <BorderedInner {...innerProps} />,
    floating: <FloatingInner {...innerProps} />,
    editorial: <EditorialInner {...innerProps} />,
    chip: <ChipInner {...innerProps} />,
  };

  const inner = variantInner[variant] ?? variantInner.classic;

  const blockClass = variant === "overlay" || variant === "editorial"
    ? "group block"
    : variant === "horizontal"
    ? "group block"
    : "group block";

  if (linkOverride) {
    return <a href={linkOverride} className={blockClass} style={cardStyle}>{inner}</a>;
  }
  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className={blockClass} style={cardStyle}>
      {inner}
    </Link>
  );
}
