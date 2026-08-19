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
  const logoH = footer.logoHeight ?? 32;

  // The footer has no font override of its own — it follows the store-wide
  // Typography setting (same fonts as every section), the way it should.
  const hMeta = HEADING_FONT_META[tokens.fontHeading ?? "serif"] ?? HEADING_FONT_META.serif;
  const bMeta = BODY_FONT_META[tokens.fontBody ?? "inherit"] ?? BODY_FONT_META["inherit"];
  const headingStyle: CSSProperties = hMeta.family ? { fontFamily: hMeta.family } : {};
  const bodyStyle: CSSProperties = bMeta.family ? { fontFamily: bMeta.family } : {};

  return (
    <footer className="mt-24 border-t border-border">
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
                <p className={`text-xl font-semibold ${alignClass}`} style={headingStyle}>{footer.brand}</p>
              )}
            </div>
            {footer.tagline && (
              <p className={`mt-2 text-sm text-muted-foreground ${alignClass}`} style={bodyStyle}>{footer.tagline}</p>
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
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title={s.platform}
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
            {/* Fallback: legacy showSocial without socialLinks array */}
            {footer.showSocial && (!footer.socialLinks || footer.socialLinks.length === 0) && (
              <div className={`mt-4 flex gap-3 text-xs text-muted-foreground ${flexClass}`}>
                <a href="#" className="hover:text-foreground">Instagram</a>
                <a href="#" className="hover:text-foreground">Twitter</a>
                <a href="#" className="hover:text-foreground">Pinterest</a>
              </div>
            )}
          </div>

          {/* Link columns */}
          {footer.columns.map((c, i) => (
            <div key={i}>
              <p className={`text-sm font-semibold ${alignClass}`} style={headingStyle}>{c.title}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground" style={bodyStyle}>
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a href={l.href} className={`hover:text-foreground ${alignClass} block`}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        <div className={`mx-auto max-w-7xl px-6 py-4 text-xs text-muted-foreground ${alignClass}`} style={bodyStyle}>
          © {new Date().getFullYear()} {footer.brand}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
