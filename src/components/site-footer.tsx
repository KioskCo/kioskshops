import type { CSSProperties } from "react";
import { useStorefront, useDesignTokens, HEADING_FONT_META, BODY_FONT_META, type FooterSocialPlatform } from "@/lib/storefront";
import {
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  Pinterest,
  Snapchat,
} from "react-bootstrap-icons";

function SocialIcon({ platform }: { platform: FooterSocialPlatform }) {
  switch (platform) {
    case "instagram": return <Instagram size={15} />;
    case "twitter": return <Twitter size={15} />;
    case "facebook": return <Facebook size={15} />;
    case "youtube": return <Youtube size={15} />;
    case "linkedin": return <Linkedin size={15} />;
    case "pinterest": return <Pinterest size={15} />;
    case "snapchat": return <Snapchat size={15} />;
    case "tiktok": return <span className="text-[13px] font-bold leading-none">TK</span>;
    case "whatsapp": return <span className="text-[13px] font-bold leading-none">WA</span>;
    default: return null;
  }
}

export function SiteFooter() {
  const { footer } = useStorefront();
  const tokens = useDesignTokens();
  const align = footer.textAlign ?? "left";
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  const flexClass = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  const logoMode = footer.logoMode ?? "text";
  const logoH = footer.logoHeight ?? 40;

  const hMeta = HEADING_FONT_META[tokens.fontHeading ?? "serif"] ?? HEADING_FONT_META.serif;
  const bMeta = BODY_FONT_META[tokens.fontBody ?? "inherit"] ?? BODY_FONT_META["inherit"];
  const bodyStyle: CSSProperties = bMeta.family ? { fontFamily: bMeta.family } : {};

  // Brand name can override the store-wide heading font (footer.brandFont);
  // everything else (column titles, etc.) keeps following the global one.
  const brandFontKey = footer.brandFont ?? tokens.fontHeading ?? "serif";
  const brandMeta = HEADING_FONT_META[brandFontKey] ?? hMeta;
  const brandStyle: CSSProperties = brandMeta.family ? { fontFamily: brandMeta.family } : {};
  const headingStyle: CSSProperties = hMeta.family ? { fontFamily: hMeta.family } : {};

  // Visual style variant — mirrors the navbar's navbarStyle so footer and
  // navbar can match or contrast on purpose.
  const footerStyle = footer.footerStyle ?? "default";
  const footerClass = [
    "mt-24",
    footerStyle === "transparent" ? "border-t-0 bg-transparent" :
    footerStyle === "minimal"     ? "border-t-0 bg-background" :
    footerStyle === "bordered"    ? "border-t-2 border-foreground bg-background" :
    footerStyle === "filled"      ? "border-t-0" :
    "border-t border-border",
  ].join(" ");
  const footerStyleObj: CSSProperties | undefined =
    footerStyle === "filled" ? { backgroundColor: footer.footerBg ?? "#111111", color: "#ffffff" }
    : footer.footerBg ? { backgroundColor: footer.footerBg }
    : undefined;
  const textOverride = footerStyle === "filled" ? "text-white" : "";
  const mutedClass = textOverride ? "text-white/70" : "text-muted-foreground";
  const bottomBorderClass = footerStyle === "transparent" || footerStyle === "minimal" || footerStyle === "filled"
    ? "border-t-0"
    : textOverride ? "border-t border-white/10" : "border-t border-border";

  return (
    <footer className={footerClass} style={footerStyleObj}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            {/* Logo + brand name */}
            <div className={`flex items-center gap-1 ${flexClass}`}>
              {(logoMode === "logo" || logoMode === "both") && footer.logoImage && (
                <img
                  src={footer.logoImage}
                  alt={footer.brand}
                  style={{ height: `${logoH}px` }}
                  className="object-contain"
                />
              )}
              {(logoMode === "text" || logoMode === "both" || !footer.logoMode) && (
                <p className={`text-xl font-semibold ${alignClass}`} style={brandStyle}>{footer.brand}</p>
              )}
            </div>
            {footer.tagline && (
              <p className={`mt-2 text-sm ${mutedClass} ${alignClass}`} style={bodyStyle}>{footer.tagline}</p>
            )}

            {/* CTA buttons */}
            {footer.ctaButtons && footer.ctaButtons.length > 0 && (
              <div className={`mt-4 flex flex-wrap gap-2 ${flexClass}`}>
                {footer.ctaButtons.map((btn, i) => {
                  const cls =
                    btn.style === "solid"
                      ? "rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                      : btn.style === "outline"
                      ? "rounded-lg border px-4 py-2 text-sm font-semibold hover:opacity-80 transition-colors"
                      : "rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-70";
                  const sty =
                    btn.style === "solid"
                      ? { backgroundColor: btn.btnBg ?? "var(--accent)", color: btn.btnColor ?? "#fff" }
                      : btn.style === "outline"
                      ? { borderColor: btn.btnBg ?? "var(--accent)", color: btn.btnColor ?? "var(--accent)" }
                      : { color: btn.btnColor ?? "inherit" };
                  return (
                    <a key={i} href={btn.href} className={cls} style={sty}>
                      {btn.label}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Social links */}
            {footer.showSocial && footer.socialLinks && footer.socialLinks.length > 0 && (
              <div className={`mt-4 flex flex-wrap gap-2 ${flexClass}`}>
                {footer.socialLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${textOverride ? "bg-white/10 text-white/70 hover:text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                    title={s.platform}
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
            {/* Fallback: legacy showSocial without socialLinks array */}
            {footer.showSocial && (!footer.socialLinks || footer.socialLinks.length === 0) && (
              <div className={`mt-4 flex gap-3 text-xs ${mutedClass} ${flexClass}`}>
                <a href="#" className={textOverride ? "hover:text-white" : "hover:text-foreground"}>Instagram</a>
                <a href="#" className={textOverride ? "hover:text-white" : "hover:text-foreground"}>Twitter</a>
                <a href="#" className={textOverride ? "hover:text-white" : "hover:text-foreground"}>Pinterest</a>
              </div>
            )}
          </div>

          {/* Link columns */}
          {footer.columns.map((c, i) => (
            <div key={i}>
              <p className={`text-sm font-semibold ${alignClass}`} style={headingStyle}>{c.title}</p>
              <ul className={`mt-3 space-y-2 text-sm ${mutedClass}`} style={bodyStyle}>
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a href={l.href} className={`${textOverride ? "hover:text-white" : "hover:text-foreground"} ${alignClass} block`}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={bottomBorderClass}>
        <div className={`mx-auto max-w-7xl px-6 py-4 text-xs ${mutedClass} ${alignClass}`} style={bodyStyle}>
          © {new Date().getFullYear()} {footer.brand}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
