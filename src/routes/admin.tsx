import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, useCallback, type ReactNode } from "react";
import {
  AlignCenter, AlignLeft, AlignRight,
  ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, ChevronDown, ChevronRight,
  ChevronLeft, Columns2, Copy, CreditCard, Download, Edit2, Eye, FileText,
  GripVertical, Image, Layers, Layout, List, LogOut, Minus, Monitor, Moon, Palette, Play,
  Plus, Redo2, RotateCcw, Send, Settings, ShoppingBag, Smartphone, Square, Sun,
  Tablet, Tag, Timer, Trash2, Type, Undo2, Upload, X,
} from "lucide-react";
import {
  ArrowLeft as BsArrowLeft, ArrowRight as BsArrowRight, ArrowUp as BsArrowUp, ArrowDown as BsArrowDown,
  ChevronRight as BsChevronRight, ChevronDown as BsChevronDown, ChevronLeft as BsChevronLeft,
  BoxArrowUpRight, Star, StarFill, Heart, HeartFill, Bag, BagPlus, Cart3,
  Check, CheckCircle, CheckCircleFill, XCircle, InfoCircle, ExclamationCircle, QuestionCircle,
  Lightning, Fire, Gift, Award, Trophy, Diamond, Stars, BellFill, ShareFill, BookmarkFill,
  House, Search as BsSearch, Envelope, Telephone, GeoAlt, Globe, Link45deg,
  PlayCircle, Camera as BsCamera, MusicNote, Box, Truck as BsTruck, Tag as BsTag, Percent,
  Person, PersonCircle, People, Lock as BsLock, Shield as BsShield, Key as BsKey,
  Sun as BsSun, Moon as BsMoon, Cup, HandThumbsUp, ChatDots, ArrowRepeat,
  Instagram, Twitter, Facebook, Whatsapp, Youtube, Tiktok, Linkedin, Pinterest,
  Grid, LayoutTextWindow, CreditCard2Front, ThreeDotsVertical, XLg,
  Gem as Crown,
} from "react-bootstrap-icons";
import {
  SECTION_LABELS, SECTION_VARIANTS, SECTION_PRESETS, useStorefront, useLinkOptions, useDesignTokens, getPageUrl,
  createDefaultBlock,
  type Align9, type NavbarLogoMode, type Padding, type Page, type Section, type SectionType, type PaymentProvider, type DesignTokens,
  type FontHeading, type FontBody, type NavbarSearchStyle,
  type CustomSection, type Block, type BlockType, type CardBlock, type GroupBlock, type LayoutBoxBlock,
} from "@/lib/storefront";
import { useVendorProducts } from "@/lib/vendorProducts";
import { SectionRenderer, BlockRenderer } from "@/components/sections";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { products } from "@/lib/products";
import { getToken, getStoredUser, clearSession, publishTemplate, launchTemplate, fetchTemplates, devLogin, type EditorUser, type DbTemplate } from "@/lib/shopAuth";
import flutterwaveLogo from "@/assets/flutterwave.png";
import paystackLogo from "@/assets/paystack.png";

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): { studio?: boolean } => ({
    studio: s.studio === true || s.studio === "1" || s.studio === "true" ? true : undefined,
  }),
  head: () => ({ meta: [{ title: "Editor — Kiosk" }, { name: "robots", content: "noindex" }] }),
  component: AdminGate,
});

function AdminGate() {
  const navigate = useNavigate();
  const { importJson, reset } = useStorefront();
  const [user, setUser] = useState<EditorUser | null>(null);
  const [dbTemplate, setDbTemplate] = useState<DbTemplate | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // In dev, auto-login so you can go straight to /admin without touching the login page
    if (import.meta.env.DEV && !getToken()) devLogin();

    const token = getToken();
    if (!token) { navigate({ to: "/admin-login" }); return; }
    const stored = getStoredUser();
    if (!stored) { navigate({ to: "/admin-login" }); return; }
    setUser(stored);

    // Lock localStorage to this vendor's ID so another vendor's edits never bleed through
    if (stored.id) localStorage.setItem("kiosk_editor_active_vendor", stored.id);

    if (import.meta.env.DEV) { setChecking(false); return; }

    fetchTemplates().then((list) => {
      const tpl = list.find((t) => t.launched) ?? list[0] ?? null;
      setDbTemplate(tpl);
      if (tpl?.settings?.templateJson) {
        // Vendor has saved their design — load it from server (overrides any localStorage)
        importJson(tpl.settings.templateJson);
      } else {
        // New vendor or no saved design yet — reset to the clean default template.
        // This ensures they never see a previous vendor's design from localStorage.
        reset();
      }
      setChecking(false);
    }).catch(() => { reset(); setChecking(false); });
  }, []);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <Admin user={user!} dbTemplate={dbTemplate} />;
}

const ALL_TYPES: SectionType[] = [
  // Core
  "announcement", "hero", "featured-products", "shop-grid", "image-text", "rich-text", "gallery",
  "collection-list", "newsletter", "cta-banner", "text-columns", "testimonials",
  "logo-bar", "faq", "video", "spacer", "related-products", "search",
  "product-detail", "checkout-form", "contact-form", "custom-html",
  "about", "contact",
  "auth-login", "auth-signup", "buyer-orders", "buyer-referrals",
  // Layout / content
  "columns", "pricing-plans",
  // Social proof & marketing
  "reviews", "lookbook", "timeline", "before-after", "bundle-offer",
  // Rich media
  "video-hero", "social-feed", "map-location", "size-guide", "portfolio",
  // Nigerian commerce
  "whatsapp-cta", "trust-badges", "payment-methods",
  // Studio
  "custom",
];

const SECTION_GROUPS: { label: string; types: SectionType[]; icon: string; studio?: boolean }[] = [
  { label: "✦ Studio", icon: "🎨", studio: true, types: ["custom"] },
  { label: "Marketing", icon: "📢", types: ["announcement", "hero", "cta-banner", "newsletter", "testimonials", "logo-bar", "whatsapp-cta", "trust-badges"] },
  { label: "Products", icon: "🛒", types: ["featured-products", "shop-grid", "collection-list", "product-detail", "related-products", "bundle-offer", "pricing-plans"] },
  { label: "Content", icon: "✏️", types: ["image-text", "rich-text", "columns", "gallery", "text-columns", "lookbook", "portfolio", "faq", "video", "video-hero", "spacer"] },
  { label: "Social proof", icon: "⭐", types: ["reviews", "timeline", "before-after", "social-feed"] },
  { label: "Info", icon: "ℹ️", types: ["size-guide", "map-location", "payment-methods", "about", "contact"] },
  { label: "Checkout & Contact", icon: "💬", types: ["checkout-form", "contact-form", "search"] },
  { label: "Account", icon: "👤", types: ["auth-login", "auth-signup", "buyer-orders", "buyer-referrals"] },
  { label: "Advanced", icon: "🔧", types: ["custom-html"] },
];

const SELF_PADDED_TYPES = new Set<SectionType>([
  "announcement", "hero", "spacer", "newsletter", "cta-banner", "product-detail", "checkout-form", "contact-form", "shop-grid", "about", "contact",
]);

type Tab = "sections" | "pages" | "global" | "theme" | "templates" | "payments";

function Admin({ user, dbTemplate }: { user: EditorUser; dbTemplate: DbTemplate | null }) {
  const navigate = useNavigate();
  const { studio: studioMode } = Route.useSearch();
  const sf = useStorefront();
  const { sections, add, remove, move, moveTo, duplicate, update, reset, exportJson, importJson, theme, setTheme, activePage, templates, activeTemplateId } = sf;
  const [selectedId, setSelectedId] = useState<string | null>(sections[0]?.id ?? null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("sections");
  const [showAdd, setShowAdd] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [chromeSelected, setChromeSelected] = useState<"header" | "footer" | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [previewSize, setPreviewSize] = useState<"full" | "desktop" | "tablet" | "phone">("full");

  // When entering via ?studio=true (from blank template creation), auto-add a custom section and open it
  const studioBootedRef = useRef(false);
  useEffect(() => {
    if (!studioMode || studioBootedRef.current) return;
    studioBootedRef.current = true;
    const id = add("custom");
    setSelectedId(id);
    setTab("sections");
    setInspectorOpen(true);
    navigate({ to: "/admin", replace: true });
  }, [studioMode]);
  const [publishMsg, setPublishMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const selected = sections.find((s) => s.id === selectedId) ?? null;

  const handleSignOut = () => {
    clearSession();
    // Remove vendor-specific localStorage key so the next vendor starts clean
    localStorage.removeItem("kiosk_editor_active_vendor");
    navigate({ to: "/admin-login" });
  };

  const handlePublish = async () => {
    if (!dbTemplate) {
      setPublishMsg({ ok: false, text: "No store template found. Create one in the Kiosk app first." });
      return;
    }
    setPublishing(true);
    setPublishMsg(null);
    try {
      const json = exportJson();
      await publishTemplate(dbTemplate.id, json);
      const { launchUrl } = await launchTemplate(dbTemplate.id);
      setPublishMsg({ ok: true, text: launchUrl ? `Live at ${launchUrl}` : "Published successfully!" });
    } catch (err: any) {
      setPublishMsg({ ok: false, text: err.message ?? "Publish failed" });
    } finally {
      setPublishing(false);
    }
  };

  const selectChrome = (which: "header" | "footer") => {
    setChromeSelected(which);
    setSelectedId(null);
    setSelectedBlockId(null);
    setInspectorOpen(true);
    // Do NOT change the left panel tab — keep whatever was active
  };

  // Keyboard undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && !e.shiftKey && e.key === "z") { e.preventDefault(); if (sf.canUndo) sf.undo(); }
      if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); if (sf.canRedo) sf.redo(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [sf.canUndo, sf.canRedo, sf.undo, sf.redo]);

  const handleExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `storefront-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const handleImport = (file: File) => {
    const r = new FileReader();
    r.onload = () => { if (!importJson(String(r.result))) alert("Invalid storefront JSON."); };
    r.readAsText(file);
  };

  useEffect(() => { setSelectedBlockId(null); }, [selectedId]);
  const openInspector = (id: string) => { setSelectedId(id); setInspectorOpen(true); };

  return (
    <div className="flex h-screen flex-col overflow-hidden border-t border-border bg-secondary/40">
      {/* Top toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold">Editor</p>
          <span className="hidden text-xs text-muted-foreground md:inline">· {activePage?.name}</span>
          {user.businessName && (
            <span className="hidden rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground md:inline">
              {user.businessName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 md:gap-1.5">
          {/* Undo / Redo */}
          <button onClick={() => sf.undo()} disabled={!sf.canUndo} title="Undo (Ctrl+Z)"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-secondary disabled:opacity-30">
            <Undo2 className="h-3.5 w-3.5" /><span className="hidden md:inline">Undo</span>
          </button>
          <button onClick={() => sf.redo()} disabled={!sf.canRedo} title="Redo (Ctrl+Y)"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-secondary disabled:opacity-30">
            <Redo2 className="h-3.5 w-3.5" /><span className="hidden md:inline">Redo</span>
          </button>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2 text-xs hover:bg-secondary">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          <button onClick={() => importRef.current?.click()} className="hidden h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs hover:bg-secondary md:inline-flex">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
          <button onClick={handleExport} className="hidden h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs hover:bg-secondary md:inline-flex">
            <Download className="h-3.5 w-3.5" /> Export JSON
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{publishing ? "Publishing…" : "Publish"}</span>
          </button>
          <button onClick={handleSignOut} title="Sign out" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Publish feedback banner */}
      {publishMsg && (
        <div className={`flex shrink-0 items-center justify-between gap-3 px-4 py-2 text-xs ${publishMsg.ok ? "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"}`}>
          <span>{publishMsg.ok ? "✓ " : "✕ "}{publishMsg.text}</span>
          <button onClick={() => setPublishMsg(null)} className="shrink-0 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-background px-2 py-1.5">
        {([
          { id: "sections", label: "Sections", icon: Layers },
          { id: "pages", label: "Pages", icon: FileText },
          { id: "global", label: "Navbar & Footer", icon: Layout },
          { id: "theme", label: "Theme", icon: Palette },
          { id: "templates", label: "Templates", icon: Settings },
          { id: "payments", label: "Payments", icon: CreditCard },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-xs ${tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[300px_1fr_360px]">
        {/* Left panel — desktop */}
        <aside className="hidden overflow-hidden border-r border-border bg-background lg:flex lg:flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <LeftPanel
                tab={tab}
                selectedId={selectedId}
                selectedSection={selected}
                onSelect={(id) => { setSelectedId(id); if (!id) setSelectedBlockId(null); }}
                onAdd={() => setShowAdd(true)}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onSectionChange={(patch) => { if (selectedId) update(selectedId, patch); }}
              />
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-border p-3">
            <button onClick={reset} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-xs hover:bg-secondary">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-xs hover:bg-secondary">
              <Eye className="h-3.5 w-3.5" /> View
            </a>
            <Link to="/templates" className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-xs hover:bg-secondary">
              <Settings className="h-3.5 w-3.5" /> Templates
            </Link>
          </div>
        </aside>

        {/* Mobile: left panel strip above preview */}
        <div className="border-b border-border bg-background lg:hidden">
          <div className="max-h-[40vh] overflow-y-auto">
            <LeftPanel
              tab={tab}
              selectedId={selectedId}
              selectedSection={selected}
              onSelect={(id) => { if (id) openInspector(id); else setSelectedId(null); if (!id) setSelectedBlockId(null); }}
              onAdd={() => setShowAdd(true)}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onSectionChange={(patch) => { if (selectedId) update(selectedId, patch); }}
            />
          </div>
        </div>

        {/* Center preview */}
        <div
          className="flex flex-col overflow-hidden bg-secondary/30"
          onClickCapture={(e) => {
            const link = (e.target as HTMLElement).closest("a");
            if (link) e.preventDefault();
          }}
        >
          {/* Preview toolbar — screen size switcher */}
          <div className="shrink-0 flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-1.5">
            <span className="text-[11px] text-muted-foreground">Live preview · click any section to edit</span>
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/30 p-0.5">
              {([
                { id: "full",    label: "Full",    Icon: Layout,     w: "" },
                { id: "desktop", label: "Desktop", Icon: Monitor,    w: "1280px" },
                { id: "tablet",  label: "Tablet",  Icon: Tablet,     w: "768px" },
                { id: "phone",   label: "Phone",   Icon: Smartphone, w: "375px" },
              ] as const).map(({ id, label, Icon, w }) => (
                <button
                  key={id}
                  onClick={() => setPreviewSize(id)}
                  title={w ? `${label} (${w})` : label}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all ${previewSize === id ? "bg-background shadow-sm text-foreground" : "hover:bg-background/70 text-muted-foreground"}`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{label}</span>
                  {w && <span className="hidden lg:inline text-[9px] opacity-60">{w}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable canvas area */}
          <div className="flex-1 overflow-y-auto">
            <div
              className="mx-auto bg-background transition-all duration-300"
              style={{
                maxWidth: previewSize === "phone" ? 375 : previewSize === "tablet" ? 768 : previewSize === "desktop" ? 1280 : "100%",
                boxShadow: previewSize !== "full" ? "0 0 0 1px hsl(var(--border)), 0 4px 32px rgba(0,0,0,0.1)" : undefined,
                minHeight: "100%",
              }}
            >
              {/* Header — click to edit navbar */}
              <div
                onClick={() => { if (!selectedId) selectChrome("header"); }}
                title="Click to edit Navbar"
                className={`group relative transition-opacity ${selectedId ? "opacity-40 pointer-events-none" : "cursor-pointer"} ${chromeSelected === "header" ? "outline outline-2 -outline-offset-2 outline-accent" : "hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-accent/40"}`}
              >
                <div className="pointer-events-none select-none">
                  <SiteHeader />
                </div>
                {chromeSelected !== "header" && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white">Edit Navbar</span>
                  </div>
                )}
              </div>

              {/* Page sections */}
              <div>
                {sections.map((s) => {
                  const isCustom = s.type === "custom";
                  const isActiveStudio = isCustom && s.id === selectedId;
                  // Lock other sections while any section is being actively edited
                  const studioActive = selectedId !== null;
                  const isLocked = studioActive && s.id !== selectedId;
                  return (
                    <div
                      key={s.id}
                      onClick={(e) => {
                        if (isLocked) return; // blocked while editing another section
                        if (isActiveStudio && e.currentTarget !== e.target) return; // block clicks handled by StudioCanvas
                        setChromeSelected(null);
                        if (s.id !== selectedId) {
                          openInspector(s.id);
                          if (isCustom) setTab("sections");
                        }
                      }}
                      className={`relative transition-opacity ${isLocked ? "opacity-40 cursor-not-allowed" : isActiveStudio ? "cursor-default" : "cursor-pointer"} ${selectedId === s.id ? "outline outline-2 -outline-offset-2 outline-accent" : isLocked ? "" : "hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-accent/40"}`}
                    >
                      {/* Custom sections always render in StudioCanvas for visual consistency */}
                      {isCustom ? (
                        <StudioCanvas
                          section={s as unknown as CustomSection}
                          selectedBlockId={isActiveStudio ? selectedBlockId : null}
                          onSelectBlock={isActiveStudio ? setSelectedBlockId : () => {}}
                          onChange={(patch) => update(s.id, patch)}
                          active={isActiveStudio}
                        />
                      ) : (
                        <SectionRenderer section={s} />
                      )}
                    </div>
                  );
                })}
                {sections.length === 0 && (
                  <div className="p-12 text-center text-sm text-muted-foreground">
                    This page is empty. Add a section from the left panel.
                  </div>
                )}
              </div>

              {/* Footer — click to edit footer */}
              <div
                onClick={() => { if (!selectedId) selectChrome("footer"); }}
                title="Click to edit Footer"
                className={`group relative transition-opacity ${selectedId ? "opacity-40 pointer-events-none" : "cursor-pointer"} ${chromeSelected === "footer" ? "outline outline-2 -outline-offset-2 outline-accent" : "hover:outline hover:outline-2 hover:-outline-offset-2 hover:outline-accent/40"}`}
              >
                <div className="pointer-events-none select-none">
                  <SiteFooter />
                </div>
                {chromeSelected !== "footer" && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white">Edit Footer</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right inspector (desktop) */}
        <aside className="admin-panel-scroll hidden overflow-y-auto border-l border-border bg-background lg:block">
          {chromeSelected === "header" ? (
            <NavbarInspector />
          ) : chromeSelected === "footer" ? (
            <FooterInspector />
          ) : selected ? (
            <Inspector section={selected} onChange={(patch) => update(selected.id, patch)} selectedBlockId={selectedBlockId} onSelectBlock={setSelectedBlockId} />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">Click any section or block in the preview to edit it.</div>
          )}
        </aside>
      </div>

      {/* Mobile inspector sheet */}
      {inspectorOpen && (selected || chromeSelected) && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden" onClick={() => setInspectorOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative max-h-[75vh] overflow-y-auto rounded-t-xl bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <p className="text-sm font-semibold">
                {chromeSelected === "header" ? "Navbar" : chromeSelected === "footer" ? "Footer" : selected ? SECTION_LABELS[selected.type] : ""}
              </p>
              <button onClick={() => setInspectorOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            {chromeSelected === "header" ? <NavbarInspector /> : chromeSelected === "footer" ? <FooterInspector /> : selected ? <Inspector section={selected} onChange={(patch) => update(selected.id, patch)} selectedBlockId={selectedBlockId} onSelectBlock={setSelectedBlockId} /> : null}
          </div>
        </div>
      )}

      {/* Add section modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-xl rounded-2xl bg-background shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="font-semibold">Add section</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Choose a section type to add to this page</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="rounded-full p-1.5 hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-5">
              {SECTION_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-base leading-none">{group.icon}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${group.studio ? "text-primary" : "text-muted-foreground"}`}>{group.label}</span>
                    {group.studio && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">New</span>}
                  </div>
                  {group.studio ? (
                    <button
                      onClick={() => { const id = add("custom"); setSelectedId(id); setShowAdd(false); setTab("sections"); }}
                      className="group relative w-full overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-4 text-left hover:border-primary/50 hover:from-primary/10 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Section Studio</p>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">Build any layout from scratch — text, images, buttons, videos, forms, countdowns, and more.</p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.types.map((t) => (
                        <button key={t}
                          onClick={() => { const id = add(t); setSelectedId(id); setShowAdd(false); setTab("sections"); }}
                          className="rounded-lg border border-border px-3 py-2.5 text-left text-sm hover:border-primary/50 hover:bg-secondary/60 transition-all group"
                        >
                          <span className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">{SECTION_LABELS[t]}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Left panel ---------- */

function LeftPanel({
  tab, selectedId, selectedSection, onSelect, onAdd,
  selectedBlockId, onSelectBlock, onSectionChange,
}: {
  tab: Tab;
  selectedId: string | null;
  selectedSection: import("@/lib/storefront").Section | null;
  onSelect: (id: string | null) => void;
  onAdd: () => void;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onSectionChange: (patch: any) => void;
}) {
  if (tab === "sections" && selectedSection?.type === "custom") {
    return (
      <StudioPanel
        section={selectedSection as CustomSection}
        onChange={onSectionChange}
        selectedBlockId={selectedBlockId}
        onSelectBlock={onSelectBlock}
        onBack={() => onSelect(null)}
      />
    );
  }
  if (tab === "sections") return <SectionsPanel selectedId={selectedId} onSelect={onSelect as (id: string) => void} onAdd={onAdd} />;
  if (tab === "pages") return <PagesPanel />;
  if (tab === "global") return <GlobalPanel />;
  if (tab === "theme") return <ThemePanel />;
  if (tab === "templates") return <TemplatesPanel />;
  if (tab === "payments") return <PaymentsPanel />;
  return null;
}

/* ---------- Studio: block type icons ---------- */

const BLOCK_ICONS: Partial<Record<string, React.ElementType>> = {
  text: Type, button: Square, image: Image, icon: StarFill,
  video: Play, slideshow: Layers, "product-embed": ShoppingBag,
  accordion: FileText, countdown: Timer, form: Send,
  row: Columns2, spacer: AlignCenter, divider: Minus,
  badge: Tag, list: List, card: CreditCard, group: Layers, "layout-box": Layout,
};

/* ---------- Studio: left panel ---------- */

function StudioPanel({
  section, onChange, selectedBlockId, onSelectBlock, onBack,
}: {
  section: CustomSection;
  onChange: (patch: Partial<CustomSection>) => void;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onBack: () => void;
}) {
  const [showPresets, setShowPresets] = useState(false);
  const [lastPresetIds, setLastPresetIds] = useState<string[] | null>(null);

  const addBlock = (type: BlockType) => {
    const block = createDefaultBlock(type);
    onChange({ blocks: [...section.blocks, block] });
    onSelectBlock(block.id);
    setLastPresetIds(null); // clear preset tracking when adding individual blocks
  };

  const deleteBlock = (blockId: string) => {
    onChange({ blocks: section.blocks.filter((b) => b.id !== blockId) });
    if (selectedBlockId === blockId) onSelectBlock(null);
    if (lastPresetIds?.includes(blockId)) setLastPresetIds((ids) => ids?.filter((id) => id !== blockId) ?? null);
  };

  const moveBlock = (from: number, delta: -1 | 1) => {
    const to = from + delta;
    if (to < 0 || to >= section.blocks.length) return;
    const next = [...section.blocks];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ blocks: next });
  };

  const removeLastPreset = () => {
    if (!lastPresetIds) return;
    onChange({ blocks: section.blocks.filter((b) => !lastPresetIds.includes(b.id)) });
    if (selectedBlockId && lastPresetIds.includes(selectedBlockId)) onSelectBlock(null);
    setLastPresetIds(null);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Studio header */}
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={onBack}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            title="Back to sections"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            value={section.label ?? ""}
            onChange={(e) => onChange({ label: e.target.value || undefined })}
            placeholder="Section name…"
            className="flex-1 min-w-0 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Section Studio</p>
      </div>

      {/* Block list */}
      <div className="shrink-0 px-3 pt-3 pb-1 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          Blocks{section.blocks.length > 0 ? ` (${section.blocks.length})` : ""}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-1 admin-panel-scroll min-h-0">
        {section.blocks.length === 0 ? (
          <div className="mx-1 rounded-xl border border-dashed border-border py-5 text-center">
            <p className="text-[11px] text-muted-foreground">No blocks yet</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">Pick a type below to add one</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {section.blocks.map((block, i) => {
              const BlockIcon = BLOCK_ICONS[block.type] ?? Type;
              const isSelected = block.id === selectedBlockId;
              return (
                <div
                  key={block.id}
                  onClick={() => onSelectBlock(block.id)}
                  className={`group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 ring-1 ring-primary/25 text-primary"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <BlockIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span className="flex-1 min-w-0 text-xs font-medium truncate">
                    {BLOCK_TYPE_LABELS[block.type as BlockType] ?? block.type}
                    {block.type === "text" && (block as any).content ? (
                      <span className="ml-1 text-[10px] font-normal opacity-50 truncate">
                        — {((block as any).content as string).slice(0, 16)}
                      </span>
                    ) : null}
                  </span>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveBlock(i, -1); }}
                      disabled={i === 0}
                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-border disabled:opacity-25"
                      title="Move up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveBlock(i, 1); }}
                      disabled={i === section.blocks.length - 1}
                      className="flex h-5 w-5 items-center justify-center rounded hover:bg-border disabled:opacity-25"
                      title="Move down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                      className="flex h-5 w-5 items-center justify-center rounded text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add block palette */}
      <div className="shrink-0 border-t border-border px-2 pt-3 pb-2">
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Add block</p>
        <div className="grid grid-cols-4 gap-1">
          {BLOCK_TYPE_OPTIONS.map(({ type, label }) => {
            const BlockIcon = BLOCK_ICONS[type] ?? Type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                title={label}
                className="flex flex-col items-center gap-1 rounded-xl border border-border py-2.5 px-1 text-center hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
              >
                <BlockIcon className="h-4 w-4" />
                <span className="text-[9px] text-muted-foreground leading-tight">{label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset layouts (collapsible) */}
      <div className="shrink-0 border-t border-border px-2 pb-2 pt-2">
        <div className="flex items-center justify-between mb-0.5">
          <button
            type="button"
            onClick={() => setShowPresets((v) => !v)}
            className="flex flex-1 items-center justify-between rounded-lg px-2.5 py-2 text-[11px] font-medium hover:bg-secondary transition-colors"
          >
            <span>Preset layouts</span>
            <BsChevronDown size={10} className={`transition-transform ${showPresets ? "rotate-180" : ""}`} />
          </button>
        </div>
        {lastPresetIds && lastPresetIds.length > 0 && (
          <button
            type="button"
            onClick={removeLastPreset}
            className="flex w-full items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/5 px-2.5 py-1.5 text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors mt-1"
          >
            <Trash2 className="h-3 w-3" /> Remove last preset ({lastPresetIds.length} blocks)
          </button>
        )}
        {showPresets && (
          <div className="mt-1 space-y-1 max-h-48 overflow-y-auto admin-panel-scroll">
            {SECTION_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => {
                  const presetBlocks = preset.create();
                  // Wrap multi-block presets in a group for easy management
                  const groupId = Math.random().toString(36).slice(2, 10);
                  const grouped: Block = presetBlocks.length > 1
                    ? { id: groupId, type: "group", label: preset.label, children: presetBlocks, direction: "column", gap: "md", align: "start" } as GroupBlock
                    : presetBlocks[0];
                  onChange({ blocks: [...section.blocks, grouped] });
                  setLastPresetIds([grouped.id]);
                  setShowPresets(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <span className="text-sm">{preset.icon}</span>
                <div>
                  <p className="text-[11px] font-semibold">{preset.label}</p>
                  <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionsPanel({ selectedId, onSelect, onAdd }: { selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void }) {
  const { sections, move, moveTo, duplicate, remove, activePage, pages, setActivePageId, addPage } = useStorefront();
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // Scroll selected section into view whenever selection changes
  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const derivedSlug = newPageSlug.trim()
    ? (newPageSlug.trim().startsWith("/") ? newPageSlug.trim() : `/${newPageSlug.trim()}`)
    : newPageName.trim()
      ? `/${newPageName.trim().toLowerCase().replace(/\s+/g, "-")}`
      : "";

  const handleNewPage = () => {
    if (!newPageName.trim()) return;
    addPage(newPageName.trim(), newPageSlug.trim() || newPageName.trim().toLowerCase().replace(/\s+/g, "-"));
    setNewPageName("");
    setNewPageSlug("");
    setShowNewPage(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border p-3">
        <div className="mb-2 flex items-center gap-1">
          <select value={activePage.id} onChange={(e) => setActivePageId(e.target.value)} className={`${inputCls} flex-1`}>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {getPageUrl(p.slug)}</option>
            ))}
          </select>
          <button onClick={() => setShowNewPage((v) => !v)} title="New page" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border hover:bg-secondary">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {showNewPage && (
          <div className="mb-2 space-y-1.5">
            <input value={newPageName} onChange={(e) => setNewPageName(e.target.value)} placeholder="Page name" className={inputCls} onKeyDown={(e) => e.key === "Enter" && handleNewPage()} autoFocus />
            <input value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} placeholder="URL (leave blank to auto-generate)" className={inputCls} onKeyDown={(e) => e.key === "Enter" && handleNewPage()} />
            {derivedSlug && (
              <p className="font-mono text-[10px] text-muted-foreground">URL: <span className="text-foreground">{derivedSlug}</span></p>
            )}
            <div className="flex gap-1">
              <button onClick={handleNewPage} className="flex-1 inline-flex h-9 items-center justify-center rounded-md bg-primary px-2.5 text-xs text-primary-foreground hover:opacity-90">Add page</button>
              <button onClick={() => { setShowNewPage(false); setNewPageName(""); setNewPageSlug(""); }} className="inline-flex h-9 items-center rounded-md border border-border px-2.5 text-xs hover:bg-secondary">Cancel</button>
            </div>
          </div>
        )}
        <button onClick={onAdd} className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md bg-primary px-2.5 text-xs text-primary-foreground hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Add section
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {sections.map((s, i) => (
          <div key={s.id} ref={s.id === selectedId ? selectedItemRef : undefined} onClick={() => onSelect(s.id)}
            className={`group mb-1 flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition-all ${
              selectedId === s.id
                ? "border-primary/30 bg-primary/5 shadow-sm"
                : "border-transparent hover:border-border hover:bg-secondary/60"
            }`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.type === "custom" ? "bg-primary" : s.type === "hero" ? "bg-violet-500" : s.type.includes("product") ? "bg-blue-500" : "bg-muted-foreground/40"}`} />
            <span className="flex-1 truncate text-sm font-medium">{(s as any).label && s.type === "custom" ? (s as any).label : SECTION_LABELS[s.type]}</span>
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button title="Move up" onClick={(e) => { e.stopPropagation(); move(s.id, -1); }} disabled={i === 0} className="rounded p-1 hover:bg-secondary disabled:opacity-25"><ArrowUp className="h-3 w-3" /></button>
              <button title="Move down" onClick={(e) => { e.stopPropagation(); move(s.id, 1); }} disabled={i === sections.length - 1} className="rounded p-1 hover:bg-secondary disabled:opacity-25"><ArrowDown className="h-3 w-3" /></button>
              <button title="Duplicate" onClick={(e) => { e.stopPropagation(); duplicate(s.id); }} className="rounded p-1 hover:bg-secondary"><Copy className="h-3 w-3" /></button>
              <button title="Delete" onClick={(e) => { e.stopPropagation(); remove(s.id); }} className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="mx-2 mt-4 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-xs font-medium text-muted-foreground">No sections yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">Click "Add section" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PagesPanel() {
  const { pages, addPage, deletePage, updatePage, setActivePageId, activePage } = useStorefront();
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const startEdit = (p: Page) => { setEditingId(p.id); setEditName(p.name); setEditSlug(p.slug); };
  const saveEdit = (id: string) => {
    const raw = editSlug.trim();
    const normSlug = !raw || raw === "/" ? "/" : raw.startsWith("/") ? raw : `/${raw}`;
    updatePage(id, { name: editName.trim() || "Untitled", slug: normSlug });
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    addPage(newName.trim(), newSlug.trim());
    setNewName(""); setNewSlug("");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* New page form */}
      <div className="shrink-0 space-y-2 border-b border-border p-3">
        <p className="text-xs font-medium text-muted-foreground">New page</p>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Page name" className={inputCls} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
        <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="/url-path  (e.g. /about)" className={inputCls} onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
        <button onClick={handleCreate}
          className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md bg-primary px-2.5 text-xs text-primary-foreground hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> Create page
        </button>
        <p className="text-[10px] text-muted-foreground">Enter a URL like <code>/about</code>, <code>/contact</code>, or a dynamic route like <code>/product/:slug</code>. Added to navbar automatically.</p>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto p-2">
        {pages.map((p) => (
          <div key={p.id} className={`mb-1 rounded-md p-2.5 ${activePage.id === p.id ? "bg-secondary" : "hover:bg-secondary/60"}`}>
            {editingId === p.id ? (
              <div className="space-y-1.5">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Page name" className={inputCls} autoFocus />
                <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} placeholder="/url-path" className={inputCls}
                  disabled={p.slug === "/"} onKeyDown={(e) => e.key === "Enter" && saveEdit(p.id)} />
                {p.slug.includes(":") && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">Dynamic route — /:param segments are auto-filled from the URL.</p>
                )}
                <div className="flex gap-1">
                  <button onClick={() => saveEdit(p.id)} className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs text-primary-foreground hover:opacity-90">Save</button>
                  <button onClick={() => setEditingId(null)} className="rounded-md border border-border px-2 py-1.5 text-xs hover:bg-secondary">Cancel</button>
                </div>
              </div>
            ) : (() => {
              const isDynamic = p.slug.includes(":");
              return (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                    {isDynamic && (
                      <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">Dynamic</span>
                    )}
                    <button onClick={() => startEdit(p)} title="Rename / change URL" className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><Edit2 className="h-3 w-3" /></button>
                    <button onClick={() => setActivePageId(p.id)} className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[10px] hover:bg-secondary">Sections</button>
                    {pages.length > 1 && p.slug !== "/" && (
                      <button onClick={() => { if (confirm(`Delete "${p.name}"?`)) deletePage(p.id); }} className="shrink-0 rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></button>
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground" title={isDynamic ? "Dynamic route — :param segments are filled from the URL" : ""}>
                    {p.slug}
                  </p>
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* URL + dynamic route guide */}
      <div className="shrink-0 border-t border-border bg-secondary/40 p-3 text-[10px] text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">How URLs work</p>
        <p>Use a plain path like <code>/about</code> or <code>/contact</code> for static pages. Sections you add show up at that URL.</p>
        <p className="font-medium text-foreground pt-0.5">Dynamic pages (e.g. product detail)</p>
        <p>Use <code>:param</code> in the URL to create a dynamic route. Examples:</p>
        <ul className="space-y-0.5 pl-2">
          <li><code>/product/:slug</code> — one template for every product page</li>
          <li><code>/blog/:post</code> — one template for every blog post</li>
          <li><code>/category/:id</code> — one template per category</li>
        </ul>
        <p>Add a <strong>Product detail</strong> section to a dynamic page and it will auto-detect which product to display from the URL.</p>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon?: React.ElementType; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-secondary/30 px-3 py-2 text-left hover:bg-secondary/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/80">{title}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="space-y-3 p-3">{children}</div>}
    </div>
  );
}

function NavbarInspector() {
  const { navbar, updateNavbar, referrals, updateReferrals } = useStorefront();
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground"><Layout className="h-3.5 w-3.5" /></span>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 leading-none mb-0.5">Editing</p>
          <h3 className="text-sm font-semibold">Navbar</h3>
        </div>
      </div>

      <CollapsibleSection title="Branding" icon={Image}>
        <Field label="Brand name"><TextInput value={navbar.brand} onChange={(e) => updateNavbar({ brand: e.target.value })} /></Field>
        <Field label="Logo image"><ImageInput value={navbar.logoImage ?? ""} onChange={(v) => updateNavbar({ logoImage: v || undefined })} /></Field>
        <Field label="Logo display">
          <select value={navbar.logoMode ?? "text"} onChange={(e) => updateNavbar({ logoMode: e.target.value as NavbarLogoMode })} className={inputCls}>
            <option value="text">Text only</option>
            <option value="logo">Logo image only</option>
            <option value="both">Logo + text</option>
          </select>
        </Field>
        {(navbar.logoMode === "logo" || navbar.logoMode === "both") && navbar.logoImage && (
          <Field label={`Logo height: ${navbar.logoHeight ?? 28}px`}>
            <StyledSlider min={16} max={64} value={navbar.logoHeight ?? 28} onChange={(v) => updateNavbar({ logoHeight: v })} />
          </Field>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Navigation links">
        <div className="space-y-1.5">
          {navbar.links.map((l, i) => (
            <div key={i} className="flex gap-1">
              <input value={l.label} onChange={(e) => updateNavbar({ links: navbar.links.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} placeholder="Label" className={inputCls} />
              <input value={l.href} onChange={(e) => updateNavbar({ links: navbar.links.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} placeholder="/path" className={inputCls} />
              <button onClick={() => updateNavbar({ links: navbar.links.filter((_, j) => j !== i) })} className="rounded-md border border-border px-2"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button onClick={() => updateNavbar({ links: [...navbar.links, { label: "New", href: "/" }] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
            <Plus className="h-3.5 w-3.5" /> Add link
          </button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Options & Features">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2"><input type="checkbox" checked={navbar.showSearch} onChange={(e) => updateNavbar({ showSearch: e.target.checked })} /> Search</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={navbar.showCart} onChange={(e) => updateNavbar({ showCart: e.target.checked })} /> Cart</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={navbar.showThemeToggle} onChange={(e) => updateNavbar({ showThemeToggle: e.target.checked })} /> Theme toggle</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={navbar.sticky} onChange={(e) => updateNavbar({ sticky: e.target.checked })} /> Sticky</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={navbar.showProfileIcon} onChange={(e) => updateNavbar({ showProfileIcon: e.target.checked })} /> Profile icon</label>
        </div>
        {navbar.showSearch && (
          <Field label="Search style">
            <select value={navbar.searchStyle ?? "dropdown"} onChange={(e) => updateNavbar({ searchStyle: e.target.value as NavbarSearchStyle })} className={inputCls}>
              <option value="dropdown">Dropdown</option>
              <option value="expand">Expand inline</option>
              <option value="slide">Slide from top</option>
              <option value="overlay">Full overlay</option>
              <option value="drawer">Side drawer</option>
            </select>
          </Field>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Refer & Earn" defaultOpen={false}>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={referrals?.enabled ?? false} onChange={(e) => updateReferrals?.({ enabled: e.target.checked })} />
          Enable referral programme
        </label>
        {referrals?.enabled && (
          <Field label="Reward label">
            <TextInput value={referrals?.rewardLabel ?? ""} placeholder="e.g. 10% off your next order" onChange={(e) => updateReferrals({ rewardLabel: e.target.value })} />
          </Field>
        )}
      </CollapsibleSection>
    </div>
  );
}

function FooterInspector() {
  const { footer, updateFooter } = useStorefront();
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground"><Layout className="h-3.5 w-3.5" /></span>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 leading-none mb-0.5">Editing</p>
          <h3 className="text-sm font-semibold">Footer</h3>
        </div>
      </div>

      <CollapsibleSection title="Branding" icon={Image}>
        <Field label="Brand"><TextInput value={footer.brand} onChange={(e) => updateFooter({ brand: e.target.value })} /></Field>
        <Field label="Tagline"><TextInput value={footer.tagline} onChange={(e) => updateFooter({ tagline: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={footer.showSocial} onChange={(e) => updateFooter({ showSocial: e.target.checked })} /> Show social links</label>
      </CollapsibleSection>

      <CollapsibleSection title="Footer columns">
        <div className="space-y-2">
          {footer.columns.map((c, i) => (
            <div key={i} className="space-y-1 rounded-md border border-border p-2">
              <div className="flex gap-1">
                <input value={c.title} onChange={(e) => updateFooter({ columns: footer.columns.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} className={inputCls} />
                <button onClick={() => updateFooter({ columns: footer.columns.filter((_, j) => j !== i) })} className="rounded-md border border-border px-2"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {c.links.map((l, k) => (
                <div key={k} className="flex gap-1">
                  <input value={l.label} onChange={(e) => updateFooter({ columns: footer.columns.map((x, j) => j === i ? { ...x, links: x.links.map((y, m) => m === k ? { ...y, label: e.target.value } : y) } : x) })} placeholder="Label" className={inputCls} />
                  <input value={l.href} onChange={(e) => updateFooter({ columns: footer.columns.map((x, j) => j === i ? { ...x, links: x.links.map((y, m) => m === k ? { ...y, href: e.target.value } : y) } : x) })} placeholder="/path" className={inputCls} />
                  <button onClick={() => updateFooter({ columns: footer.columns.map((x, j) => j === i ? { ...x, links: x.links.filter((_, m) => m !== k) } : x) })} className="rounded-md border border-border px-2"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              <button onClick={() => updateFooter({ columns: footer.columns.map((x, j) => j === i ? { ...x, links: [...x.links, { label: "New", href: "/" }] } : x) })} className="text-xs text-muted-foreground hover:text-foreground">+ Add link</button>
            </div>
          ))}
          <button onClick={() => updateFooter({ columns: [...footer.columns, { title: "New", links: [] }] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
            <Plus className="h-3.5 w-3.5" /> Add column
          </button>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function GlobalPanel() {
  return (
    <div className="flex-1 admin-panel-scroll overflow-y-auto">
      <NavbarInspector />
      <div className="border-t border-border" />
      <FooterInspector />
    </div>
  );
}

function ThemePanel() {
  const { theme, setTheme, designTokens, updateDesignTokens } = useStorefront();
  const dt = designTokens;

  const TokenButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`flex-1 rounded-md border px-2 py-2 text-xs ${active ? "border-primary bg-secondary font-medium" : "border-border hover:bg-secondary/50"}`}>
      {children}
    </button>
  );

  return (
    <div className="flex-1 space-y-5 admin-panel-scroll overflow-y-auto p-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colour mode</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setTheme("light")} className={`rounded-md border border-border p-3 text-sm ${theme === "light" ? "bg-secondary" : ""}`}>
            <Sun className="mx-auto h-5 w-5" /><span className="mt-1 block">Light</span>
          </button>
          <button onClick={() => setTheme("dark")} className={`rounded-md border border-border p-3 text-sm ${theme === "dark" ? "bg-secondary" : ""}`}>
            <Moon className="mx-auto h-5 w-5" /><span className="mt-1 block">Dark</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Typography</p>
        <Field label="Heading font">
          <div className="grid grid-cols-4 gap-1">
            {([
              { value: "serif",    label: "Serif",    fontFamily: "Georgia, serif" },
              { value: "sans",     label: "Sans",     fontFamily: "system-ui, sans-serif" },
              { value: "playfair", label: "Playfair", fontFamily: "'Playfair Display', Georgia, serif" },
              { value: "poppins",  label: "Poppins",  fontFamily: "'Poppins', system-ui, sans-serif" },
              { value: "dm-sans",  label: "DM Sans",  fontFamily: "'DM Sans', system-ui, sans-serif" },
              { value: "lora",     label: "Lora",     fontFamily: "'Lora', Georgia, serif" },
              { value: "raleway",  label: "Raleway",  fontFamily: "'Raleway', system-ui, sans-serif" },
              { value: "josefin",  label: "Josefin",  fontFamily: "'Josefin Sans', system-ui, sans-serif" },
            ] as { value: FontHeading; label: string; fontFamily: string }[]).map(({ value, label, fontFamily }) => (
              <button
                key={value}
                onClick={() => updateDesignTokens({ fontHeading: value })}
                className={`flex flex-col items-center gap-0.5 rounded-md border py-2 text-[10px] leading-none transition-colors ${dt.fontHeading === value ? "border-primary bg-secondary font-semibold" : "border-border hover:bg-secondary/50"}`}
              >
                <span className="text-base" style={{ fontFamily }}>Aa</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Body font">
          <div className="grid grid-cols-3 gap-1">
            {([
              { value: "inherit",  label: "Match heading" },
              { value: "sans",     label: "System sans" },
              { value: "poppins",  label: "Poppins" },
              { value: "dm-sans",  label: "DM Sans" },
              { value: "nunito",   label: "Nunito" },
              { value: "raleway",  label: "Raleway" },
            ] as { value: FontBody; label: string }[]).map(({ value, label }) => (
              <TokenButton key={value} active={(dt.fontBody ?? "inherit") === value} onClick={() => updateDesignTokens({ fontBody: value })}>
                {label}
              </TokenButton>
            ))}
          </div>
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cards &amp; Buttons</p>
        <Field label="Card corner radius">
          <div className="flex gap-1">
            {(["none", "sm", "md", "lg", "full"] as DesignTokens["cardRadius"][]).map((v) => (
              <TokenButton key={v} active={dt.cardRadius === v} onClick={() => updateDesignTokens({ cardRadius: v })}>
                {v === "none" ? "□" : v === "sm" ? "sm" : v === "md" ? "md" : v === "lg" ? "lg" : "○"}
              </TokenButton>
            ))}
          </div>
        </Field>
        <Field label="Button shape">
          <div className="flex gap-1">
            <TokenButton active={dt.buttonShape === "pill"} onClick={() => updateDesignTokens({ buttonShape: "pill" })}>Pill</TokenButton>
            <TokenButton active={dt.buttonShape === "rounded"} onClick={() => updateDesignTokens({ buttonShape: "rounded" })}>Rounded</TokenButton>
            <TokenButton active={dt.buttonShape === "square"} onClick={() => updateDesignTokens({ buttonShape: "square" })}>Square</TokenButton>
          </div>
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product images</p>
        <Field label="Image ratio">
          <div className="flex gap-1">
            <TokenButton active={dt.productImageRatio === "portrait"} onClick={() => updateDesignTokens({ productImageRatio: "portrait" })}>Portrait (3:4)</TokenButton>
            <TokenButton active={dt.productImageRatio === "square"} onClick={() => updateDesignTokens({ productImageRatio: "square" })}>Square (1:1)</TokenButton>
          </div>
        </Field>
      </div>

      <p className="text-xs text-muted-foreground">Tip: individual sections can also override colours in the inspector.</p>
    </div>
  );
}

function TemplatesPanel() {
  const { templates, activeTemplateId, applyTemplate, saveAsTemplate, duplicateTemplate, deleteTemplate, renameTemplate, patchTemplate, newTemplate, newBlankTemplate } = useStorefront();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"atelier" | "blank">("atelier");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const thumbRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleThumb = (id: string, file: File) => {
    if (file.size > 3 * 1024 * 1024) { if (!confirm("Image > 3MB. Continue?")) return; }
    const r = new FileReader();
    r.onload = () => patchTemplate(id, { thumbnail: String(r.result) });
    r.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    if (mode === "blank") newBlankTemplate(name.trim());
    else newTemplate(name.trim());
    setName("");
  };

  const deleteTargetTemplate = templates.find((t) => t.id === deleteTarget);

  return (
    <div className="flex-1 space-y-3 admin-panel-scroll overflow-y-auto p-4">
      {/* Create new template */}
      <div className="rounded-xl border border-border bg-secondary/30 p-3 space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Create template</p>
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} placeholder="Template name" className={inputCls} />
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setMode("atelier")}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${mode === "atelier" ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"}`}>
            <p className="text-xs font-semibold">From Atelier</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Pre-styled design tokens</p>
          </button>
          <button
            onClick={() => setMode("blank")}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${mode === "blank" ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"}`}>
            <p className="text-xs font-semibold">Blank Canvas</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Start from scratch</p>
          </button>
        </div>
        <button onClick={handleCreate} disabled={!name.trim()}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary text-xs text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity">
          <Plus className="h-3.5 w-3.5" /> Create template
        </button>
      </div>
      <button onClick={() => { const n = prompt("Save current as new template:"); if (n) saveAsTemplate(n); }} className="inline-flex h-8 w-full items-center justify-center rounded-md border border-border text-xs hover:bg-secondary">
        Save current as new template
      </button>
      <div className="space-y-2 pt-2">
        {templates.map((t) => (
          <div key={t.id} className={`rounded-md border p-3 ${activeTemplateId === t.id ? "border-primary bg-secondary" : "border-border"}`}>
            {/* Thumbnail row */}
            <div className="mb-2 flex items-center gap-2">
              {t.thumbnail ? (
                <img src={t.thumbnail} alt={t.name} className="h-12 w-20 rounded-md border border-border object-cover" />
              ) : (
                <div className="flex h-12 w-20 items-center justify-center rounded-md border border-dashed border-border bg-secondary text-[10px] text-muted-foreground">No image</div>
              )}
              <button type="button" onClick={() => thumbRefs.current[t.id]?.click()}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] hover:bg-secondary">
                <Upload className="h-3 w-3" /> {t.thumbnail ? "Change" : "Upload"}
              </button>
              <input ref={(el) => { thumbRefs.current[t.id] = el; }} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumb(t.id, f); e.target.value = ""; }} />
            </div>
            <div className="flex items-center gap-1">
              <input value={t.name} onChange={(e) => renameTemplate(t.id, e.target.value)} className="flex-1 bg-transparent text-sm font-medium focus:outline-none" />
              {activeTemplateId === t.id && <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">Active</span>}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{t.pages.length} page{t.pages.length === 1 ? "" : "s"} · {t.pages.reduce((a, p) => a + p.sections.length, 0)} sections</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {activeTemplateId !== t.id && <button onClick={() => applyTemplate(t.id)} className="rounded-md bg-primary px-2 py-1 text-[11px] text-primary-foreground hover:opacity-90">Apply</button>}
              <button onClick={() => duplicateTemplate(t.id)} className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-secondary">Duplicate</button>
              {templates.length > 1 && <button onClick={() => setDeleteTarget(t.id)} className="rounded-md border border-destructive px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10">Delete</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && deleteTargetTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-xs rounded-xl bg-background p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold">Delete template?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              "<span className="text-foreground">{deleteTargetTemplate.name}</span>" will be permanently removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary">Cancel</button>
              <button onClick={() => { deleteTemplate(deleteTarget); setDeleteTarget(null); }} className="rounded-md bg-destructive px-3 py-1.5 text-xs text-white hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FwLogo() {
  return <img src={flutterwaveLogo} alt="Flutterwave" className="h-9 w-9 shrink-0 rounded-lg object-contain" />;
}
function PsLogo() {
  return <img src={paystackLogo} alt="Paystack" className="h-9 w-9 shrink-0 rounded-lg object-contain" />;
}
function DemoLogo() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground text-[11px] font-medium">
      DEV
    </div>
  );
}

function PaymentsPanel() {
  const { paymentConfig, updatePaymentConfig } = useStorefront();
  const provider = paymentConfig.provider;
  const hasFW = Boolean((import.meta.env as any).VITE_FLUTTERWAVE_PUBLIC_KEY);
  const hasPS = Boolean((import.meta.env as any).VITE_PAYSTACK_PUBLIC_KEY);

  const options: { id: PaymentProvider; label: string; desc: string; logo: ReactNode; available: boolean }[] = [
    { id: "none", label: "Demo mode", desc: "No real payment. Orders are simulated for testing.", logo: <DemoLogo />, available: true },
    {
      id: "flutterwave", label: "Flutterwave", logo: <FwLogo />, available: hasFW,
      desc: hasFW ? "Ready — public key is configured via environment variable." : "Not configured. Set VITE_FLUTTERWAVE_PUBLIC_KEY in your .env file.",
    },
    {
      id: "paystack", label: "Paystack", logo: <PsLogo />, available: hasPS,
      desc: hasPS ? "Ready — public key is configured via environment variable." : "Not configured. Set VITE_PAYSTACK_PUBLIC_KEY in your .env file.",
    },
  ];

  return (
    <div className="flex-1 space-y-4 admin-panel-scroll overflow-y-auto p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Gateway</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <button key={opt.id} onClick={() => updatePaymentConfig({ provider: opt.id })}
            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${provider === opt.id ? "border-primary bg-secondary" : "border-border hover:bg-secondary/50"}`}>
            {opt.logo}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{opt.label}</span>
                {provider === opt.id && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">Active</span>}
                {!opt.available && opt.id !== "none" && <span className="rounded-full border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">Not set up</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
      {provider !== "none" && (
        <Field label="Currency">
          <select value={paymentConfig.currency ?? "USD"} onChange={(e) => updatePaymentConfig({ currency: e.target.value })} className={inputCls}>
            <option value="USD">USD — US Dollar</option>
            <option value="NGN">NGN — Nigerian Naira</option>
            <option value="GHS">GHS — Ghanaian Cedi</option>
            <option value="KES">KES — Kenyan Shilling</option>
            <option value="ZAR">ZAR — South African Rand</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </Field>
      )}
      <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How payment keys work</p>
        <p>Payment keys are set by the site operator in environment variables — not stored in shop settings. This keeps them secure and separate from shop data that customers may export.</p>
        <p className="pt-0.5 font-mono">VITE_FLUTTERWAVE_PUBLIC_KEY<br />VITE_PAYSTACK_PUBLIC_KEY</p>
      </div>
    </div>
  );
}

/* ---------- Inspector ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/80 leading-none select-none">{label}</p>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-input/70 bg-background px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 placeholder:text-muted-foreground/50";

function StyledSlider({ value, min = 0, max, step = 1, onChange, className }: {
  value: number; min?: number; max: number; step?: number; onChange: (n: number) => void; className?: string;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`admin-slider ${className ?? ""}`}
      style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${pct.toFixed(1)}%, hsl(var(--border)) ${pct.toFixed(1)}%)` }}
    />
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={inputCls} />;
}
function LinkSelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const opts = useLinkOptions();
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">— none —</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function ProductSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {products.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
    </select>
  );
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (f: File) => {
    if (f.size > 2 * 1024 * 1024) { if (!confirm("Image > 2MB. Continue?")) return; }
    const r = new FileReader();
    r.onload = () => onChange(String(r.result));
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {value && <img src={value} alt="" className="h-12 w-12 rounded-md border border-border object-cover" />}
        <button type="button" onClick={() => ref.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs hover:bg-secondary">
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
        {value && <button type="button" onClick={() => onChange("")} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <TextInput placeholder="or paste image URL" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function VideoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (f: File) => {
    if (f.size > 50 * 1024 * 1024) { if (!confirm("Video > 50MB. This will be stored as a data URL which may slow the editor. Continue?")) return; }
    const r = new FileReader();
    r.onload = () => onChange(String(r.result));
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-2">
      {value && (
        <video src={value} muted controls className="h-20 w-full rounded-md border border-border object-cover" />
      )}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs hover:bg-secondary">
          <Upload className="h-3.5 w-3.5" /> Upload video
        </button>
        {value && <button type="button" onClick={() => onChange("")} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>}
      </div>
      <input ref={ref} type="file" accept="video/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <TextInput placeholder="or paste video URL (MP4, WebM)" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorInput({ value, onChange, label }: { value?: string; onChange: (v: string) => void; label: string }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border border-border" />
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="auto" className={inputCls} />
        {value && <button onClick={() => onChange("")} className="text-xs text-muted-foreground hover:text-destructive">×</button>}
      </div>
    </Field>
  );
}

function CompactColorInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded" style={{ backgroundColor: value || "transparent" }}>
        {!value && (
          <div className="absolute inset-0" style={{ backgroundImage: "repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%)", backgroundSize: "6px 6px" }} />
        )}
        <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] leading-none text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-mono text-[10px]">{value || "—"}</p>
      </div>
      {value && (
        <button type="button" onClick={() => onChange("")} className="shrink-0 text-muted-foreground hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function Align9Grid({ value, onChange }: { value: Align9; onChange: (v: Align9) => void }) {
  const opts: Align9[] = [
    "top-left", "top-center", "top-right",
    "middle-left", "middle-center", "middle-right",
    "bottom-left", "bottom-center", "bottom-right",
  ];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-md border border-border p-1">
      {opts.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={`flex h-9 items-center justify-center rounded text-[10px] ${value === o ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
          {o.split("-").map((w) => w[0].toUpperCase()).join("")}
        </button>
      ))}
    </div>
  );
}

type StyleTarget = "section" | "heading" | "body" | "button" | "image" | "card"
  | "eyebrow" | "subheading" | "price" | "productCard" | "productTitle";

const DEFAULT_ELEMENT_TARGETS: { id: StyleTarget; label: string }[] = [
  { id: "heading", label: "Heading" },
  { id: "body",    label: "Body" },
  { id: "button",  label: "Button" },
  { id: "image",   label: "Image" },
  { id: "card",    label: "Card" },
];

const SECTION_ELEMENT_TARGETS: Partial<Record<SectionType, { id: StyleTarget; label: string }[]>> = {
  hero: [
    { id: "eyebrow",  label: "Eyebrow" },
    { id: "heading",  label: "Heading" },
    { id: "body",     label: "Body" },
    { id: "button",   label: "CTA" },
    { id: "image",    label: "Image" },
  ],
  "featured-products": [
    { id: "heading",      label: "Title" },
    { id: "subheading",   label: "Subtitle" },
    { id: "productCard",  label: "Card" },
    { id: "productTitle", label: "Prod. Title" },
    { id: "price",        label: "Price" },
    { id: "image",        label: "Prod. Image" },
  ],
  "shop-grid": [
    { id: "productCard",  label: "Card" },
    { id: "productTitle", label: "Prod. Title" },
    { id: "price",        label: "Price" },
    { id: "image",        label: "Prod. Image" },
  ],
  "related-products": [
    { id: "heading",      label: "Title" },
    { id: "productCard",  label: "Card" },
    { id: "productTitle", label: "Prod. Title" },
    { id: "price",        label: "Price" },
  ],
  search: [
    { id: "heading",      label: "Title" },
    { id: "productCard",  label: "Card" },
    { id: "productTitle", label: "Prod. Title" },
    { id: "price",        label: "Price" },
  ],
  "image-text": [
    { id: "heading", label: "Heading" },
    { id: "body",    label: "Body" },
    { id: "button",  label: "CTA" },
    { id: "image",   label: "Image" },
  ],
  "cta-banner": [
    { id: "heading", label: "Heading" },
    { id: "body",    label: "Body" },
    { id: "button",  label: "Button" },
    { id: "image",   label: "Image" },
  ],
  newsletter: [
    { id: "heading", label: "Heading" },
    { id: "body",    label: "Body" },
    { id: "button",  label: "Button" },
  ],
  "rich-text": [
    { id: "heading", label: "Heading" },
    { id: "body",    label: "Body" },
  ],
  gallery: [
    { id: "heading", label: "Heading" },
    { id: "image",   label: "Images" },
  ],
  testimonials: [
    { id: "heading", label: "Title" },
    { id: "card",    label: "Card" },
    { id: "body",    label: "Quote" },
  ],
  "text-columns": [
    { id: "heading", label: "Section Title" },
    { id: "card",    label: "Column Card" },
    { id: "body",    label: "Body" },
  ],
  "collection-list": [
    { id: "heading", label: "Title" },
    { id: "card",    label: "Item Card" },
    { id: "image",   label: "Image" },
  ],
  faq: [
    { id: "heading", label: "Heading" },
    { id: "body",    label: "Answer" },
  ],
  "logo-bar": [
    { id: "heading", label: "Heading" },
    { id: "image",   label: "Logos" },
  ],
  video: [
    { id: "heading", label: "Heading" },
  ],
  "product-detail": [
    { id: "heading", label: "Prod. Title" },
    { id: "price",   label: "Price" },
    { id: "body",    label: "Tagline" },
    { id: "button",  label: "Add to Cart" },
    { id: "image",   label: "Images" },
  ],
};

/* Dynamically compute element targets from a custom section's block types */
function getCustomSectionTargets(s: import("@/lib/storefront").CustomSection): { id: StyleTarget; label: string }[] {
  const allBlocks: import("@/lib/storefront").Block[] = [];
  function collect(blocks: import("@/lib/storefront").Block[]) {
    for (const b of blocks) {
      allBlocks.push(b);
      if (b.type === "group") collect((b as GroupBlock).children);
      if (b.type === "layout-box") collect((b as LayoutBoxBlock).children);
    }
  }
  collect(s.blocks);
  const types = new Set(allBlocks.map((b) => b.type));
  const targets: { id: StyleTarget; label: string }[] = [];
  if (types.has("text")) targets.push({ id: "body", label: "Text" });
  if (types.has("button")) targets.push({ id: "button", label: "Button" });
  if (types.has("image")) targets.push({ id: "image", label: "Image" });
  if (types.has("badge") || types.has("card")) targets.push({ id: "card", label: "Card" });
  if (targets.length === 0) {
    targets.push({ id: "body", label: "Text" }, { id: "button", label: "Button" });
  }
  return targets;
}

function CustomSectionLayoutControls({ s, on }: { s: import("@/lib/storefront").CustomSection; on: (patch: any) => void }) {
  const asSection = s as unknown as Section;
  const dynamicTargets = getCustomSectionTargets(s);
  return <LayoutControls s={asSection} on={on} extraTargets={dynamicTargets} />;
}

function LayoutControls({ s, on, extraTargets }: { s: Section; on: (patch: any) => void; extraTargets?: { id: StyleTarget; label: string }[] }) {
  const [target, setTarget] = useState<StyleTarget>("section");
  const variants = SECTION_VARIANTS[s.type];

  const elStyles = (s.elStyles ?? {}) as Record<string, React.CSSProperties>;
  const elCustomCss = (s.elCustomCss ?? {}) as Record<string, string>;
  const elIcons = (s.elIcons ?? {}) as Record<string, IconDef | undefined>;

  const patchEl = (el: string, patch: React.CSSProperties) =>
    on({ elStyles: { ...elStyles, [el]: { ...(elStyles[el] ?? {}), ...patch } } });

  const clearElKey = (el: string, key: string) => {
    const curr = { ...(elStyles[el] ?? {}) } as Record<string, unknown>;
    delete curr[key];
    on({ elStyles: { ...elStyles, [el]: Object.keys(curr).length ? curr : undefined } });
  };

  const patchElCss = (el: string, css: string) =>
    on({ elCustomCss: { ...elCustomCss, [el]: css || undefined } });

  const patchElIcon = (el: string, icon: IconDef | undefined) =>
    on({ elIcons: { ...elIcons, [el]: icon } });

  const elementTargets = extraTargets ?? SECTION_ELEMENT_TARGETS[s.type] ?? DEFAULT_ELEMENT_TARGETS;
  const TARGETS = [{ id: "section" as StyleTarget, label: "Section" }, ...elementTargets];

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-secondary/20 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10"><Layout className="h-3 w-3 text-primary" /></span>
        <p className="text-xs font-bold tracking-wide text-foreground">Layout &amp; Style</p>
      </div>

      {/* Style target tabs */}
      <div className="flex flex-wrap gap-1">
        {TARGETS.map(({ id, label }) => {
          const hasEl = id !== "section" && (
            (elStyles[id] && Object.keys(elStyles[id]).length > 0) ||
            !!elCustomCss[id]
          );
          return (
            <button key={id} type="button" onClick={() => setTarget(id)}
              className={`relative rounded-md border px-2.5 py-1 text-[11px] ${target === id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
              {label}
              {hasEl && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>

      {/* ── SECTION-LEVEL CONTROLS ── */}
      {target === "section" && <>
        {variants && (
          <Field label="Layout variant">
            <select value={s.variant ?? variants[0]} onChange={(e) => on({ variant: e.target.value })} className={inputCls}>
              {variants.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        )}

        {!SELF_PADDED_TYPES.has(s.type) && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Padding">
              <select value={s.padding ?? "md"} onChange={(e) => on({ padding: e.target.value as Padding })} className={inputCls}>
                <option value="none">None</option><option value="sm">Small</option>
                <option value="md">Medium</option><option value="lg">Large</option>
              </select>
            </Field>
            <Field label="BG preset">
              <select value={s.background ?? "default"} onChange={(e) => on({ background: e.target.value === "default" ? undefined : e.target.value })} className={inputCls}>
                <option value="default">Default</option><option value="muted">Muted</option>
                <option value="primary">Primary color</option>
              </select>
            </Field>
          </div>
        )}

        <Field label="Text size">
          <div className="flex gap-1">
            {(["sm", "md", "lg", "xl"] as const).map((sz) => (
              <button key={sz} type="button" onClick={() => on({ fontSize: sz === "md" ? undefined : sz })}
                className={`flex-1 rounded border px-2 py-1.5 text-xs ${(s.fontSize ?? "md") === sz ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
                {sz.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>

        {/* ── PADDING ── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Padding (px)</p>
          <div className="space-y-1.5">
            {([
              { key: "paddingTopPx",    label: "Top" },
              { key: "paddingBottomPx", label: "Bottom" },
              { key: "paddingLeftPx",   label: "Left" },
              { key: "paddingRightPx",  label: "Right" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-[10px] text-muted-foreground">{label}</span>
                <StyledSlider min={0} max={160} step={4} value={s[key] ?? 0} onChange={(v) => on({ [key]: v || undefined })} className="flex-1" />
                <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums">
                  {s[key] != null ? `${s[key]}px` : "—"}
                </span>
                {s[key] != null && (
                  <button type="button" onClick={() => on({ [key]: undefined })} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">These override the Padding preset above.</p>
        </div>

        {/* ── MARGIN ── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Margin (px)</p>
          <div className="space-y-1.5">
            {([
              { key: "marginTopPx",    label: "Top" },
              { key: "marginBottomPx", label: "Bottom" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-10 shrink-0 text-[10px] text-muted-foreground">{label}</span>
                <StyledSlider min={0} max={160} step={4} value={s[key] ?? 0} onChange={(v) => on({ [key]: v || undefined })} className="flex-1" />
                <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums">
                  {s[key] != null ? `${s[key]}px` : "—"}
                </span>
                {s[key] != null && (
                  <button type="button" onClick={() => on({ [key]: undefined })} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── MIN HEIGHT ── */}
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] text-muted-foreground">Min height</span>
          <StyledSlider min={0} max={800} step={20} value={s.minHeight ?? 0} onChange={(v) => on({ minHeight: v || undefined })} className="flex-1" />
          <span className="w-14 shrink-0 text-right font-mono text-[10px] tabular-nums">
            {s.minHeight ? `${s.minHeight}px` : "auto"}
          </span>
          {s.minHeight ? <button type="button" onClick={() => on({ minHeight: undefined })} className="shrink-0 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button> : null}
        </div>

        {/* ── TEXT ALIGNMENT ── */}
        <Field label="Text alignment">
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((a) => (
              <button key={a} type="button"
                onClick={() => on({ textAlign: a === s.textAlign ? undefined : a })}
                className={`flex-1 rounded border py-2 text-xs capitalize ${s.textAlign === a ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
                {a}
              </button>
            ))}
          </div>
        </Field>

        {/* ── COLORS ── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Colors</p>
          <div className="grid grid-cols-2 gap-2">
            <CompactColorInput label="Background" value={s.bgColor} onChange={(v) => on({ bgColor: v || undefined })} />
            <CompactColorInput label="Text" value={s.textColor} onChange={(v) => on({ textColor: v || undefined })} />
            <CompactColorInput label="Heading" value={s.headingColor} onChange={(v) => on({ headingColor: v || undefined })} />
            <CompactColorInput label="Accent / Buttons" value={s.accentColor} onChange={(v) => on({ accentColor: v || undefined })} />
          </div>
        </div>

        {/* ── GRADIENT ── */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Background Gradient</p>
          <div className="mb-2 flex flex-wrap gap-1">
            {([
              { label: "None",    v: "" },
              { label: "Sunset",  v: "linear-gradient(135deg,#f093fb,#f5576c)" },
              { label: "Ocean",   v: "linear-gradient(135deg,#4facfe,#00f2fe)" },
              { label: "Forest",  v: "linear-gradient(135deg,#43e97b,#38f9d7)" },
              { label: "Dusk",    v: "linear-gradient(135deg,#667eea,#764ba2)" },
              { label: "Ember",   v: "linear-gradient(135deg,#f77062,#fe5196)" },
              { label: "Slate",   v: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)" },
              { label: "Gold",    v: "linear-gradient(135deg,#f6d365,#fda085)" },
            ] as const).map(({ label, v }) => (
              <button key={label} type="button"
                onClick={() => on({ bgGradient: v || undefined })}
                className={`rounded border px-2 py-1 text-[10px] ${(s.bgGradient ?? "") === v ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}
                style={v ? { backgroundImage: v, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,.5)" } : undefined}>
                {label}
              </button>
            ))}
          </div>
          <input
            value={s.bgGradient ?? ""}
            onChange={(e) => on({ bgGradient: e.target.value || undefined })}
            placeholder='e.g. linear-gradient(135deg,#667eea,#764ba2)'
            className={`${inputCls} font-mono text-[11px]`}
          />
          {s.bgGradient && (
            <div className="mt-1.5 h-6 w-full rounded" style={{ backgroundImage: s.bgGradient }} />
          )}
        </div>

        {/* ── BACKGROUND IMAGE ── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Background Image</p>
          <ImageInput value={s.bgImage ?? ""} onChange={(v) => on({ bgImage: v || undefined })} />
          {s.bgImage && (
            <Field label={`Dark overlay: ${s.bgOpacity ?? 0}%`}>
              <StyledSlider min={0} max={100} step={5} value={s.bgOpacity ?? 0} onChange={(v) => on({ bgOpacity: v })} />
            </Field>
          )}
        </div>

        {/* ── BACKGROUND VIDEO ── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Background Video (MP4/WebM)</p>
          <input
            type="url"
            value={s.bgVideo ?? ""}
            onChange={(e) => on({ bgVideo: e.target.value || undefined })}
            placeholder="https://example.com/video.mp4"
            className={`${inputCls} font-mono text-[11px]`}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">Direct MP4 or WebM URL. Plays muted &amp; looped automatically.</p>
          {s.bgVideo && (
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={s.bgVideoMuted !== false} onChange={(e) => on({ bgVideoMuted: e.target.checked })} />
                Muted
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={s.bgVideoLoop !== false} onChange={(e) => on({ bgVideoLoop: e.target.checked })} />
                Loop
              </label>
            </div>
          )}
        </div>

        {/* ── FULL VIEWPORT ── */}
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={s.fullViewport ?? false} onChange={(e) => on({ fullViewport: e.target.checked || undefined })} />
          Full viewport height (100vh)
        </label>

        <RadiusPicker value={s.borderRadius} onChange={(v) => on({ borderRadius: v })} />
        <ShadowPicker value={s.shadow} onChange={(v) => on({ shadow: v })} />

        <Field label={`Section opacity: ${s.sectionOpacity ?? 100}%`}>
          <StyledSlider min={10} max={100} step={5} value={s.sectionOpacity ?? 100} onChange={(v) => on({ sectionOpacity: v === 100 ? undefined : v })} />
        </Field>

        {/* ── BORDERS ── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Borders</p>
          <div className="mb-2 flex gap-4 text-xs">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={s.borderTop ?? false} onChange={(e) => on({ borderTop: e.target.checked || undefined })} />
              Top
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={s.borderBottom ?? false} onChange={(e) => on({ borderBottom: e.target.checked || undefined })} />
              Bottom
            </label>
          </div>
          {(s.borderTop || s.borderBottom) && (
            <CompactColorInput label="Border color" value={s.borderColor} onChange={(v) => on({ borderColor: v || undefined })} />
          )}
        </div>

        {/* ── CUSTOM CSS ── */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Custom CSS</p>
          <p className="mb-2 text-[10px] text-muted-foreground">Any CSS property applied directly to this section's wrapper. Wins over all controls above.</p>
          <textarea
            rows={4}
            value={s.customCss ?? ""}
            onChange={(e) => on({ customCss: e.target.value || undefined })}
            placeholder={"display: flex;\ngap: 24px;\nmin-height: 400px;\njustify-content: center;"}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {s.customCss && (
            <button type="button" onClick={() => on({ customCss: undefined })}
              className="mt-1 text-[10px] text-destructive hover:underline">
              Clear custom CSS
            </button>
          )}
        </div>
      </>}

      {/* ── ELEMENT-LEVEL CONTROLS ── */}
      {target !== "section" && (
        <ElementStylePanel
          type={target}
          styles={elStyles[target]}
          customCss={elCustomCss[target]}
          patch={(p) => patchEl(target, p)}
          clear={(k) => clearElKey(target, k)}
          patchCss={(css) => patchElCss(target, css)}
          onClearAll={() => on({
            elStyles: { ...elStyles, [target]: undefined },
            elCustomCss: { ...elCustomCss, [target]: undefined },
          })}
          icon={elIcons[target]}
          onIconChange={(ic) => patchElIcon(target, ic)}
        />
      )}
    </div>
  );
}

/* ── Reusable sub-controls ── */

function RadiusPicker({ value, onChange }: { value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Corner Radius</p>
      <div className="flex gap-1.5">
        {([0, 4, 8, 16, 24, 9999] as const).map((v) => {
          const active = (value ?? 0) === v;
          const r = v >= 9999 ? "9999px" : `${v}px`;
          return (
            <button key={v} type="button" title={v >= 9999 ? "Full pill" : `${v}px`}
              onClick={() => onChange(v === 0 ? undefined : v)}
              className={`flex h-9 flex-1 items-center justify-center rounded border ${active ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/60"}`}>
              <div style={{ borderRadius: r, width: 16, height: 16, border: `2px solid ${active ? "hsl(var(--primary))" : "currentColor"}` }} />
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{(value ?? 0) >= 9999 ? "Full pill" : `${value ?? 0}px`}</p>
    </div>
  );
}

function ShadowPicker({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const opts = [
    { v: undefined, label: "None", shadow: "none" },
    { v: "sm",  label: "SM",  shadow: "0 1px 3px rgba(0,0,0,.15)" },
    { v: "md",  label: "MD",  shadow: "0 4px 12px rgba(0,0,0,.18)" },
    { v: "lg",  label: "LG",  shadow: "0 8px 24px rgba(0,0,0,.22)" },
    { v: "xl",  label: "XL",  shadow: "0 16px 48px rgba(0,0,0,.28)" },
  ] as const;
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Shadow</p>
      <div className="flex gap-1.5">
        {opts.map(({ v, label, shadow }) => {
          const active = (value ?? undefined) === v;
          return (
            <button key={label} type="button" onClick={() => onChange(v)}
              className={`flex h-9 flex-1 items-center justify-center rounded border ${active ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/60"}`}>
              <div className="h-4 w-6 rounded bg-foreground/20" style={{ boxShadow: shadow === "none" ? undefined : shadow }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PxSlider({ label, value, max = 120, step = 4, onChange, onClear }: {
  label: string; value?: number | string; max?: number; step?: number;
  onChange: (v: number) => void; onClear: () => void;
}) {
  const num = typeof value === "string" ? parseFloat(value) || 0 : (value ?? 0);
  const hasVal = value != null && value !== "" && value !== 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-[10px] text-muted-foreground">{label}</span>
      <StyledSlider min={0} max={max} step={step} value={num} onChange={onChange} className="flex-1" />
      <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums">{hasVal ? `${num}px` : "auto"}</span>
      {hasVal && (
        <button type="button" onClick={onClear} className="shrink-0 text-muted-foreground hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function ElColorRow({ label, value, onChange, onClear }: { label: string; value?: string; onChange: (v: string) => void; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded" style={{ backgroundColor: value || "transparent" }}>
        {!value && <div className="absolute inset-0" style={{ backgroundImage: "repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%)", backgroundSize: "6px 6px" }} />}
        <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] leading-none text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-mono text-[10px]">{value || "—"}</p>
      </div>
      {value && <button type="button" onClick={onClear} className="shrink-0 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>}
    </div>
  );
}

function ToggleRow({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`flex-1 rounded border py-1.5 text-[10px] ${active ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
      {label}
    </button>
  );
}

// ── Font & icon options ───────────────────────────────────────────────────────
const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "System UI", value: "system-ui, sans-serif", google: null },
  { label: "Georgia", value: "Georgia, serif", google: null },
  { label: "Monospace", value: "'Courier New', monospace", google: null },
  { label: "Inter", value: "'Inter', system-ui, sans-serif", google: "Inter" },
  { label: "Playfair", value: "'Playfair Display', serif", google: "Playfair Display" },
  { label: "Poppins", value: "'Poppins', sans-serif", google: "Poppins" },
  { label: "Raleway", value: "'Raleway', sans-serif", google: "Raleway" },
  { label: "Josefin", value: "'Josefin Sans', sans-serif", google: "Josefin Sans" },
  { label: "DM Sans", value: "'DM Sans', sans-serif", google: "DM Sans" },
  { label: "Lora", value: "'Lora', serif", google: "Lora" },
  { label: "Merriweather", value: "'Merriweather', serif", google: "Merriweather" },
  { label: "Nunito", value: "'Nunito', sans-serif", google: "Nunito" },
  { label: "Montserrat", value: "'Montserrat', sans-serif", google: "Montserrat" },
  { label: "Oswald", value: "'Oswald', sans-serif", google: "Oswald" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif", google: "Space Grotesk" },
  { label: "Cormorant", value: "'Cormorant Garamond', serif", google: "Cormorant Garamond" },
  { label: "Dancing Script", value: "'Dancing Script', cursive", google: "Dancing Script" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif", google: "Bebas Neue" },
  { label: "Crimson Text", value: "'Crimson Text', serif", google: "Crimson Text" },
];

// Bootstrap Icons — default icon library for shops/websites
const ICON_OPTIONS = [
  "ArrowRight","ArrowLeft","ArrowUp","ArrowDown","ChevronRight","ChevronDown","ChevronLeft",
  "ExternalLink","Star","StarFill","Heart","HeartFill","Bag","BagPlus","Cart3",
  "Check","CheckCircle","Lightning","Fire","Gift","Award","Trophy","Diamond","Stars",
  "House","Search","Envelope","Telephone","GeoAlt","Globe","Link",
  "PlayCircle","Camera","MusicNote","Box","Truck","Tag","Percent",
  "Person","PersonCircle","People","Lock","Shield","Key","Sun","Moon","Cup",
] as const;

const PICKER_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  ArrowRight: BsArrowRight, ArrowLeft: BsArrowLeft, ArrowUp: BsArrowUp, ArrowDown: BsArrowDown,
  ChevronRight: BsChevronRight, ChevronDown: BsChevronDown, ChevronLeft: BsChevronLeft,
  ExternalLink: BoxArrowUpRight, Star, StarFill, Heart, HeartFill, Bag, BagPlus, Cart3,
  Check, CheckCircle, Lightning, Fire, Gift, Award, Trophy, Diamond, Stars,
  House, Search: BsSearch, Envelope, Telephone, GeoAlt, Globe, Link: Link45deg,
  PlayCircle, Camera: BsCamera, MusicNote, Box, Truck: BsTruck, Tag: BsTag, Percent,
  Person, PersonCircle, People, Lock: BsLock, Shield: BsShield, Key: BsKey,
  Sun: BsSun, Moon: BsMoon, Cup,
};

function loadEditorGoogleFont(fontFamily: string | null | undefined) {
  if (!fontFamily) return;
  const id = `gef-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id; link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

type IconDef = { name: string; pos: "left" | "right"; size?: number };

function ElementStylePanel({ type, styles, customCss, patch, clear, patchCss, onClearAll, icon, onIconChange }: {
  type: Exclude<StyleTarget, "section">;
  styles?: React.CSSProperties;
  customCss?: string;
  patch: (p: React.CSSProperties) => void;
  clear: (k: string) => void;
  patchCss: (css: string) => void;
  onClearAll: () => void;
  icon?: IconDef;
  onIconChange?: (icon: IconDef | undefined) => void;
}) {
  const st = styles ?? {} as Record<string, string | number | undefined>;
  const v = (k: string) => (st as Record<string, string | number | undefined>)[k];

  const weightBtns = [["300","Thin"],["400","Regular"],["500","Medium"],["600","Semi"],["700","Bold"],["900","Black"]] as const;
  const spacingBtns = [["tight","Tight"],["normal","Normal"],["wide","Wide"],["wider","Wider"]] as const;
  const lsMap: Record<string, string> = { tight: "-0.03em", normal: "0em", wide: "0.06em", wider: "0.12em" };
  const lhBtns = [["1.2","Tight"],["1.5","Normal"],["1.75","Relaxed"],["2","Loose"]] as const;
  const sizeBtns = [["0.75rem","XS"],["0.875rem","SM"],["1rem","MD"],["1.25rem","LG"],["1.5rem","XL"],["2rem","2XL"],["3rem","3XL"]] as const;

  // Semantic groupings
  const isHeadingLike = type === "heading" || type === "productTitle" || type === "eyebrow";
  const isBodyLike = type === "body" || type === "subheading";
  const isPriceLike = type === "price";
  const isButtonLike = type === "button";
  const isImageLike = type === "image";
  const isCardLike = type === "card" || type === "productCard";
  const hasText = isHeadingLike || isBodyLike || isPriceLike || isButtonLike || isCardLike;
  const hasBg = isButtonLike || isCardLike;
  const hasFontSize = isHeadingLike || isBodyLike || isPriceLike;
  const hasFontWeight = isHeadingLike || isBodyLike || isPriceLike || isButtonLike;
  const hasLetterSpacing = isHeadingLike || isPriceLike;
  const hasTransform = isHeadingLike;
  const hasLineHeight = isBodyLike;
  const hasTextAlign = isHeadingLike || isBodyLike;
  const hasPadding = isButtonLike || isCardLike;
  const hasRadius = isImageLike || isCardLike || isButtonLike;
  const hasShadow = isCardLike;
  const hasOpacity = isImageLike;
  const hasWidth = isImageLike;
  const hasBorder = isCardLike || isImageLike || isButtonLike;

  const labelFor: Record<string, string> = {
    heading: "heading", productTitle: "product title", eyebrow: "eyebrow text",
    body: "body text", subheading: "subtitle", price: "price",
    button: "button", image: "image", card: "card", productCard: "product card",
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground">
        Overrides this section's <strong>{labelFor[type] ?? type}</strong>. Changes apply in real-time.
      </p>

      {/* ── Font family picker ── */}
      {hasText && (
        <div>
          <p className="mb-1.5 text-[10px] text-muted-foreground">Font family</p>
          <div className="flex flex-wrap gap-1">
            {FONT_OPTIONS.map(({ label, value, google }) => {
              const active = v("fontFamily") === value || (value === "" && !v("fontFamily"));
              return (
                <button key={label} type="button"
                  style={{ fontFamily: value || undefined }}
                  onClick={() => {
                    if (google) loadEditorGoogleFont(google);
                    value ? patch({ fontFamily: value }) : clear("fontFamily");
                  }}
                  className={`rounded border px-2 py-1 text-[10px] leading-none ${active ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/60"}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Icon picker for buttons and headings ── */}
      {(isButtonLike || isHeadingLike) && onIconChange && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Icon {isButtonLike ? "(CTA buttons)" : "(near heading)"}</p>
            {icon && (
              <button type="button" onClick={() => onIconChange(undefined)}
                className="text-[10px] text-destructive hover:underline">Remove</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1 rounded-md border border-border bg-background p-2">
            {ICON_OPTIONS.map((name) => {
              const active = icon?.name === name;
              const IconComp = PICKER_ICON_MAP[name];
              return (
                <button key={name} type="button" title={name}
                  onClick={() => onIconChange({ name, pos: icon?.pos ?? "right", size: icon?.size })}
                  className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-secondary/60"}`}>
                  {IconComp ? <IconComp size={16} /> : name.slice(0, 2)}
                </button>
              );
            })}
          </div>
          {icon && (
            <div className="mt-1.5 flex items-center gap-3">
              <p className="text-[10px] text-muted-foreground">Position:</p>
              {(["left", "right"] as const).map((pos) => (
                <button key={pos} type="button"
                  onClick={() => onIconChange({ ...icon, pos })}
                  className={`rounded border px-2 py-0.5 text-[10px] ${icon.pos === pos ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"}`}>
                  {pos}
                </button>
              ))}
              <p className="ml-2 text-[10px] text-muted-foreground">Size:</p>
              {([12, 14, 16, 20, 24] as const).map((sz) => (
                <button key={sz} type="button"
                  onClick={() => onIconChange({ ...icon, size: sz })}
                  className={`rounded border px-1.5 py-0.5 text-[10px] ${(icon.size ?? 16) === sz ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"}`}>
                  {sz}
                </button>
              ))}
            </div>
          )}
          {icon && <p className="mt-1 text-[10px] text-muted-foreground">Selected: <strong>{icon.name}</strong></p>}
        </div>
      )}

      {/* Text color */}
      {hasText && (
        <ElColorRow label="Text color" value={v("color") as string} onChange={(c) => patch({ color: c })} onClear={() => clear("color")} />
      )}
      {/* Background color */}
      {hasBg && (
        <ElColorRow label="Background color" value={v("backgroundColor") as string} onChange={(c) => patch({ backgroundColor: c })} onClear={() => clear("backgroundColor")} />
      )}

      {/* Font size */}
      {hasFontSize && (
        <div>
          <p className="mb-1 text-[10px] text-muted-foreground">Font size</p>
          <div className="flex flex-wrap gap-1">
            {sizeBtns.map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => v("fontSize") === val ? clear("fontSize") : patch({ fontSize: val })}
                className={`flex-1 rounded border py-1.5 text-[10px] ${v("fontSize") === val ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
                {lbl}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Current: {v("fontSize") as string || "inherited"}</p>
        </div>
      )}

      {/* Font weight */}
      {hasFontWeight && (
        <div>
          <p className="mb-1 text-[10px] text-muted-foreground">Font weight</p>
          <div className="flex gap-1">
            {weightBtns.map(([val, lbl]) => (
              <button key={val} type="button" style={{ fontWeight: val }}
                onClick={() => String(v("fontWeight")) === val ? clear("fontWeight") : patch({ fontWeight: val })}
                className={`flex-1 rounded border py-1.5 text-[10px] ${String(v("fontWeight")) === val ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Letter spacing */}
      {hasLetterSpacing && (
        <div>
          <p className="mb-1 text-[10px] text-muted-foreground">Letter spacing</p>
          <div className="flex gap-1">
            {spacingBtns.map(([val, lbl]) => (
              <button key={val} type="button"
                style={{ letterSpacing: lsMap[val] }}
                onClick={() => v("letterSpacing") === lsMap[val] ? clear("letterSpacing") : patch({ letterSpacing: lsMap[val] })}
                className={`flex-1 rounded border py-1.5 text-[10px] ${v("letterSpacing") === lsMap[val] ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text transform */}
      {hasTransform && (
        <div>
          <p className="mb-1 text-[10px] text-muted-foreground">Transform</p>
          <div className="flex gap-1">
            <ToggleRow label="Aa Normal" active={!v("textTransform") || v("textTransform") === "none"} onToggle={() => patch({ textTransform: "none" })} />
            <ToggleRow label="AA UPPER" active={v("textTransform") === "uppercase"} onToggle={() => v("textTransform") === "uppercase" ? clear("textTransform") : patch({ textTransform: "uppercase" })} />
            <ToggleRow label="aa lower" active={v("textTransform") === "lowercase"} onToggle={() => v("textTransform") === "lowercase" ? clear("textTransform") : patch({ textTransform: "lowercase" })} />
          </div>
        </div>
      )}

      {/* Line height */}
      {hasLineHeight && (
        <div>
          <p className="mb-1 text-[10px] text-muted-foreground">Line height</p>
          <div className="flex gap-1">
            {lhBtns.map(([val, lbl]) => (
              <button key={val} type="button"
                onClick={() => v("lineHeight") === val ? clear("lineHeight") : patch({ lineHeight: val })}
                className={`flex-1 rounded border py-1.5 text-[10px] ${v("lineHeight") === val ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text align */}
      {hasTextAlign && (
        <div>
          <p className="mb-1 text-[10px] text-muted-foreground">Alignment</p>
          <div className="flex gap-1">
            {(["left","center","right"] as const).map((a) => (
              <button key={a} type="button"
                onClick={() => v("textAlign") === a ? clear("textAlign") : patch({ textAlign: a })}
                className={`flex-1 rounded border py-1.5 text-[10px] capitalize ${v("textAlign") === a ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Padding */}
      {hasPadding && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">Padding</p>
          <PxSlider label="Top & Bottom" value={v("paddingTop") as string} max={60} step={2}
            onChange={(n) => patch({ paddingTop: `${n}px`, paddingBottom: `${n}px` })}
            onClear={() => { clear("paddingTop"); clear("paddingBottom"); }} />
          <PxSlider label="Left & Right" value={v("paddingLeft") as string} max={80} step={4}
            onChange={(n) => patch({ paddingLeft: `${n}px`, paddingRight: `${n}px` })}
            onClear={() => { clear("paddingLeft"); clear("paddingRight"); }} />
        </div>
      )}

      {/* Margin */}
      {isHeadingLike && (
        <PxSlider label="Margin bottom" value={v("marginBottom") as string} max={80} step={4}
          onChange={(n) => patch({ marginBottom: `${n}px` })}
          onClear={() => clear("marginBottom")} />
      )}
      {isBodyLike && (
        <PxSlider label="Margin top" value={v("marginTop") as string} max={80} step={4}
          onChange={(n) => patch({ marginTop: `${n}px` })}
          onClear={() => clear("marginTop")} />
      )}

      {/* Border radius */}
      {hasRadius && (
        <div>
          <p className="mb-2 text-[10px] text-muted-foreground">Corner radius</p>
          <div className="flex gap-1.5">
            {([0, 4, 8, 16, 24, 9999] as const).map((rv) => {
              const r = rv >= 9999 ? "9999px" : `${rv}px`;
              const active = (v("borderRadius") === r) || (rv === 0 && !v("borderRadius"));
              return (
                <button key={rv} type="button" title={rv >= 9999 ? "Full" : `${rv}px`}
                  onClick={() => rv === 0 ? clear("borderRadius") : patch({ borderRadius: r })}
                  className={`flex h-9 flex-1 items-center justify-center rounded border ${active ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/60"}`}>
                  <div style={{ borderRadius: r, width: 16, height: 16, border: `2px solid ${active ? "hsl(var(--primary))" : "currentColor"}` }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Shadow */}
      {hasShadow && (
        <ShadowPicker
          value={v("boxShadow") as string | undefined}
          onChange={(sv) => sv ? patch({ boxShadow: sv === "sm" ? "0 1px 3px rgba(0,0,0,.15)" : sv === "md" ? "0 4px 12px rgba(0,0,0,.18)" : sv === "lg" ? "0 8px 24px rgba(0,0,0,.22)" : "0 16px 48px rgba(0,0,0,.28)" }) : clear("boxShadow")}
        />
      )}

      {/* Opacity (image) */}
      {hasOpacity && (
        <Field label={`Opacity: ${Math.round(Number(v("opacity") ?? 1) * 100)}%`}>
          <StyledSlider min={0.1} max={1} step={0.05} value={Number(v("opacity") ?? 1)} onChange={(val) => val === 1 ? clear("opacity") : patch({ opacity: val })} />
        </Field>
      )}

      {/* Width (image) */}
      {hasWidth && (
        <div>
          <p className="mb-1 text-[10px] text-muted-foreground">Width</p>
          <div className="flex gap-1">
            {([["auto","Auto"],["100%","Full"],["50%","Half"],["33%","Third"]] as const).map(([val, lbl]) => (
              <button key={val} type="button"
                onClick={() => v("width") === val ? clear("width") : patch({ width: val })}
                className={`flex-1 rounded border py-1.5 text-[10px] ${v("width") === val ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Border */}
      {hasBorder && (
        <div>
          <p className="mb-1 text-[10px] text-muted-foreground">Border</p>
          <div className="flex gap-2">
            <div className="flex gap-1">
              {(["none","1px solid","2px solid","3px solid"] as const).map((bv) => {
                const bStyle = (v("borderStyle") ? `${v("borderWidth") ?? "1px"} ${v("borderStyle")}` : (v("border") as string)) ?? "none";
                const active = bv === "none" ? !v("border") && !v("borderStyle") : (v("border") === bv || `${v("borderWidth") ?? "1px"} ${v("borderStyle")}` === bv);
                return (
                  <button key={bv} type="button"
                    onClick={() => bv === "none" ? (clear("border"), clear("borderStyle"), clear("borderWidth")) : patch({ border: bv + " currentColor" })}
                    className={`rounded border px-2 py-1.5 text-[10px] ${active ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
                    {bv === "none" ? "None" : bv.split(" ")[0]}
                  </button>
                );
              })}
            </div>
            {v("border") && (
              <ElColorRow label="Color" value={v("borderColor") as string}
                onChange={(c) => { const curr = String(v("border") ?? "1px solid"); patch({ border: curr.replace(/ [^ ]+$/, ""), borderColor: c }); }}
                onClear={() => clear("borderColor")} />
            )}
          </div>
        </div>
      )}

      {/* Display / visibility */}
      <div>
        <p className="mb-1 text-[10px] text-muted-foreground">Display</p>
        <div className="flex gap-1">
          {(["block","flex","inline-flex","inline","none"] as const).map((d) => (
            <button key={d} type="button"
              onClick={() => v("display") === d ? clear("display") : patch({ display: d })}
              className={`flex-1 rounded border py-1.5 text-[10px] ${v("display") === d ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
              {d === "inline-flex" ? "i-flex" : d}
            </button>
          ))}
        </div>
        {v("display") === "flex" || v("display") === "inline-flex" ? (
          <div className="mt-1.5 space-y-1">
            <div className="flex gap-1">
              {(["row","column"] as const).map((d) => (
                <button key={d} type="button"
                  onClick={() => v("flexDirection") === d ? clear("flexDirection") : patch({ flexDirection: d })}
                  className={`flex-1 rounded border py-1 text-[10px] ${v("flexDirection") === d ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"}`}>
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(["flex-start","center","flex-end","space-between","space-around"] as const).map((j) => (
                <button key={j} type="button" title={j}
                  onClick={() => v("justifyContent") === j ? clear("justifyContent") : patch({ justifyContent: j })}
                  className={`flex-1 rounded border py-1 text-[9px] ${v("justifyContent") === j ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"}`}>
                  {j === "flex-start" ? "start" : j === "flex-end" ? "end" : j === "space-between" ? "btwn" : j === "space-around" ? "arnd" : "cntr"}
                </button>
              ))}
            </div>
            <PxSlider label="Gap" value={v("gap") as string} max={80} step={4}
              onChange={(n) => patch({ gap: `${n}px` })} onClear={() => clear("gap")} />
          </div>
        ) : null}
      </div>

      {/* Custom CSS */}
      <div>
        <p className="mb-1 text-[10px] text-muted-foreground">Custom CSS <span className="opacity-60">(wins over all controls)</span></p>
        <textarea
          rows={3}
          value={customCss ?? ""}
          onChange={(e) => patchCss(e.target.value)}
          placeholder={"font-family: Georgia;\nletter-spacing: 0.1em;\ntext-shadow: 0 1px 3px rgba(0,0,0,.3);"}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Clear all button */}
      {(Object.keys(st).length > 0 || customCss) && (
        <button type="button" onClick={onClearAll}
          className="w-full rounded-md border border-destructive/50 py-1.5 text-[11px] text-destructive hover:bg-destructive/10">
          Clear all {labelFor[type] ?? type} overrides
        </button>
      )}
    </div>
  );
}

function Inspector({ section, onChange, selectedBlockId, onSelectBlock }: {
  section: Section;
  onChange: (patch: Partial<Section>) => void;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string | null) => void;
}) {
  const displayName = section.type === "custom" && (section as any).label
    ? (section as any).label
    : SECTION_LABELS[section.type];
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-secondary/30 p-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${section.type === "custom" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
          {section.type === "custom" ? <Layers className="h-3.5 w-3.5" /> : <Layout className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 leading-none mb-0.5">Editing</p>
          <h3 className="text-sm font-semibold leading-tight truncate">{displayName}</h3>
        </div>
      </div>
      <div className="space-y-3">
        {renderFields(section, onChange, selectedBlockId, onSelectBlock)}
        {section.type === "custom" ? (
          <CustomSectionLayoutControls s={section as any} on={onChange} />
        ) : (
          <LayoutControls s={section} on={onChange} />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Custom Section Inspector
───────────────────────────────────────────────────────── */

type IconEntry = { name: string; label: string; Icon: React.ElementType };
const ICON_CATALOG: IconEntry[] = [
  // Commerce
  { name: "cart", label: "Cart", Icon: Cart3 },
  { name: "bag", label: "Bag", Icon: Bag },
  { name: "bag-plus", label: "Bag+", Icon: BagPlus },
  { name: "tag", label: "Tag", Icon: BsTag },
  { name: "percent", label: "Percent", Icon: Percent },
  { name: "truck", label: "Truck", Icon: BsTruck },
  { name: "gift", label: "Gift", Icon: Gift },
  { name: "credit-card", label: "Payment", Icon: CreditCard2Front },
  // Reactions
  { name: "heart", label: "Heart", Icon: Heart },
  { name: "heart-fill", label: "Heart ♥", Icon: HeartFill },
  { name: "star", label: "Star", Icon: Star },
  { name: "star-fill", label: "Star ★", Icon: StarFill },
  { name: "thumbs-up", label: "Thumbs up", Icon: HandThumbsUp },
  { name: "fire", label: "Fire", Icon: Fire },
  { name: "lightning", label: "Lightning", Icon: Lightning },
  // Achievements
  { name: "award", label: "Award", Icon: Award },
  { name: "trophy", label: "Trophy", Icon: Trophy },
  { name: "crown", label: "Crown", Icon: Crown },
  { name: "diamond", label: "Diamond", Icon: Diamond },
  { name: "stars", label: "Stars", Icon: Stars },
  { name: "cup", label: "Cup", Icon: Cup },
  // Status
  { name: "check", label: "Check", Icon: Check },
  { name: "check-circle", label: "Check ○", Icon: CheckCircle },
  { name: "check-circle-fill", label: "Check ●", Icon: CheckCircleFill },
  { name: "x-circle", label: "X Circle", Icon: XCircle },
  { name: "info", label: "Info", Icon: InfoCircle },
  { name: "warning", label: "Warning", Icon: ExclamationCircle },
  { name: "question", label: "Question", Icon: QuestionCircle },
  { name: "bell", label: "Bell", Icon: BellFill },
  { name: "share", label: "Share", Icon: ShareFill },
  { name: "bookmark", label: "Bookmark", Icon: BookmarkFill },
  // Navigation
  { name: "home", label: "Home", Icon: House },
  { name: "search", label: "Search", Icon: BsSearch },
  { name: "external", label: "External", Icon: BoxArrowUpRight },
  { name: "arrow-repeat", label: "Reload", Icon: ArrowRepeat },
  // Communication
  { name: "phone", label: "Phone", Icon: Telephone },
  { name: "email", label: "Email", Icon: Envelope },
  { name: "chat", label: "Chat", Icon: ChatDots },
  { name: "location", label: "Location", Icon: GeoAlt },
  { name: "globe", label: "Globe", Icon: Globe },
  { name: "link", label: "Link", Icon: Link45deg },
  // Social
  { name: "whatsapp", label: "WhatsApp", Icon: Whatsapp },
  { name: "instagram", label: "Instagram", Icon: Instagram },
  { name: "facebook", label: "Facebook", Icon: Facebook },
  { name: "twitter", label: "Twitter", Icon: Twitter },
  { name: "youtube", label: "YouTube", Icon: Youtube },
  { name: "tiktok", label: "TikTok", Icon: Tiktok },
  { name: "linkedin", label: "LinkedIn", Icon: Linkedin },
  { name: "pinterest", label: "Pinterest", Icon: Pinterest },
  // People
  { name: "person", label: "Person", Icon: Person },
  { name: "person-circle", label: "Person ○", Icon: PersonCircle },
  { name: "people", label: "People", Icon: People },
  { name: "lock", label: "Lock", Icon: BsLock },
  { name: "shield", label: "Shield", Icon: BsShield },
  { name: "key", label: "Key", Icon: BsKey },
  // Media
  { name: "play", label: "Play", Icon: PlayCircle },
  { name: "camera", label: "Camera", Icon: BsCamera },
  { name: "music", label: "Music", Icon: MusicNote },
  // General
  { name: "sun", label: "Sun", Icon: BsSun },
  { name: "moon", label: "Moon", Icon: BsMoon },
  { name: "box", label: "Box", Icon: Box },
  { name: "grid", label: "Grid", Icon: Grid },
  { name: "layout", label: "Layout", Icon: LayoutTextWindow },
  { name: "dots", label: "More", Icon: ThreeDotsVertical },
];

function IconPickerField({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = search
    ? ICON_CATALOG.filter((e) => e.name.includes(search.toLowerCase()) || e.label.toLowerCase().includes(search.toLowerCase()))
    : ICON_CATALOG;
  const current = ICON_CATALOG.find((e) => e.name === value);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-secondary transition-colors"
      >
        {current ? <current.Icon size={16} /> : <StarFill size={16} className="text-muted-foreground" />}
        <span className="flex-1 text-left truncate">{current?.label ?? value ?? "Pick icon…"}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="mt-1.5 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons…"
              className="w-full rounded-md border border-input bg-muted px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-6 gap-0.5 p-2 max-h-48 overflow-y-auto">
            {filtered.map(({ name, label, Icon }) => (
              <button
                key={name}
                type="button"
                title={label}
                onClick={() => { onChange(name); setOpen(false); setSearch(""); }}
                className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 transition-colors text-[9px] ${value === name ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}
              >
                <Icon size={16} />
                <span className="truncate w-full text-center leading-tight">{label}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="col-span-6 text-center py-3 text-xs text-muted-foreground">No icons found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: "Text", button: "Button", icon: "Icon", image: "Image",
  spacer: "Spacer", divider: "Divider", form: "Form",
  row: "Columns", video: "Video", accordion: "Accordion",
  countdown: "Countdown", slideshow: "Slideshow", "product-embed": "Product",
  badge: "Badge", list: "List", card: "Card", group: "Group", "layout-box": "Layout Box",
};

const BLOCK_TYPE_OPTIONS: { type: BlockType; label: string; description?: string }[] = [
  { type: "text", label: "Text" },
  { type: "button", label: "Button" },
  { type: "image", label: "Image" },
  { type: "card", label: "Card" },
  { type: "layout-box", label: "Layout Box", description: "Grid/columns container" },
  { type: "group", label: "Group", description: "Flex container" },
  { type: "badge", label: "Badge" },
  { type: "list", label: "List" },
  { type: "icon", label: "Icon" },
  { type: "video", label: "Video" },
  { type: "row", label: "Columns" },
  { type: "slideshow", label: "Slideshow" },
  { type: "product-embed", label: "Product" },
  { type: "accordion", label: "Accordion" },
  { type: "countdown", label: "Countdown" },
  { type: "form", label: "Form" },
  { type: "spacer", label: "Spacer" },
  { type: "divider", label: "Divider" },
];

function renderBlockFields(block: Block, onBlock: (p: Partial<Block>) => void) {
  switch (block.type) {
    case "text":
      return (<>
        <Field label="Tag">
          <select value={block.tag} onChange={(e) => onBlock({ tag: e.target.value as any })} className={inputCls}>
            <option value="h1">H1 — Large heading</option>
            <option value="h2">H2 — Section heading</option>
            <option value="h3">H3 — Subheading</option>
            <option value="h4">H4 — Small heading</option>
            <option value="p">Paragraph</option>
            <option value="span">Inline text</option>
            <option value="label">Label</option>
          </select>
        </Field>
        <Field label="Content">
          <TextArea value={block.content} onChange={(e) => onBlock({ content: e.target.value })} rows={3} />
        </Field>
      </>);

    case "button":
      return (<>
        <Field label="Button label"><TextInput value={block.label} onChange={(e) => onBlock({ label: e.target.value })} /></Field>
        <Field label="Action">
          <select
            value={block.action?.type ?? "none"}
            onChange={(e) => {
              const t = e.target.value;
              if (t === "navigate") onBlock({ action: { type: "navigate", href: "/shop" } });
              else if (t === "open-cart") onBlock({ action: { type: "open-cart" } });
              else if (t === "open-search") onBlock({ action: { type: "open-search" } });
              else if (t === "scroll-top") onBlock({ action: { type: "scroll-top" } });
              else if (t === "whatsapp") onBlock({ action: { type: "whatsapp", number: "" } });
              else onBlock({ action: { type: "none" } });
            }}
            className={inputCls}
          >
            <option value="none">No action</option>
            <option value="navigate">Go to page / URL</option>
            <option value="open-cart">Open cart</option>
            <option value="open-search">Open search</option>
            <option value="scroll-top">Scroll to top</option>
            <option value="whatsapp">Open WhatsApp</option>
          </select>
        </Field>
        {block.action?.type === "navigate" && (
          <Field label="URL">
            <TextInput value={(block.action as any).href ?? ""} onChange={(e) => onBlock({ action: { ...block.action, href: e.target.value } as any })} placeholder="/shop or https://..." />
          </Field>
        )}
        {block.action?.type === "whatsapp" && (<>
          <Field label="WhatsApp number">
            <TextInput value={(block.action as any).number ?? ""} onChange={(e) => onBlock({ action: { ...block.action, number: e.target.value } as any })} placeholder="+2348000000000" />
          </Field>
          <Field label="Pre-filled message (optional)">
            <TextInput value={(block.action as any).message ?? ""} onChange={(e) => onBlock({ action: { ...block.action, message: e.target.value || undefined } as any })} placeholder="Hi, I'd like to order..." />
          </Field>
        </>)}
      </>);

    case "icon":
      return (<>
        <Field label="Icon">
          <IconPickerField value={block.name} onChange={(name) => onBlock({ name })} />
        </Field>
        <Field label="Size (px)">
          <input type="number" value={block.size ?? 24} min={12} max={128}
            onChange={(e) => onBlock({ size: Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="Color">
          <div className="flex gap-2">
            <input type="color" value={block.color ?? "#000000"} onChange={(e) => onBlock({ color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-input" />
            <TextInput value={block.color ?? ""} onChange={(e) => onBlock({ color: e.target.value || undefined })} placeholder="inherit" />
          </div>
        </Field>
        <Field label="Action">
          <select
            value={block.action?.type ?? "none"}
            onChange={(e) => {
              const t = e.target.value;
              if (t === "open-cart") onBlock({ action: { type: "open-cart" } });
              else if (t === "open-search") onBlock({ action: { type: "open-search" } });
              else if (t === "scroll-top") onBlock({ action: { type: "scroll-top" } });
              else if (t === "navigate") onBlock({ action: { type: "navigate", href: "/" } });
              else if (t === "whatsapp") onBlock({ action: { type: "whatsapp", number: "" } });
              else onBlock({ action: { type: "none" } });
            }}
            className={inputCls}
          >
            <option value="none">No action</option>
            <option value="navigate">Go to page / URL</option>
            <option value="open-cart">Open cart</option>
            <option value="open-search">Open search</option>
            <option value="scroll-top">Scroll to top</option>
            <option value="whatsapp">Open WhatsApp</option>
          </select>
        </Field>
        {block.action?.type === "navigate" && (
          <Field label="URL">
            <TextInput value={(block.action as any).href ?? ""} onChange={(e) => onBlock({ action: { ...block.action, href: e.target.value } as any })} placeholder="/shop" />
          </Field>
        )}
        {block.action?.type === "whatsapp" && (
          <Field label="WhatsApp number">
            <TextInput value={(block.action as any).number ?? ""} onChange={(e) => onBlock({ action: { ...block.action, number: e.target.value } as any })} placeholder="+2348000000000" />
          </Field>
        )}
      </>);

    case "image":
      return (<>
        <Field label="Image"><ImageInput value={block.src} onChange={(v) => onBlock({ src: v })} /></Field>
        <Field label="Alt text"><TextInput value={block.alt ?? ""} onChange={(e) => onBlock({ alt: e.target.value || undefined })} placeholder="Describe the image" /></Field>
        <Field label="Width">
          <select value={(block.styles?.width as string ?? "100%")} onChange={(e) => onBlock({ styles: { ...block.styles, width: e.target.value } })} className={inputCls}>
            <option value="100%">Full width</option>
            <option value="75%">75%</option>
            <option value="50%">50%</option>
            <option value="400px">400px</option>
            <option value="320px">320px</option>
            <option value="auto">Auto (natural size)</option>
          </select>
        </Field>
        <Field label="Height">
          <select value={(block.styles?.height as string ?? "auto")} onChange={(e) => onBlock({ styles: { ...block.styles, height: e.target.value } })} className={inputCls}>
            <option value="auto">Auto</option>
            <option value="160px">160px</option>
            <option value="240px">240px</option>
            <option value="320px">320px</option>
            <option value="480px">480px</option>
            <option value="600px">600px</option>
          </select>
        </Field>
        <Field label="Object fit">
          <select value={(block.styles?.objectFit as string ?? "cover")} onChange={(e) => onBlock({ styles: { ...block.styles, objectFit: e.target.value as any } })} className={inputCls}>
            <option value="cover">Cover (crop to fill)</option>
            <option value="contain">Contain (show full image)</option>
            <option value="fill">Stretch to fill</option>
          </select>
        </Field>
        <Field label="Border radius">
          <select value={(block.styles?.borderRadius as string ?? "8px")} onChange={(e) => onBlock({ styles: { ...block.styles, borderRadius: e.target.value } })} className={inputCls}>
            <option value="0">None</option>
            <option value="4px">Small</option>
            <option value="8px">Medium</option>
            <option value="16px">Large</option>
            <option value="9999px">Pill / circle</option>
          </select>
        </Field>
      </>);

    case "card": {
      const cb = block as CardBlock;
      return (<>
        <Field label="Image"><ImageInput value={cb.image ?? ""} onChange={(v) => onBlock({ image: v || undefined })} /></Field>
        <Field label="Image height (px)">
          <input type="number" min={80} max={600} step={10} value={cb.imageHeight ?? 200} onChange={(e) => onBlock({ imageHeight: Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="Title"><TextInput value={cb.title ?? ""} onChange={(e) => onBlock({ title: e.target.value || undefined })} placeholder="Card title" /></Field>
        <Field label="Body text"><TextArea value={cb.body ?? ""} onChange={(e) => onBlock({ body: e.target.value || undefined })} rows={2} placeholder="Short description..." /></Field>
        <Field label="Button label"><TextInput value={cb.ctaLabel ?? ""} onChange={(e) => onBlock({ ctaLabel: e.target.value || undefined })} placeholder="e.g. Learn more" /></Field>
        {cb.ctaLabel && (
          <Field label="Button action">
            <select value={cb.ctaAction?.type ?? "none"} onChange={(e) => {
              const t = e.target.value;
              if (t === "navigate") onBlock({ ctaAction: { type: "navigate", href: "/shop" } });
              else if (t === "open-cart") onBlock({ ctaAction: { type: "open-cart" } });
              else onBlock({ ctaAction: { type: "none" } });
            }} className={inputCls}>
              <option value="none">No action</option>
              <option value="navigate">Go to page / URL</option>
              <option value="open-cart">Open cart</option>
            </select>
          </Field>
        )}
        {cb.ctaAction?.type === "navigate" && (
          <Field label="URL"><TextInput value={(cb.ctaAction as any).href ?? ""} onChange={(e) => onBlock({ ctaAction: { ...cb.ctaAction, href: e.target.value } as any })} placeholder="/shop" /></Field>
        )}
        <Field label="Style">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="mb-1 text-[10px] text-muted-foreground">Shadow</div>
              <select value={cb.shadow ?? "sm"} onChange={(e) => onBlock({ shadow: e.target.value as any })} className={inputCls}>
                <option value="none">None</option>
                <option value="sm">Soft</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[10px] text-muted-foreground">Corners</div>
              <select value={cb.radius ?? "md"} onChange={(e) => onBlock({ radius: e.target.value as any })} className={inputCls}>
                <option value="none">Sharp</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
        </Field>
        <Field label="Border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={cb.bordered !== false} onChange={(e) => onBlock({ bordered: e.target.checked })} className="rounded" />
            <span className="text-xs">Show border</span>
          </label>
        </Field>
      </>);
    }

    case "spacer":
      return (
        <Field label={`Height: ${block.height}px`}>
          <StyledSlider min={8} max={200} step={4} value={block.height} onChange={(v) => onBlock({ height: v })} />
        </Field>
      );

    case "divider":
      return (<>
        <Field label="Line style">
          <select value={block.lineStyle ?? "solid"} onChange={(e) => onBlock({ lineStyle: e.target.value as any })} className={inputCls}>
            <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
          </select>
        </Field>
        <Field label="Thickness (px)">
          <input type="number" min={1} max={8} value={block.thickness ?? 1} onChange={(e) => onBlock({ thickness: Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="Color">
          <div className="flex gap-2">
            <input type="color" value={block.color ?? "#e5e7eb"} onChange={(e) => onBlock({ color: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-input" />
            <TextInput value={block.color ?? ""} onChange={(e) => onBlock({ color: e.target.value || undefined })} placeholder="#e5e7eb" />
          </div>
        </Field>
      </>);

    case "video":
      return (<>
        <Field label="Video URL">
          <TextInput value={block.url} onChange={(e) => onBlock({ url: e.target.value })} placeholder="YouTube, Vimeo, or direct MP4 URL" />
        </Field>
        <Field label="Aspect ratio">
          <select value={block.ratio ?? "16:9"} onChange={(e) => onBlock({ ratio: e.target.value as any })} className={inputCls}>
            <option value="16:9">16:9 (landscape)</option>
            <option value="9:16">9:16 (vertical / Reels)</option>
            <option value="4:3">4:3</option>
            <option value="1:1">1:1 (square)</option>
          </select>
        </Field>
        <Field label="Caption (optional)">
          <TextInput value={block.caption ?? ""} onChange={(e) => onBlock({ caption: e.target.value || undefined })} />
        </Field>
        <div className="flex flex-col gap-2 text-xs">
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={block.autoplay ?? false} onChange={(e) => onBlock({ autoplay: e.target.checked })} /> Autoplay</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={block.muted ?? true} onChange={(e) => onBlock({ muted: e.target.checked })} /> Muted</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={block.loop ?? false} onChange={(e) => onBlock({ loop: e.target.checked })} /> Loop</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={block.controls ?? true} onChange={(e) => onBlock({ controls: e.target.checked })} /> Show controls</label>
        </div>
      </>);

    case "accordion": {
      const items = block.items ?? [];
      return (<>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-semibold flex-1">Item {i + 1}</span>
                <button onClick={() => onBlock({ items: items.filter((_, j) => j !== i) })} className="text-xs text-destructive hover:underline">Remove</button>
              </div>
              <Field label="Question / Title">
                <TextInput value={item.title} onChange={(e) => onBlock({ items: items.map((it, j) => j === i ? { ...it, title: e.target.value } : it) })} />
              </Field>
              <Field label="Answer / Body">
                <TextArea value={item.body} onChange={(e) => onBlock({ items: items.map((it, j) => j === i ? { ...it, body: e.target.value } : it) })} />
              </Field>
            </div>
          ))}
        </div>
        <button
          onClick={() => onBlock({ items: [...items, { id: `acc-${Date.now()}`, title: "New question", body: "Answer goes here." }] })}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          + Add item
        </button>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={block.allowMultiple ?? false} onChange={(e) => onBlock({ allowMultiple: e.target.checked })} />
          Allow multiple open at once
        </label>
      </>);
    }

    case "countdown":
      return (<>
        <Field label="Target date &amp; time">
          <input type="datetime-local" value={block.targetDate ? block.targetDate.slice(0, 16) : ""}
            onChange={(e) => onBlock({ targetDate: e.target.value ? new Date(e.target.value).toISOString() : "" })}
            className={inputCls} />
        </Field>
        <Field label="Label above timer (optional)"><TextInput value={block.label ?? ""} onChange={(e) => onBlock({ label: e.target.value || undefined })} placeholder="Sale ends in:" /></Field>
        <Field label="Expired message"><TextInput value={block.expiredText ?? ""} onChange={(e) => onBlock({ expiredText: e.target.value || undefined })} placeholder="Offer has ended" /></Field>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={block.showLabels !== false} onChange={(e) => onBlock({ showLabels: e.target.checked })} />
          Show Days / Hours / Min / Sec labels
        </label>
      </>);

    case "slideshow": {
      const slides = block.slides ?? [];
      return (<>
        <div className="space-y-2">
          {slides.map((slide, i) => (
            <div key={i} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-semibold flex-1">Slide {i + 1}</span>
                <button onClick={() => onBlock({ slides: slides.filter((_, j) => j !== i) })} className="text-xs text-destructive hover:underline">Remove</button>
              </div>
              <Field label="Image"><ImageInput value={slide.src} onChange={(v) => onBlock({ slides: slides.map((sl, j) => j === i ? { ...sl, src: v } : sl) })} /></Field>
              <Field label="Caption (optional)">
                <TextInput value={slide.caption ?? ""} onChange={(e) => onBlock({ slides: slides.map((sl, j) => j === i ? { ...sl, caption: e.target.value || undefined } : sl) })} />
              </Field>
              <Field label="Link (optional)">
                <TextInput value={slide.link ?? ""} onChange={(e) => onBlock({ slides: slides.map((sl, j) => j === i ? { ...sl, link: e.target.value || undefined } : sl) })} placeholder="/shop or https://..." />
              </Field>
            </div>
          ))}
        </div>
        <button
          onClick={() => onBlock({ slides: [...slides, { src: "", alt: "" }] })}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          + Add slide
        </button>
        <div className="mt-3 flex flex-col gap-2 text-xs">
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={block.autoplay !== false} onChange={(e) => onBlock({ autoplay: e.target.checked })} /> Autoplay</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={block.showDots !== false} onChange={(e) => onBlock({ showDots: e.target.checked })} /> Show dots</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={block.showArrows !== false} onChange={(e) => onBlock({ showArrows: e.target.checked })} /> Show arrows</label>
        </div>
        <Field label="Aspect ratio">
          <select value={block.ratio ?? "16:9"} onChange={(e) => onBlock({ ratio: e.target.value as any })} className={inputCls}>
            <option value="16:9">16:9</option><option value="4:3">4:3</option><option value="3:2">3:2</option><option value="1:1">1:1 (square)</option>
          </select>
        </Field>
      </>);
    }

    case "product-embed":
      return (<>
        <Field label="Product slug">
          <TextInput value={block.productSlug} onChange={(e) => onBlock({ productSlug: e.target.value })} placeholder="e.g. my-product-name" />
        </Field>
        <Field label="Card style">
          <select value={block.variant ?? "classic"} onChange={(e) => onBlock({ variant: e.target.value as any })} className={inputCls}>
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
            <option value="overlay">Overlay</option>
          </select>
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={block.showDescription ?? false} onChange={(e) => onBlock({ showDescription: e.target.checked })} />
          Show product description
        </label>
      </>);

    case "form": {
      const fields = block.fields ?? [];
      return (<>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-semibold flex-1">Field {i + 1}</span>
                <button onClick={() => onBlock({ fields: fields.filter((_, j) => j !== i) })} className="text-xs text-destructive hover:underline">Remove</button>
              </div>
              <Field label="Label">
                <TextInput value={f.label} onChange={(e) => onBlock({ fields: fields.map((fi, j) => j === i ? { ...fi, label: e.target.value } : fi) })} />
              </Field>
              <Field label="Type">
                <select value={f.fieldType} onChange={(e) => onBlock({ fields: fields.map((fi, j) => j === i ? { ...fi, fieldType: e.target.value as any } : fi) })} className={inputCls}>
                  <option value="text">Text</option><option value="email">Email</option><option value="phone">Phone</option>
                  <option value="textarea">Textarea</option><option value="select">Dropdown</option><option value="checkbox">Checkbox</option>
                  <option value="file">File upload</option>
                </select>
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={f.required ?? false} onChange={(e) => onBlock({ fields: fields.map((fi, j) => j === i ? { ...fi, required: e.target.checked } : fi) })} />
                Required
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={() => onBlock({ fields: [...fields, { id: `f-${Date.now()}`, label: "Name", fieldType: "text" as const }] })}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary"
        >
          + Add field
        </button>
        <Field label="Submit button label">
          <TextInput value={block.submitLabel ?? "Submit"} onChange={(e) => onBlock({ submitLabel: e.target.value })} />
        </Field>
        <Field label="Where responses go">
          <select value={(block.submitAction as any)?.type ?? "none"} onChange={(e) => {
            const t = e.target.value;
            const sa = block.submitAction as any;
            if (t === "none") onBlock({ submitAction: undefined });
            else if (t === "email") onBlock({ submitAction: { type: "email", to: sa?.to ?? "" } });
            else if (t === "webhook") onBlock({ submitAction: { type: "webhook", url: sa?.url ?? "" } });
            else onBlock({ submitAction: { type: "whatsapp", number: sa?.number ?? "" } });
          }} className={inputCls}>
            <option value="none">Success message only</option>
            <option value="email">Email</option>
            <option value="webhook">Webhook</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </Field>
        {(block.submitAction as any)?.type === "email" && (
          <Field label="Send to email">
            <TextInput value={(block.submitAction as any).to} onChange={(e) => onBlock({ submitAction: { type: "email", to: e.target.value } })} placeholder="you@example.com" />
          </Field>
        )}
        {(block.submitAction as any)?.type === "webhook" && (
          <Field label="Webhook URL">
            <TextInput value={(block.submitAction as any).url} onChange={(e) => onBlock({ submitAction: { type: "webhook", url: e.target.value } })} placeholder="https://your-app.com/hook" />
          </Field>
        )}
        {(block.submitAction as any)?.type === "whatsapp" && (
          <Field label="WhatsApp number">
            <TextInput value={(block.submitAction as any).number} onChange={(e) => onBlock({ submitAction: { type: "whatsapp", number: e.target.value } })} placeholder="+2348012345678" />
          </Field>
        )}
      </>);
    }

    case "row":
      return (<>
        <Field label="Column count">
          <select value={block.colCount} onChange={(e) => onBlock({ colCount: Number(e.target.value) as any })} className={inputCls}>
            <option value={2}>2 columns</option><option value={3}>3 columns</option><option value={4}>4 columns</option>
          </select>
        </Field>
        <Field label="Gap">
          <select value={block.gap ?? "md"} onChange={(e) => onBlock({ gap: e.target.value as any })} className={inputCls}>
            <option value="none">None</option><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
          </select>
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={block.stackOnMobile !== false} onChange={(e) => onBlock({ stackOnMobile: e.target.checked })} />
          Stack columns on mobile
        </label>
        <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
          Column blocks can be edited in full detail from the mobile Kiosk editor.
        </p>
      </>);

    case "badge":
      return (<>
        <Field label="Badge text">
          <TextInput value={block.text} onChange={(e) => onBlock({ text: e.target.value } as any)} />
        </Field>
        <Field label="Size">
          <select value={(block as any).size ?? "md"} onChange={(e) => onBlock({ size: e.target.value } as any)} className={inputCls}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Background">
            <div className="flex items-center gap-2">
              <input type="color" value={(block as any).bgColor ?? "#000000"} onChange={(e) => onBlock({ bgColor: e.target.value } as any)} className="h-9 w-12 rounded-lg border border-border cursor-pointer" />
              <TextInput value={(block as any).bgColor ?? ""} onChange={(e) => onBlock({ bgColor: e.target.value } as any)} placeholder="hsl(...)" />
            </div>
          </Field>
          <Field label="Text color">
            <div className="flex items-center gap-2">
              <input type="color" value={(block as any).color ?? "#ffffff"} onChange={(e) => onBlock({ color: e.target.value } as any)} className="h-9 w-12 rounded-lg border border-border cursor-pointer" />
              <TextInput value={(block as any).color ?? ""} onChange={(e) => onBlock({ color: e.target.value } as any)} placeholder="hsl(...)" />
            </div>
          </Field>
        </div>
      </>);

    case "list": {
      const items: string[] = (block as any).items ?? [];
      return (<>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Items</p>
            <button type="button"
              onClick={() => onBlock({ items: [...items, "New item"] } as any)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary">
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <TextInput value={item} onChange={(e) => {
                const next = [...items]; next[idx] = e.target.value;
                onBlock({ items: next } as any);
              }} />
              <button type="button" onClick={() => onBlock({ items: items.filter((_, j) => j !== idx) } as any)} className="text-destructive hover:opacity-70"><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs mt-2">
          <input type="checkbox" checked={(block as any).ordered ?? false} onChange={(e) => onBlock({ ordered: e.target.checked } as any)} />
          Numbered list (ordered)
        </label>
      </>);
    }

    case "group": {
      const grp = block as GroupBlock;
      return (<>
        <Field label="Group label"><TextInput value={grp.label ?? ""} onChange={(e) => onBlock({ label: e.target.value || undefined } as any)} placeholder="e.g. Hero content" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Direction">
            <select value={grp.direction ?? "column"} onChange={(e) => onBlock({ direction: e.target.value } as any)} className={inputCls}>
              <option value="column">Vertical (stack)</option>
              <option value="row">Horizontal</option>
              <option value="row-wrap">Horizontal (wrap)</option>
            </select>
          </Field>
          <Field label="Gap">
            <select value={grp.gap ?? "md"} onChange={(e) => onBlock({ gap: e.target.value } as any)} className={inputCls}>
              <option value="none">None</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </Field>
        </div>
        <Field label="Alignment">
          <select value={grp.align ?? "start"} onChange={(e) => onBlock({ align: e.target.value } as any)} className={inputCls}>
            <option value="start">Left / Top</option>
            <option value="center">Center</option>
            <option value="end">Right / Bottom</option>
            <option value="stretch">Stretch</option>
          </select>
        </Field>
        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Children ({grp.children.length})</p>
            <p className="text-[9px] text-muted-foreground/60">Click in canvas to select</p>
          </div>
          {grp.children.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">Empty group. Add blocks below.</p>
          ) : (
            <div className="space-y-1">
              {grp.children.map((child, idx) => {
                const ChildIcon = BLOCK_ICONS[child.type] ?? Type;
                return (
                  <div key={child.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-secondary/40 text-xs group">
                    <ChildIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate text-foreground/80">{BLOCK_TYPE_LABELS[child.type as BlockType] ?? child.type}</span>
                    <button type="button" onClick={() => onBlock({ children: grp.children.filter((_, j) => j !== idx) } as any)} className="text-destructive hover:opacity-70 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
          )}
          {/* Quick-add block buttons */}
          <div className="pt-1 border-t border-border/40">
            <p className="text-[9px] text-muted-foreground/60 mb-1.5 uppercase tracking-wider">Add to group</p>
            <div className="flex flex-wrap gap-1">
              {(["text", "button", "image", "icon", "spacer"] as BlockType[]).map((type) => {
                const Ic = BLOCK_ICONS[type] ?? Type;
                return (
                  <button key={type} type="button"
                    onClick={() => onBlock({ children: [...grp.children, createDefaultBlock(type)] } as any)}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-secondary"
                  >
                    <Ic className="h-2.5 w-2.5" /> {BLOCK_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>);
    }

    case "layout-box": {
      const lb = block as LayoutBoxBlock;
      return (<>
        <Field label="Container label"><TextInput value={lb.label ?? ""} onChange={(e) => onBlock({ label: e.target.value || undefined } as any)} placeholder="e.g. 3-column grid" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Layout type">
            <select value={lb.layout ?? "grid"} onChange={(e) => onBlock({ layout: e.target.value } as any)} className={inputCls}>
              <option value="grid">Grid (columns)</option>
              <option value="flex">Flex (flex container)</option>
            </select>
          </Field>
          <Field label="Gap">
            <select value={lb.gap ?? "md"} onChange={(e) => onBlock({ gap: e.target.value } as any)} className={inputCls}>
              <option value="none">None</option>
              <option value="sm">Small (8px)</option>
              <option value="md">Medium (16px)</option>
              <option value="lg">Large (24px)</option>
            </select>
          </Field>
        </div>
        {lb.layout === "grid" || !lb.layout ? (<>
          <Field label="Columns">
            <select value={String(lb.columns ?? 2)} onChange={(e) => onBlock({ columns: Number(e.target.value) } as any)} className={inputCls}>
              <option value="1">1 column</option>
              <option value="2">2 columns</option>
              <option value="3">3 columns</option>
              <option value="4">4 columns</option>
              <option value="5">5 columns</option>
              <option value="6">6 columns</option>
            </select>
          </Field>
          <Field label="Column template (advanced)">
            <TextInput value={lb.colTemplate ?? ""} onChange={(e) => onBlock({ colTemplate: e.target.value || undefined } as any)} placeholder={`repeat(${lb.columns ?? 2}, 1fr)`} />
            <p className="text-[10px] text-muted-foreground mt-1">e.g. <code>2fr 1fr</code> or <code>minmax(200px,1fr) auto</code></p>
          </Field>
        </>) : (<>
          <Field label="Direction">
            <select value={lb.direction ?? "row"} onChange={(e) => onBlock({ direction: e.target.value } as any)} className={inputCls}>
              <option value="row">Horizontal</option>
              <option value="column">Vertical (stack)</option>
              <option value="row-wrap">Horizontal (wrap)</option>
            </select>
          </Field>
          <Field label="Alignment">
            <select value={lb.align ?? "start"} onChange={(e) => onBlock({ align: e.target.value } as any)} className={inputCls}>
              <option value="start">Left / Top</option>
              <option value="center">Center</option>
              <option value="end">Right / Bottom</option>
              <option value="stretch">Stretch</option>
            </select>
          </Field>
        </>)}
        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Children ({lb.children.length})</p>
            <p className="text-[9px] text-muted-foreground/60">Click in canvas to select</p>
          </div>
          {lb.children.map((child, idx) => {
            const ChildIcon = BLOCK_ICONS[child.type] ?? Type;
            return (
              <div key={child.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 bg-secondary/40 text-xs group">
                <ChildIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-foreground/80">{BLOCK_TYPE_LABELS[child.type as BlockType] ?? child.type}</span>
                <button type="button" onClick={() => onBlock({ children: lb.children.filter((_, j) => j !== idx) } as any)} className="text-destructive hover:opacity-70 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
              </div>
            );
          })}
          <div className="pt-1 border-t border-border/40">
            <p className="text-[9px] text-muted-foreground/60 mb-1.5 uppercase tracking-wider">Add to layout box</p>
            <div className="flex flex-wrap gap-1">
              {(["text", "button", "image", "card", "icon", "spacer"] as BlockType[]).map((type) => {
                const Ic = BLOCK_ICONS[type] ?? Type;
                return (
                  <button key={type} type="button"
                    onClick={() => onBlock({ children: [...lb.children, createDefaultBlock(type)] } as any)}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-secondary"
                  >
                    <Ic className="h-2.5 w-2.5" /> {BLOCK_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>);
    }

    default:
      return <p className="text-xs text-muted-foreground">No editable fields for this block type.</p>;
  }
}

/* ─────────────────────────────────────────────────────────
   Studio Canvas — renders blocks in the preview with drag + click-to-select
───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
   Inline text editor for text/button blocks in StudioCanvas
───────────────────────────────────────────────────────── */
function InlineTextEdit({
  block, onUpdate,
}: {
  block: Block;
  onUpdate: (patch: Partial<Block>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const blockIdRef = useRef(block.id);

  const getValue = () => {
    if (block.type === "text") return (block as any).content ?? "";
    if (block.type === "button") return (block as any).label ?? "";
    return "";
  };

  // On mount: set initial content + auto-focus with cursor at end
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = getValue();
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    range.collapse(false);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When a DIFFERENT block becomes selected, reset content (don't do this for same block to avoid cursor jump)
  useLayoutEffect(() => {
    if (blockIdRef.current !== block.id) {
      blockIdRef.current = block.id;
      if (ref.current) ref.current.textContent = getValue();
    }
  }, [block.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const styles = (block as any).styles ?? {};

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => {
        const text = e.currentTarget.textContent ?? "";
        if (block.type === "text") onUpdate({ content: text } as any);
        else if (block.type === "button") onUpdate({ label: text } as any);
      }}
      style={{
        outline: "2px solid hsl(var(--primary) / 0.5)",
        outlineOffset: 3,
        borderRadius: 4,
        padding: "4px 8px",
        minHeight: "1.4em",
        cursor: "text",
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color ?? "inherit",
        textAlign: styles.textAlign,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
        fontStyle: styles.fontStyle,
        textTransform: styles.textTransform,
        background: "transparent",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    />
  );
}

/* Sub-canvas for rendering GroupBlock children with per-child overlays */
function GroupBlockCanvas({
  group, selectedBlockId, onSelectBlock, onUpdateChild, onDeleteChild, ctx,
}: {
  group: GroupBlock;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateChild: (id: string, patch: Partial<Block>) => void;
  onDeleteChild: (id: string) => void;
  ctx: { tokens: ReturnType<typeof useDesignTokens>; elStyles?: Record<string, React.CSSProperties> };
}) {
  const gapMap: Record<string, number> = { none: 0, sm: 8, md: 16, lg: 24 };
  const alignMap: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
  const dir = group.direction ?? "column";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: dir as any,
        flexWrap: dir === "row-wrap" ? "wrap" : "nowrap",
        gap: gapMap[group.gap ?? "md"],
        alignItems: dir === "column" ? (alignMap[group.align ?? "start"] as any) : undefined,
        justifyContent: dir !== "column" ? (alignMap[group.align ?? "start"] as any) : undefined,
        width: "100%",
        padding: (group as any).styles?.padding ?? undefined,
        backgroundColor: (group as any).styles?.backgroundColor ?? undefined,
        borderRadius: (group as any).styles?.borderRadius ?? undefined,
        border: (group as any).styles?.border ?? undefined,
        boxShadow: (group as any).styles?.boxShadow ?? undefined,
      }}
      onClick={(e) => { if (e.currentTarget === e.target) onSelectBlock(group.id); }}
    >
      {group.children.length === 0 && (
        <div style={{ padding: "16px", fontSize: 12, color: "hsl(var(--muted-foreground))", textAlign: "center", border: "1px dashed hsl(var(--border))", borderRadius: 6, width: "100%" }}>
          Empty group — add blocks via inspector
        </div>
      )}
      {group.children.map((child) => {
        const isChildSelected = selectedBlockId === child.id;
        const isInlineEditable = isChildSelected && (child.type === "text" || child.type === "button");
        return (
          <div
            key={child.id}
            className="group/child relative"
            style={{
              outline: isChildSelected ? "2px solid hsl(var(--primary))" : "none",
              outlineOffset: 2,
              borderRadius: 4,
              alignSelf: (child as any).styles?.alignSelf ?? undefined,
              maxWidth: (child as any).styles?.maxWidth ?? undefined,
              marginTop: (child as any).styles?.marginTop ?? undefined,
              marginBottom: (child as any).styles?.marginBottom ?? undefined,
            }}
          >
            {/* Child type chip */}
            <div className={`absolute -top-5 left-0 z-20 rounded-t px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider transition-opacity ${isChildSelected ? "opacity-100 bg-primary text-primary-foreground" : "opacity-0 group-hover/child:opacity-100 bg-foreground/75 text-background"}`}>
              {BLOCK_TYPE_LABELS[child.type as BlockType] ?? child.type}
            </div>

            {isInlineEditable ? (
              <InlineTextEdit block={child} onUpdate={(patch) => onUpdateChild(child.id, patch)} />
            ) : (
              <>
                <BlockRenderer block={child} ctx={ctx} />
                {!isChildSelected && (
                  <div
                    style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); onSelectBlock(child.id); }}
                  />
                )}
              </>
            )}

            {isChildSelected && (
              <button
                type="button"
                style={{ zIndex: 20 }}
                onClick={(e) => { e.stopPropagation(); onDeleteChild(child.id); }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:opacity-80"
                title="Delete"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Sub-canvas for layout-box: renders children in CSS grid/flex with per-child overlays */
function LayoutBoxCanvas({
  lb, selectedBlockId, onSelectBlock, onUpdateChild, onDeleteChild, ctx,
}: {
  lb: LayoutBoxBlock;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateChild: (id: string, patch: Partial<Block>) => void;
  onDeleteChild: (id: string) => void;
  ctx: { tokens: ReturnType<typeof useDesignTokens>; elStyles?: Record<string, React.CSSProperties> };
}) {
  const gapMap: Record<string, string> = { none: "0", sm: "8px", md: "16px", lg: "24px" };
  const gap = gapMap[lb.gap ?? "md"];
  const isGrid = lb.layout === "grid";
  const cols = lb.columns ?? 2;
  const colTemplate = lb.colTemplate ?? `repeat(${cols}, 1fr)`;
  const dir = lb.direction ?? "row";
  const alignMap: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };

  return (
    <div
      style={{
        display: isGrid ? "grid" : "flex",
        ...(isGrid
          ? { gridTemplateColumns: colTemplate, gap }
          : {
              flexDirection: dir as any,
              flexWrap: dir === "row-wrap" ? "wrap" : "nowrap",
              gap,
              alignItems: dir === "column" ? (alignMap[lb.align ?? "start"] as any) : undefined,
              justifyContent: dir !== "column" ? (alignMap[lb.align ?? "start"] as any) : undefined,
            }),
        width: "100%",
        padding: (lb as any).styles?.padding ?? undefined,
        backgroundColor: (lb as any).styles?.backgroundColor ?? undefined,
        borderRadius: (lb as any).styles?.borderRadius ?? undefined,
        border: (lb as any).styles?.border ?? undefined,
        boxShadow: (lb as any).styles?.boxShadow ?? undefined,
      }}
      onClick={(e) => { if (e.currentTarget === e.target) onSelectBlock(lb.id); }}
    >
      {lb.children.length === 0 && (
        <div style={{ padding: "24px 16px", fontSize: 12, color: "hsl(var(--muted-foreground))", textAlign: "center", border: "1px dashed hsl(var(--border))", borderRadius: 6, width: "100%", gridColumn: `1 / -1` }}>
          Empty layout box — add blocks via inspector
        </div>
      )}
      {lb.children.map((child) => {
        const isChildSelected = selectedBlockId === child.id;
        const isInlineEditable = isChildSelected && (child.type === "text" || child.type === "button");
        return (
          <div
            key={child.id}
            className="group/child relative"
            style={{
              outline: isChildSelected ? "2px solid hsl(var(--primary))" : "none",
              outlineOffset: 2,
              borderRadius: 4,
              minWidth: 0,
            }}
          >
            <div className={`absolute -top-5 left-0 z-20 rounded-t px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider transition-opacity ${isChildSelected ? "opacity-100 bg-primary text-primary-foreground" : "opacity-0 group-hover/child:opacity-100 bg-foreground/75 text-background"}`}>
              {BLOCK_TYPE_LABELS[child.type as BlockType] ?? child.type}
            </div>
            {isInlineEditable ? (
              <InlineTextEdit block={child} onUpdate={(patch) => onUpdateChild(child.id, patch)} />
            ) : (
              <>
                <BlockRenderer block={child} ctx={ctx} />
                {!isChildSelected && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onSelectBlock(child.id); }} />
                )}
              </>
            )}
            {isChildSelected && (
              <button
                type="button"
                style={{ zIndex: 20 }}
                onClick={(e) => { e.stopPropagation(); onDeleteChild(child.id); }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:opacity-80"
                title="Delete"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StudioCanvas({
  section, selectedBlockId, onSelectBlock, onChange, active = true,
}: {
  section: CustomSection;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onChange: (patch: Partial<CustomSection>) => void;
  active?: boolean;
}) {
  const tokens = useDesignTokens();
  const ctx = { tokens };
  const dragIdxRef = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const setBlocks = (blocks: Block[]) => onChange({ blocks });

  // Recursive helpers for nested blocks (GroupBlock children)
  function getChildren(b: Block): Block[] | null {
    if (b.type === "group") return (b as GroupBlock).children;
    if (b.type === "layout-box") return (b as LayoutBoxBlock).children;
    return null;
  }

  function withChildren(b: Block, children: Block[]): Block {
    if (b.type === "group") return { ...(b as GroupBlock), children } as GroupBlock;
    if (b.type === "layout-box") return { ...(b as LayoutBoxBlock), children } as LayoutBoxBlock;
    return b;
  }

  function findBlockRecursive(blocks: Block[], id: string): Block | null {
    for (const b of blocks) {
      if (b.id === id) return b;
      const ch = getChildren(b);
      if (ch) {
        const found = findBlockRecursive(ch, id);
        if (found) return found;
      }
    }
    return null;
  }

  function updateBlockRecursive(blocks: Block[], id: string, patch: Partial<Block>): Block[] {
    return blocks.map((b) => {
      if (b.id === id) return { ...b, ...patch } as Block;
      const ch = getChildren(b);
      if (ch) return withChildren(b, updateBlockRecursive(ch, id, patch));
      return b;
    });
  }

  function deleteBlockRecursive(blocks: Block[], id: string): Block[] {
    return blocks
      .filter((b) => b.id !== id)
      .map((b) => {
        const ch = getChildren(b);
        return ch ? withChildren(b, deleteBlockRecursive(ch, id)) : b;
      });
  }

  const updateBlock = useCallback((blockId: string, patch: Partial<Block>) => {
    onChange({ blocks: updateBlockRecursive(section.blocks, blockId, patch) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.blocks, onChange]);

  const GAP: Record<string, number> = { none: 0, sm: 8, md: 20, lg: 36 };
  const ALIGN: Record<string, string> = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
  const PX: Record<string, string> = { none: "0", sm: "24px", md: "48px", lg: "80px" };
  const PY: Record<string, string> = { none: "0", sm: "24px", md: "40px", lg: "80px" };

  const padX = PX[(section as any).paddingX ?? "md"];
  const padY = PY[(section as any).paddingY ?? "md"];
  const direction = (section as any).direction ?? "column";

  const sectionStyle: React.CSSProperties = {
    position: "relative",
    padding: `${padY} ${padX}`,
    minHeight: section.fullViewport ? "100vh" : 120,
    backgroundColor: section.bgColor,
    backgroundImage: section.bgGradient || undefined,
  };

  return (
    <div style={sectionStyle} onClick={(e) => { if (e.currentTarget === e.target) onSelectBlock(null); }}>
      {section.bgImage && <img src={section.bgImage} alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />}
      {section.bgVideo && <video src={section.bgVideo} autoPlay muted loop playsInline aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />}
      {(section.bgImage || section.bgVideo) && (section.bgOpacity ?? 0) > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(section.bgOpacity ?? 0) / 100})`, zIndex: 1 }} />
      )}

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: direction as any, flexWrap: direction === "row-wrap" ? "wrap" : "nowrap", gap: GAP[section.gap ?? "md"], alignItems: direction === "column" ? (ALIGN[section.align ?? "start"] as any) : undefined, justifyContent: direction !== "column" ? (ALIGN[section.align ?? "start"] as any) : undefined }}>
        {section.blocks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "hsl(var(--muted-foreground))" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎨</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Canvas is empty</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>
              {active ? "Add blocks from the left panel ←" : "Select this section to start editing"}
            </div>
          </div>
        ) : section.blocks.map((block, i) => {
          const isSelected = active && block.id === selectedBlockId;
          const isInlineEditable = isSelected && (block.type === "text" || block.type === "button");
          const isOver = active && overIdx === i && dragIdxRef.current !== null && dragIdxRef.current !== i;
          return (
            <div
              key={block.id}
              draggable={active && !isSelected}
              onDragStart={(e) => {
                if (!active || isSelected) { e.preventDefault(); return; }
                dragIdxRef.current = i;
                e.dataTransfer.effectAllowed = "move";
                const ghost = document.createElement("div");
                ghost.style.cssText = "position:fixed;top:-999px;opacity:0;";
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 0, 0);
                setTimeout(() => document.body.removeChild(ghost), 0);
              }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverIdx(i); }}
              onDragLeave={() => setOverIdx(null)}
              onDrop={(e) => {
                e.preventDefault();
                const from = dragIdxRef.current;
                if (from !== null && from !== i) {
                  const next = [...section.blocks];
                  const [item] = next.splice(from, 1);
                  next.splice(i, 0, item);
                  setBlocks(next);
                }
                dragIdxRef.current = null;
                setOverIdx(null);
              }}
              onDragEnd={() => { dragIdxRef.current = null; setOverIdx(null); }}
              className="group relative"
              style={{
                width: section.align === "stretch" ? "100%" : "auto",
                alignSelf: (block as any).styles?.alignSelf ?? undefined,
                maxWidth: (block as any).styles?.maxWidth ?? undefined,
                marginTop: (block as any).styles?.marginTop ?? undefined,
                marginBottom: (block as any).styles?.marginBottom ?? undefined,
                opacity: (block as any).styles?.opacity !== undefined ? Number((block as any).styles.opacity) : undefined,
                outline: isSelected ? "2px solid hsl(var(--primary))" : isOver ? "2px dashed hsl(var(--accent))" : "none",
                outlineOffset: isSelected ? 4 : 2,
                borderRadius: (block as any).styles?.borderRadius ?? 6,
                transition: "outline 0.1s",
              }}
            >
              {/* Block type chip */}
              <div className={`absolute -top-6 left-0 z-20 rounded-t px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-opacity ${isSelected ? "opacity-100 bg-primary text-primary-foreground" : "opacity-0 group-hover:opacity-100 bg-foreground/75 text-background"}`}>
                {BLOCK_TYPE_LABELS[block.type as BlockType] ?? block.type}
              </div>

              {/* Block content — group/layout-box blocks show children with per-child overlays; text/button have inline editing */}
              {block.type === "group" && active ? (
                <GroupBlockCanvas
                  group={block as GroupBlock}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={onSelectBlock}
                  onUpdateChild={(childId, patch) => updateBlock(childId, patch)}
                  onDeleteChild={(childId) => {
                    const updated = { ...(block as GroupBlock), children: (block as GroupBlock).children.filter((c) => c.id !== childId) } as GroupBlock;
                    onChange({ blocks: section.blocks.map((b) => b.id === block.id ? updated : b) });
                    onSelectBlock(null);
                  }}
                  ctx={ctx}
                />
              ) : block.type === "layout-box" && active ? (
                <LayoutBoxCanvas
                  lb={block as LayoutBoxBlock}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={onSelectBlock}
                  onUpdateChild={(childId, patch) => updateBlock(childId, patch)}
                  onDeleteChild={(childId) => {
                    const updated = { ...(block as LayoutBoxBlock), children: (block as LayoutBoxBlock).children.filter((c) => c.id !== childId) } as LayoutBoxBlock;
                    onChange({ blocks: section.blocks.map((b) => b.id === block.id ? updated : b) });
                    onSelectBlock(null);
                  }}
                  ctx={ctx}
                />
              ) : isInlineEditable ? (
                <InlineTextEdit block={block} onUpdate={(patch) => updateBlock(block.id, patch)} />
              ) : (
                <>
                  <BlockRenderer block={block} ctx={ctx} />
                  {/* Overlay only on UNSELECTED blocks when canvas is active */}
                  {active && !isSelected && (
                    <div
                      style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "grab" }}
                      onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                    />
                  )}
                </>
              )}

              {/* Drag handle */}
              {!isSelected && (
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-border bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* Delete button (shown only when selected top-level block) */}
              {isSelected && (
                <button
                  type="button"
                  style={{ zIndex: 20 }}
                  onClick={(e) => { e.stopPropagation(); onChange({ blocks: deleteBlockRecursive(section.blocks, block.id) }); onSelectBlock(null); }}
                  className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:opacity-80 transition-opacity"
                  title="Delete block"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Typography panel — shown in inspector for text/button blocks
───────────────────────────────────────────────────────── */
const WEIGHTS = [300, 400, 500, 600, 700, 800, 900] as const;

function TypographyPanel({ block, onPatch }: { block: Block; onPatch: (p: Partial<Block>) => void }) {
  if (block.type !== "text" && block.type !== "button") return null;
  const styles = (block.styles ?? {}) as import("@/lib/storefront").BlockStyles;
  const ps = (patch: Partial<import("@/lib/storefront").BlockStyles>) => onPatch({ styles: { ...styles, ...patch } } as any);

  const fsNum = styles.fontSize ? parseFloat(styles.fontSize) : block.type === "text" && (block as any).tag?.match(/^h[1-2]$/) ? 32 : 16;
  const lhNum = styles.lineHeight ? parseFloat(styles.lineHeight) : 1.5;
  const lsNum = styles.letterSpacing ? parseFloat(styles.letterSpacing) : 0;

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-3 mt-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Typography</p>

      <Field label="Font family">
        <select value={styles.fontFamily ?? ""} onChange={(e) => ps({ fontFamily: e.target.value || undefined })} className={inputCls} style={{ fontFamily: styles.fontFamily }}>
          {FONT_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value} style={{ fontFamily: value || "inherit" }}>{label}</option>
          ))}
        </select>
      </Field>

      <Field label={`Size: ${Math.round(fsNum)}px`}>
        <StyledSlider min={10} max={120} step={1} value={fsNum} onChange={(v) => ps({ fontSize: `${v}px` })} />
      </Field>

      <Field label="Weight">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-7">
          {WEIGHTS.map((w) => (
            <button key={w} type="button"
              onClick={() => ps({ fontWeight: String(w) === (styles.fontWeight ?? "400") ? undefined : String(w) })}
              style={{ fontWeight: w }}
              className={`rounded border py-1.5 text-[11px] transition-colors ${(styles.fontWeight ?? "400") === String(w) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}>
              {w}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Color">
        <div className="flex gap-2">
          <input type="color" value={styles.color ?? "#000000"} onChange={(e) => ps({ color: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-input" />
          <input value={styles.color ?? ""} onChange={(e) => ps({ color: e.target.value || undefined })} placeholder="auto" className={inputCls} />
          {styles.color && <button onClick={() => ps({ color: undefined })} className="text-xs text-muted-foreground hover:text-destructive">×</button>}
        </div>
      </Field>

      <Field label="Alignment">
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} type="button"
              onClick={() => ps({ textAlign: a === styles.textAlign ? undefined : a })}
              className={`flex-1 rounded border py-1.5 text-xs capitalize transition-colors ${styles.textAlign === a ? "border-primary bg-primary/10 font-semibold" : "border-border hover:bg-secondary/50"}`}>
              {a}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`Line height: ${lhNum.toFixed(1)}`}>
          <StyledSlider min={1} max={3} step={0.1} value={lhNum} onChange={(v) => ps({ lineHeight: v.toFixed(1) })} />
        </Field>
        <Field label={`Letter spacing: ${lsNum >= 0 ? "+" : ""}${lsNum}px`}>
          <StyledSlider min={-2} max={12} step={0.5} value={lsNum} onChange={(v) => ps({ letterSpacing: `${v}px` })} />
        </Field>
      </div>

      <div className="flex gap-2">
        <label className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-colors ${styles.fontStyle === "italic" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}>
          <input type="checkbox" className="sr-only" checked={styles.fontStyle === "italic"} onChange={(e) => ps({ fontStyle: e.target.checked ? "italic" : undefined })} />
          <em>Italic</em>
        </label>
        <label className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 transition-colors ${styles.textTransform === "uppercase" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"}`}>
          <input type="checkbox" className="sr-only" checked={styles.textTransform === "uppercase"} onChange={(e) => ps({ textTransform: e.target.checked ? "uppercase" : undefined })} />
          <span className="text-[10px] font-bold uppercase tracking-widest">AA</span>
        </label>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Custom Section Inspector — block editor when block selected,
   section background/layout controls when nothing selected.
   Block palette moved to left StudioPanel.
───────────────────────────────────────────────────────── */
function CustomSectionInspector({
  s, on, selectedBlockId, onSelectBlock,
}: {
  s: CustomSection; on: (p: any) => void;
  selectedBlockId: string | null; onSelectBlock: (id: string | null) => void;
}) {
  function getChildrenDeep(b: Block): Block[] | null {
    if (b.type === "group") return (b as GroupBlock).children;
    if (b.type === "layout-box") return (b as LayoutBoxBlock).children;
    return null;
  }
  function withChildrenDeep(b: Block, children: Block[]): Block {
    if (b.type === "group") return { ...(b as GroupBlock), children } as GroupBlock;
    if (b.type === "layout-box") return { ...(b as LayoutBoxBlock), children } as LayoutBoxBlock;
    return b;
  }
  function findBlockDeep(blocks: Block[], id: string): Block | null {
    for (const b of blocks) {
      if (b.id === id) return b;
      const ch = getChildrenDeep(b);
      if (ch) {
        const found = findBlockDeep(ch, id);
        if (found) return found;
      }
    }
    return null;
  }

  function updateBlockDeep(blocks: Block[], id: string, patch: Partial<Block>): Block[] {
    return blocks.map((b) => {
      if (b.id === id) return { ...b, ...patch } as Block;
      const ch = getChildrenDeep(b);
      if (ch) return withChildrenDeep(b, updateBlockDeep(ch, id, patch));
      return b;
    });
  }

  const selectedBlock = selectedBlockId ? findBlockDeep(s.blocks, selectedBlockId) : null;

  const updateBlock = (patch: Partial<Block>) => {
    if (!selectedBlockId) return;
    on({ blocks: updateBlockDeep(s.blocks, selectedBlockId, patch) });
  };

  if (selectedBlock) {
    /* ── Block editor ── */
    const BlockIcon = BLOCK_ICONS[selectedBlock.type] ?? Type;
    return (
      <div className="space-y-4">
        {/* Block header */}
        <div className="flex items-center gap-2.5 rounded-xl bg-primary/8 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BlockIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 leading-none mb-0.5">Editing block</p>
            <p className="text-sm font-semibold truncate">{BLOCK_TYPE_LABELS[selectedBlock.type as BlockType] ?? selectedBlock.type}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectBlock(null)}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Deselect block"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Block-specific fields */}
        <CollapsibleSection title="Content" icon={FileText}>
          {renderBlockFields(selectedBlock, updateBlock)}
        </CollapsibleSection>

        {/* Typography (text + button blocks) */}
        <TypographyPanel block={selectedBlock} onPatch={updateBlock} />

        {/* Position & size */}
        {(() => {
          const blk = selectedBlock as any;
          return (
            <CollapsibleSection title="Position & Size" icon={AlignCenter} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Align in section">
                  <select value={(blk.styles?.alignSelf as string) ?? "auto"} onChange={(e) => updateBlock({ styles: { ...blk.styles, alignSelf: e.target.value === "auto" ? undefined : e.target.value as any } })} className={inputCls}>
                    <option value="auto">Default</option>
                    <option value="flex-start">Left</option>
                    <option value="center">Center</option>
                    <option value="flex-end">Right</option>
                    <option value="stretch">Stretch full width</option>
                  </select>
                </Field>
                <Field label="Max width">
                  <select value={(blk.styles?.maxWidth as string) ?? "none"} onChange={(e) => updateBlock({ styles: { ...blk.styles, maxWidth: e.target.value === "none" ? undefined : e.target.value } })} className={inputCls}>
                    <option value="none">No limit</option>
                    <option value="280px">280px</option>
                    <option value="400px">400px</option>
                    <option value="560px">560px</option>
                    <option value="720px">720px</option>
                    <option value="100%">100%</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Margin top">
                  <select value={(blk.styles?.marginTop as string) ?? "0"} onChange={(e) => updateBlock({ styles: { ...blk.styles, marginTop: e.target.value === "0" ? undefined : e.target.value } })} className={inputCls}>
                    <option value="0">None</option>
                    <option value="8px">8px</option>
                    <option value="16px">16px</option>
                    <option value="32px">32px</option>
                    <option value="64px">64px</option>
                  </select>
                </Field>
                <Field label="Margin bottom">
                  <select value={(blk.styles?.marginBottom as string) ?? "0"} onChange={(e) => updateBlock({ styles: { ...blk.styles, marginBottom: e.target.value === "0" ? undefined : e.target.value } })} className={inputCls}>
                    <option value="0">None</option>
                    <option value="8px">8px</option>
                    <option value="16px">16px</option>
                    <option value="32px">32px</option>
                    <option value="64px">64px</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Padding (all sides)">
                  <select value={(blk.styles?.padding as string) ?? "0"} onChange={(e) => updateBlock({ styles: { ...blk.styles, padding: e.target.value === "0" ? undefined : e.target.value } })} className={inputCls}>
                    <option value="0">None</option>
                    <option value="8px">8px</option>
                    <option value="16px">16px</option>
                    <option value="24px">24px</option>
                    <option value="32px">32px</option>
                  </select>
                </Field>
                <Field label="Opacity">
                  <select value={String(blk.styles?.opacity ?? "1")} onChange={(e) => updateBlock({ styles: { ...blk.styles, opacity: e.target.value === "1" ? undefined : Number(e.target.value) } })} className={inputCls}>
                    <option value="1">100%</option>
                    <option value="0.9">90%</option>
                    <option value="0.75">75%</option>
                    <option value="0.5">50%</option>
                    <option value="0.25">25%</option>
                  </select>
                </Field>
              </div>
            </CollapsibleSection>
          );
        })()}

        {/* Appearance */}
        {(() => {
          const blk = selectedBlock as any;
          return (
            <CollapsibleSection title="Appearance" icon={Palette} defaultOpen={false}>
              <Field label="Background color">
                <div className="flex gap-2">
                  <input type="color" value={blk.styles?.backgroundColor ?? "#ffffff"} onChange={(e) => updateBlock({ styles: { ...blk.styles, backgroundColor: e.target.value } })} className="h-9 w-12 cursor-pointer rounded-lg border border-border" />
                  <TextInput value={blk.styles?.backgroundColor ?? ""} onChange={(e) => updateBlock({ styles: { ...blk.styles, backgroundColor: e.target.value || undefined } })} placeholder="transparent" />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Border radius">
                  <select value={(blk.styles?.borderRadius as string) ?? "0"} onChange={(e) => updateBlock({ styles: { ...blk.styles, borderRadius: e.target.value === "0" ? undefined : e.target.value } })} className={inputCls}>
                    <option value="0">None</option>
                    <option value="4px">Small (4px)</option>
                    <option value="8px">Medium (8px)</option>
                    <option value="16px">Large (16px)</option>
                    <option value="24px">XL (24px)</option>
                    <option value="9999px">Pill</option>
                  </select>
                </Field>
                <Field label="Box shadow">
                  <select value={(blk.styles?.boxShadow as string) ?? "none"} onChange={(e) => updateBlock({ styles: { ...blk.styles, boxShadow: e.target.value === "none" ? undefined : e.target.value } })} className={inputCls}>
                    <option value="none">None</option>
                    <option value="0 1px 4px rgba(0,0,0,0.08)">Soft</option>
                    <option value="0 4px 16px rgba(0,0,0,0.12)">Medium</option>
                    <option value="0 8px 32px rgba(0,0,0,0.18)">Strong</option>
                  </select>
                </Field>
              </div>
              <Field label="Border">
                <div className="flex gap-2">
                  <input type="color" value={blk.styles?.border?.match(/#[0-9a-f]{6}/i)?.[0] ?? "#e5e7eb"} onChange={(e) => { const current = blk.styles?.border ?? "1px solid #e5e7eb"; const parts = current.split(" "); parts[2] = e.target.value; updateBlock({ styles: { ...blk.styles, border: parts.join(" ") } }); }} className="h-9 w-12 cursor-pointer rounded-lg border border-border" />
                  <select value={blk.styles?.border ? (blk.styles.border.includes("dashed") ? "dashed" : blk.styles.border.includes("dotted") ? "dotted" : "solid") : "none"} onChange={(e) => {
                    if (e.target.value === "none") { updateBlock({ styles: { ...blk.styles, border: undefined } }); return; }
                    const color = blk.styles?.border?.match(/#[0-9a-f]{6}/i)?.[0] ?? "#e5e7eb";
                    const width = "1px";
                    updateBlock({ styles: { ...blk.styles, border: `${width} ${e.target.value} ${color}` } });
                  }} className={inputCls}>
                    <option value="none">No border</option>
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </Field>
            </CollapsibleSection>
          );
        })()}

        {/* Inline hint for text blocks */}
        {(selectedBlock.type === "text" || selectedBlock.type === "button") && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-[11px] text-primary/80 font-medium">✏️ Click the block on the canvas to edit text directly</p>
          </div>
        )}
      </div>
    );
  }

  /* ── Section controls (no block selected) ── */
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-dashed border-border py-4 text-center">
        <p className="text-xs font-medium text-muted-foreground">Click any block on the canvas to edit it</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground/60">Or configure this section below</p>
      </div>

      <CollapsibleSection title="Section Layout" icon={Layout}>
        <Field label="Section name">
          <TextInput value={s.label ?? ""} onChange={(e) => on({ label: e.target.value || undefined })} placeholder="e.g. Hero, About Us, Promo Banner" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Direction">
            <select value={(s as any).direction ?? "column"} onChange={(e) => on({ direction: e.target.value })} className={inputCls}>
              <option value="column">Vertical (stack)</option>
              <option value="row">Horizontal</option>
              <option value="row-wrap">Horizontal (wrap)</option>
            </select>
          </Field>
          <Field label="Block gap">
            <select value={s.gap ?? "md"} onChange={(e) => on({ gap: e.target.value })} className={inputCls}>
              <option value="none">None</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Alignment">
            <select value={s.align ?? "start"} onChange={(e) => on({ align: e.target.value })} className={inputCls}>
              <option value="start">Left / Top</option>
              <option value="center">Center</option>
              <option value="end">Right / Bottom</option>
              <option value="stretch">Stretch</option>
            </select>
          </Field>
          <Field label="Min height">
            <select value={s.fullViewport ? "full" : "auto"} onChange={(e) => on({ fullViewport: e.target.value === "full" })} className={inputCls}>
              <option value="auto">Auto</option>
              <option value="full">Full viewport</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Padding X">
            <select value={(s as any).paddingX ?? "md"} onChange={(e) => on({ paddingX: e.target.value })} className={inputCls}>
              <option value="none">None</option>
              <option value="sm">Small (24px)</option>
              <option value="md">Medium (48px)</option>
              <option value="lg">Large (80px)</option>
            </select>
          </Field>
          <Field label="Padding Y">
            <select value={(s as any).paddingY ?? "md"} onChange={(e) => on({ paddingY: e.target.value })} className={inputCls}>
              <option value="none">None</option>
              <option value="sm">Small (24px)</option>
              <option value="md">Medium (40px)</option>
              <option value="lg">Large (80px)</option>
            </select>
          </Field>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Background" icon={Image}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={s.bgColor ?? "#ffffff"} onChange={(e) => on({ bgColor: e.target.value })} className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-border" />
              <TextInput value={s.bgColor ?? ""} onChange={(e) => on({ bgColor: e.target.value || undefined })} placeholder="#ffffff" />
            </div>
          </Field>
          <Field label="Overlay opacity">
            <StyledSlider min={0} max={80} step={5} value={s.bgOpacity ?? 0} onChange={(v) => on({ bgOpacity: v })} />
          </Field>
        </div>
        <Field label="Background image">
          <ImageInput value={s.bgImage ?? ""} onChange={(v) => on({ bgImage: v || undefined })} />
        </Field>
        <Field label="Background video">
          <VideoInput value={s.bgVideo ?? ""} onChange={(v) => on({ bgVideo: v || undefined })} />
        </Field>
      </CollapsibleSection>
    </div>
  );
}

function renderFields(s: Section, on: (patch: any) => void, selectedBlockId?: string | null, onSelectBlock?: (id: string | null) => void) {
  switch (s.type) {
    case "announcement":
      return (<>
        <Field label="Text"><TextInput value={s.text} onChange={(e) => on({ text: e.target.value })} /></Field>
        <Field label="Link"><LinkSelect value={s.link} onChange={(v) => on({ link: v || undefined })} /></Field>
      </>);
    case "hero":
      return (<>
        <Field label="Eyebrow"><TextInput value={s.eyebrow ?? ""} onChange={(e) => on({ eyebrow: e.target.value })} /></Field>
        <Field label="Heading"><TextInput value={s.heading} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Body"><TextArea value={s.body ?? ""} onChange={(e) => on({ body: e.target.value })} /></Field>
        <Field label="Image (or leave blank if using video)"><ImageInput value={s.image ?? ""} onChange={(v) => on({ image: v || undefined })} /></Field>
        <Field label="Background Video URL (MP4/WebM — overrides image)">
          <input type="url" value={s.bgVideo ?? ""} onChange={(e) => on({ bgVideo: e.target.value || undefined })} placeholder="https://example.com/hero.mp4" className={inputCls} />
        </Field>
        <Field label="Content position"><Align9Grid value={s.align} onChange={(v) => on({ align: v })} /></Field>
        <Field label="Height">
          <select value={s.height ?? "md"} onChange={(e) => on({ height: e.target.value })} className={inputCls}>
            <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
          </select>
        </Field>
        <Field label="CTA label"><TextInput value={s.ctaLabel ?? ""} onChange={(e) => on({ ctaLabel: e.target.value })} /></Field>
        <Field label="CTA link"><LinkSelect value={s.ctaLink} onChange={(v) => on({ ctaLink: v || undefined })} /></Field>
      </>);
    case "featured-products":
      return (<>
        <Field label="Heading"><TextInput value={s.heading} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={s.subheading ?? ""} onChange={(e) => on({ subheading: e.target.value })} /></Field>
        <Field label="Product link URL">
          <TextInput value={s.productLink ?? "/product/:slug"} onChange={(e) => on({ productLink: e.target.value || undefined })} placeholder="/product/:slug" />
          <p className="mt-1 text-[10px] text-muted-foreground">Use <code>:slug</code> as placeholder for the product slug. Default: <code>/product/:slug</code></p>
        </Field>
        <Field label="Columns">
          <select value={String(s.columns ?? 3)} onChange={(e) => on({ columns: Number(e.target.value) })} className={inputCls}>
            <option value="2">2</option><option value="3">3</option><option value="4">4</option>
          </select>
        </Field>
        <Field label="Card style">
          <div className="grid grid-cols-2 gap-1.5">
            {([
              ["classic", "Classic", "Image top, name + price below"],
              ["minimal", "Minimal", "Clean — no category, airy"],
              ["overlay", "Overlay", "Text on top of image"],
              ["horizontal", "Horizontal", "Image left, text right"],
              ["bordered", "Bordered", "Card box with border"],
              ["floating", "Floating", "Shadow card, luxury feel"],
              ["editorial", "Editorial", "Wide image, bold text"],
              ["chip", "Chip", "Compact square card"],
            ] as const).map(([val, label, desc]) => (
              <button key={val} type="button"
                onClick={() => on({ cardVariant: val })}
                title={desc}
                className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${(s.cardVariant ?? "classic") === val ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border hover:bg-secondary/60"}`}>
                <span className="block text-[11px] leading-tight">{label}</span>
                <span className="block text-[9px] text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>
        </Field>
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Product pool — tap to toggle</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {products.map((p) => {
              const active = s.productSlugs.includes(p.slug);
              return (
                <button key={p.slug} type="button"
                  onClick={() => on({ productSlugs: active ? s.productSlugs.filter((x) => x !== p.slug) : [...s.productSlugs, p.slug] })}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
                  {p.name}
                </button>
              );
            })}
          </div>
          <div className="mb-3 flex gap-2">
            <button type="button" onClick={() => on({ productSlugs: products.map((p) => p.slug) })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">Add all</button>
            <button type="button" onClick={() => on({ productSlugs: [] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">Clear all</button>
          </div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Manual order</p>
          <div className="space-y-2">
            {s.productSlugs.map((slug, i) => (
              <div key={i} className="flex gap-2">
                <ProductSelect value={slug} onChange={(v) => on({ productSlugs: s.productSlugs.map((x, j) => j === i ? v : x) })} />
                <button onClick={() => on({ productSlugs: s.productSlugs.filter((_, j) => j !== i) })} className="rounded-md border border-border px-2 hover:bg-secondary"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <button onClick={() => on({ productSlugs: [...s.productSlugs, products[0].slug] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
              <Plus className="h-3.5 w-3.5" /> Add one more
            </button>
          </div>
        </div>
      </>);
    case "image-text":
      return (<>
        <Field label="Heading"><TextInput value={s.heading} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Body"><TextArea value={s.body} onChange={(e) => on({ body: e.target.value })} /></Field>
        <Field label="Image"><ImageInput value={s.image} onChange={(v) => on({ image: v })} /></Field>
        <Field label="Image side">
          <select value={s.imageSide} onChange={(e) => on({ imageSide: e.target.value })} className={inputCls}>
            <option value="left">Left</option><option value="right">Right</option>
          </select>
        </Field>
        <Field label="CTA label"><TextInput value={s.ctaLabel ?? ""} onChange={(e) => on({ ctaLabel: e.target.value })} /></Field>
        <Field label="CTA link"><LinkSelect value={s.ctaLink} onChange={(v) => on({ ctaLink: v || undefined })} /></Field>
      </>);
    case "rich-text":
      return (<>
        <Field label="Heading"><TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Body"><TextArea rows={6} value={s.body} onChange={(e) => on({ body: e.target.value })} /></Field>
        <Field label="Align">
          <select value={s.align} onChange={(e) => on({ align: e.target.value })} className={inputCls}>
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </Field>
      </>);
    case "gallery":
      return (<>
        <Field label="Heading"><TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Columns">
          <select value={String(s.columns ?? 3)} onChange={(e) => on({ columns: Number(e.target.value) })} className={inputCls}>
            <option value="2">2</option><option value="3">3</option><option value="4">4</option>
          </select>
        </Field>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Images</p>
          {s.images.map((src, i) => (
            <div key={i} className="mb-2 rounded-md border border-border p-2">
              <ImageInput value={src} onChange={(v) => on({ images: s.images.map((x, j) => j === i ? v : x) })} />
              <button onClick={() => on({ images: s.images.filter((_, j) => j !== i) })} className="mt-1 text-xs text-destructive">Remove</button>
            </div>
          ))}
          <button onClick={() => on({ images: [...s.images, ""] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
            <Plus className="h-3.5 w-3.5" /> Add image
          </button>
        </div>
      </>);
    case "collection-list":
      return (<>
        <Field label="Heading"><TextInput value={s.heading} onChange={(e) => on({ heading: e.target.value })} /></Field>
        {s.items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-2">
            <TextInput value={it.label} onChange={(e) => on({ items: s.items.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
            <LinkSelect value={it.link} onChange={(v) => on({ items: s.items.map((x, j) => j === i ? { ...x, link: v } : x) })} />
            <ImageInput value={it.image} onChange={(v) => on({ items: s.items.map((x, j) => j === i ? { ...x, image: v } : x) })} />
            <button onClick={() => on({ items: s.items.filter((_, j) => j !== i) })} className="text-xs text-destructive">Remove</button>
          </div>
        ))}
        <button onClick={() => on({ items: [...s.items, { label: "New", image: "", link: "/shop" }] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      </>);
    case "newsletter":
      return (<>
        <Field label="Heading"><TextInput value={s.heading} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Body"><TextArea value={s.body ?? ""} onChange={(e) => on({ body: e.target.value })} /></Field>
        <Field label="Button label"><TextInput value={s.buttonLabel} onChange={(e) => on({ buttonLabel: e.target.value })} /></Field>
      </>);
    case "cta-banner":
      return (<>
        <Field label="Heading"><TextInput value={s.heading} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Body"><TextArea value={s.body ?? ""} onChange={(e) => on({ body: e.target.value })} /></Field>
        <Field label="Image (for split variant)"><ImageInput value={s.image ?? ""} onChange={(v) => on({ image: v || undefined })} /></Field>
        <Field label="CTA label"><TextInput value={s.ctaLabel} onChange={(e) => on({ ctaLabel: e.target.value })} /></Field>
        <Field label="CTA link"><LinkSelect value={s.ctaLink} onChange={(v) => on({ ctaLink: v })} /></Field>
      </>);
    case "text-columns":
      return (<>
        <Field label="Heading"><TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        {s.columns.map((c, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-2">
            <TextInput placeholder="Title" value={c.title} onChange={(e) => on({ columns: s.columns.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} />
            <TextArea placeholder="Body" value={c.body} onChange={(e) => on({ columns: s.columns.map((x, j) => j === i ? { ...x, body: e.target.value } : x) })} />
            <ImageInput value={c.icon ?? ""} onChange={(v) => on({ columns: s.columns.map((x, j) => j === i ? { ...x, icon: v || undefined } : x) })} />
            <button onClick={() => on({ columns: s.columns.filter((_, j) => j !== i) })} className="text-xs text-destructive">Remove</button>
          </div>
        ))}
        <button onClick={() => on({ columns: [...s.columns, { title: "New", body: "" }] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
          <Plus className="h-3.5 w-3.5" /> Add column
        </button>
      </>);
    case "testimonials":
      return (<>
        <Field label="Heading"><TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Reviews source">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => on({ useLiveReviews: !s.useLiveReviews } as any)}
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${s.useLiveReviews ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${s.useLiveReviews ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
            <span className="text-xs text-muted-foreground">
              {s.useLiveReviews ? "Showing top 3 live customer reviews" : "Using manual testimonials"}
            </span>
          </div>
        </Field>
        {!s.useLiveReviews && (<>
          {s.items.map((it, i) => (
            <div key={i} className="space-y-2 rounded-md border border-border p-2">
              <TextArea placeholder="Quote" value={it.quote} onChange={(e) => on({ items: s.items.map((x, j) => j === i ? { ...x, quote: e.target.value } : x) })} />
              <TextInput placeholder="Author" value={it.author} onChange={(e) => on({ items: s.items.map((x, j) => j === i ? { ...x, author: e.target.value } : x) })} />
              <TextInput placeholder="Role" value={it.role ?? ""} onChange={(e) => on({ items: s.items.map((x, j) => j === i ? { ...x, role: e.target.value } : x) })} />
              <button onClick={() => on({ items: s.items.filter((_, j) => j !== i) })} className="text-xs text-destructive">Remove</button>
            </div>
          ))}
          <button onClick={() => on({ items: [...s.items, { quote: "", author: "" }] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
            <Plus className="h-3.5 w-3.5" /> Add testimonial
          </button>
        </>)}
      </>);
    case "logo-bar":
      return (<>
        <Field label="Heading"><TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        {s.logos.map((l, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-2">
            <ImageInput value={l.src} onChange={(v) => on({ logos: s.logos.map((x, j) => j === i ? { ...x, src: v } : x) })} />
            <TextInput placeholder="Alt" value={l.alt} onChange={(e) => on({ logos: s.logos.map((x, j) => j === i ? { ...x, alt: e.target.value } : x) })} />
            <button onClick={() => on({ logos: s.logos.filter((_, j) => j !== i) })} className="text-xs text-destructive">Remove</button>
          </div>
        ))}
        <button onClick={() => on({ logos: [...s.logos, { src: "", alt: "" }] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
          <Plus className="h-3.5 w-3.5" /> Add logo
        </button>
      </>);
    case "faq":
      return (<>
        <Field label="Heading"><TextInput value={s.heading} onChange={(e) => on({ heading: e.target.value })} /></Field>
        {s.items.map((it, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-2">
            <TextInput placeholder="Question" value={it.question} onChange={(e) => on({ items: s.items.map((x, j) => j === i ? { ...x, question: e.target.value } : x) })} />
            <TextArea placeholder="Answer" value={it.answer} onChange={(e) => on({ items: s.items.map((x, j) => j === i ? { ...x, answer: e.target.value } : x) })} />
            <button onClick={() => on({ items: s.items.filter((_, j) => j !== i) })} className="text-xs text-destructive">Remove</button>
          </div>
        ))}
        <button onClick={() => on({ items: [...s.items, { question: "", answer: "" }] })} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
          <Plus className="h-3.5 w-3.5" /> Add FAQ
        </button>
      </>);
    case "video":
      return (<>
        <Field label="Heading"><TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Embed URL"><TextInput value={s.url} onChange={(e) => on({ url: e.target.value })} placeholder="https://www.youtube.com/embed/..." /></Field>
      </>);
    case "spacer":
      return (
        <Field label="Size">
          <select value={s.size} onChange={(e) => on({ size: e.target.value })} className={inputCls}>
            <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option><option value="xl">Extra large</option>
          </select>
        </Field>
      );
    case "related-products":
      return (<>
        <Field label="Heading"><TextInput value={s.heading} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Source product (finds products with similar names)">
          <ProductSelect value={s.sourceSlug} onChange={(v) => on({ sourceSlug: v })} />
        </Field>
        <Field label="Number of products to show">
          <select value={s.limit} onChange={(e) => on({ limit: Number(e.target.value) })} className={inputCls}>
            <option value={3}>3</option><option value={4}>4</option><option value={6}>6</option><option value={8}>8</option>
          </select>
        </Field>
      </>);
    case "search":
      return (<>
        <Field label="Heading"><TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Placeholder"><TextInput value={s.placeholder ?? ""} onChange={(e) => on({ placeholder: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={s.showFilters} onChange={(e) => on({ showFilters: e.target.checked })} /> Show category filter
        </label>
      </>);
    case "product-detail":
      return (<>
        <Field label="Product">
          <ProductSelect value={s.productSlug} onChange={(v) => on({ productSlug: v })} />
        </Field>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Gallery images (up to 4 extra)</p>
          <p className="mb-2 text-[10px] text-muted-foreground">The product's main image is always first. Add extra angles below.</p>
          {(s.extraImages ?? []).map((img, i) => (
            <div key={i} className="mb-2 rounded-md border border-border p-2">
              <ImageInput value={img} onChange={(v) => on({ extraImages: (s.extraImages ?? []).map((x, j) => j === i ? v : x) })} />
              <button onClick={() => on({ extraImages: (s.extraImages ?? []).filter((_, j) => j !== i) })} className="mt-1 text-xs text-destructive">Remove</button>
            </div>
          ))}
          {(s.extraImages ?? []).length < 4 && (
            <button onClick={() => on({ extraImages: [...(s.extraImages ?? []), ""] })}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-secondary">
              <Plus className="h-3.5 w-3.5" /> Add image
            </button>
          )}
        </div>
      </>);
    case "checkout-form":
      return (
        <Field label="Heading (optional)">
          <TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value || undefined })} placeholder="Checkout" />
        </Field>
      );
    case "contact-form":
      return (<>
        <Field label="Heading">
          <TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value || undefined })} placeholder="Get in touch" />
        </Field>
        <Field label="Subheading">
          <TextInput value={s.subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} placeholder="We'd love to hear from you" />
        </Field>
      </>);
    case "shop-grid":
      return (<>
        <Field label="Heading (optional)">
          <TextInput value={s.heading ?? ""} onChange={(e) => on({ heading: e.target.value || undefined })} placeholder="All products" />
        </Field>
        <Field label="Card style">
          <div className="grid grid-cols-2 gap-1.5">
            {([
              ["classic", "Classic", "Image top, name + price below"],
              ["minimal", "Minimal", "Clean — no category, airy"],
              ["overlay", "Overlay", "Text on top of image"],
              ["horizontal", "Horizontal", "Image left, text right"],
              ["bordered", "Bordered", "Card box with border"],
              ["floating", "Floating", "Shadow card, luxury feel"],
              ["editorial", "Editorial", "Wide image, bold text"],
              ["chip", "Chip", "Compact square card"],
            ] as const).map(([val, label, desc]) => (
              <button key={val} type="button"
                onClick={() => on({ cardVariant: val })}
                title={desc}
                className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${(s.cardVariant ?? "classic") === val ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border hover:bg-secondary/60"}`}>
                <span className="block text-[11px] leading-tight">{label}</span>
                <span className="block text-[9px] text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Columns">
          <select value={String(s.columns ?? 3)} onChange={(e) => on({ columns: Number(e.target.value) })} className={inputCls}>
            <option value="2">2</option><option value="3">3</option><option value="4">4</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={s.showFilters ?? true} onChange={(e) => on({ showFilters: e.target.checked })} /> Show category filters
        </label>
      </>);
    case "columns": {
      const cs = s as any;
      return (<>
        <Field label="Heading"><TextInput value={cs.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={cs.subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
        <Field label="Columns">
          <select value={String(cs.count ?? 3)} onChange={(e) => on({ count: Number(e.target.value) })} className={inputCls}>
            <option value="2">2</option><option value="3">3</option><option value="4">4</option>
          </select>
        </Field>
        <Field label="Gap">
          <select value={cs.gap ?? "md"} onChange={(e) => on({ gap: e.target.value })} className={inputCls}>
            <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
          </select>
        </Field>
        {(cs.items ?? []).map((col: any, i: number) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Column {i + 1}</p>
            <Field label="Heading"><TextInput value={col.heading ?? ""} onChange={(e) => on({ items: cs.items.map((x: any, j: number) => j === i ? { ...x, heading: e.target.value } : x) })} /></Field>
            <Field label="Body"><TextArea rows={2} value={col.body ?? ""} onChange={(e) => on({ items: cs.items.map((x: any, j: number) => j === i ? { ...x, body: e.target.value } : x) })} /></Field>
            <Field label="Icon name"><TextInput value={col.iconName ?? ""} onChange={(e) => on({ items: cs.items.map((x: any, j: number) => j === i ? { ...x, iconName: e.target.value || undefined } : x) })} placeholder="e.g. star, truck, shield" /></Field>
            <Field label="CTA label"><TextInput value={col.ctaLabel ?? ""} onChange={(e) => on({ items: cs.items.map((x: any, j: number) => j === i ? { ...x, ctaLabel: e.target.value || undefined } : x) })} /></Field>
            <Field label="CTA link"><LinkSelect value={col.ctaHref ?? ""} onChange={(v) => on({ items: cs.items.map((x: any, j: number) => j === i ? { ...x, ctaHref: v || undefined } : x) })} /></Field>
          </div>
        ))}
      </>);
    }

    case "pricing-plans": {
      const ps = s as any;
      return (<>
        <Field label="Heading"><TextInput value={ps.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={ps.subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
        {(ps.plans ?? []).map((plan: any, i: number) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Plan {i + 1}{plan.highlighted ? " ⭐" : ""}</p>
            <Field label="Name"><TextInput value={plan.name} onChange={(e) => on({ plans: ps.plans.map((p: any, j: number) => j === i ? { ...p, name: e.target.value } : p) })} /></Field>
            <Field label="Price"><TextInput value={plan.price} onChange={(e) => on({ plans: ps.plans.map((p: any, j: number) => j === i ? { ...p, price: e.target.value } : p) })} placeholder="₦5,000" /></Field>
            <Field label="Period"><TextInput value={plan.period ?? ""} onChange={(e) => on({ plans: ps.plans.map((p: any, j: number) => j === i ? { ...p, period: e.target.value || undefined } : p) })} placeholder="/month" /></Field>
            <Field label="Features (one per line)"><TextArea rows={3} value={(plan.features ?? []).join("\n")} onChange={(e) => on({ plans: ps.plans.map((p: any, j: number) => j === i ? { ...p, features: e.target.value.split("\n").filter(Boolean) } : p) })} /></Field>
            <Field label="Button label"><TextInput value={plan.ctaLabel} onChange={(e) => on({ plans: ps.plans.map((p: any, j: number) => j === i ? { ...p, ctaLabel: e.target.value } : p) })} /></Field>
            <Field label="Paystack link"><TextInput value={plan.paystackLink ?? ""} onChange={(e) => on({ plans: ps.plans.map((p: any, j: number) => j === i ? { ...p, paystackLink: e.target.value || undefined } : p) })} placeholder="https://paystack.com/pay/..." /></Field>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={plan.highlighted ?? false} onChange={(e) => on({ plans: ps.plans.map((p: any, j: number) => j === i ? { ...p, highlighted: e.target.checked } : p) })} /> Highlight this plan</label>
            <button onClick={() => on({ plans: ps.plans.filter((_: any, j: number) => j !== i) })} className="text-xs text-destructive">Remove</button>
          </div>
        ))}
        <button onClick={() => on({ plans: [...(ps.plans ?? []), { name: "New Plan", price: "₦0", features: ["Feature 1"], ctaLabel: "Get started", ctaLink: "/shop" }] })} className="text-sm text-primary">+ Add plan</button>
      </>);
    }

    case "reviews":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={(s as any).useRealReviews ?? false} onChange={(e) => on({ useRealReviews: e.target.checked })} /> Load live reviews from store</label>
      </>);

    case "lookbook":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={(s as any).subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
      </>);

    case "timeline":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={(s as any).subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
      </>);

    case "before-after":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
      </>);

    case "bundle-offer":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={(s as any).subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
        <Field label="CTA label"><TextInput value={(s as any).ctaLabel ?? ""} onChange={(e) => on({ ctaLabel: e.target.value })} /></Field>
        <Field label="CTA link"><LinkSelect value={(s as any).ctaLink ?? ""} onChange={(v) => on({ ctaLink: v || undefined })} /></Field>
      </>);

    case "video-hero":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={(s as any).subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
        <Field label="Video URL"><TextInput value={(s as any).videoUrl ?? ""} onChange={(e) => on({ videoUrl: e.target.value || undefined })} placeholder="https://..." /></Field>
        <Field label="CTA label"><TextInput value={(s as any).ctaLabel ?? ""} onChange={(e) => on({ ctaLabel: e.target.value || undefined })} /></Field>
        <Field label="CTA link"><LinkSelect value={(s as any).ctaLink ?? ""} onChange={(v) => on({ ctaLink: v || undefined })} /></Field>
      </>);

    case "social-feed":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Handle (e.g. @mybrand)"><TextInput value={(s as any).handle ?? ""} onChange={(e) => on({ handle: e.target.value || undefined })} /></Field>
        <Field label="Columns">
          <select value={String((s as any).columns ?? 3)} onChange={(e) => on({ columns: Number(e.target.value) })} className={inputCls}>
            {[2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      </>);

    case "map-location":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Address"><TextInput value={(s as any).address ?? ""} onChange={(e) => on({ address: e.target.value || undefined })} /></Field>
        <Field label="Phone"><TextInput value={(s as any).phone ?? ""} onChange={(e) => on({ phone: e.target.value || undefined })} /></Field>
        <Field label="Business hours"><TextInput value={(s as any).hours ?? ""} onChange={(e) => on({ hours: e.target.value || undefined })} placeholder="Mon–Fri 9am–6pm" /></Field>
        <Field label="Google Maps embed URL"><TextInput value={(s as any).mapEmbedUrl ?? ""} onChange={(e) => on({ mapEmbedUrl: e.target.value || undefined })} placeholder="https://www.google.com/maps/embed?..." /></Field>
      </>);

    case "size-guide":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={(s as any).subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
        <Field label="Unit">
          <select value={(s as any).unit ?? "cm"} onChange={(e) => on({ unit: e.target.value })} className={inputCls}>
            <option value="cm">cm</option><option value="inches">inches</option>
          </select>
        </Field>
        <Field label="Note"><TextInput value={(s as any).note ?? ""} onChange={(e) => on({ note: e.target.value || undefined })} /></Field>
      </>);

    case "portfolio":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={(s as any).subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
        <Field label="Columns">
          <select value={String((s as any).columns ?? 3)} onChange={(e) => on({ columns: Number(e.target.value) })} className={inputCls}>
            <option value="2">2</option><option value="3">3</option><option value="4">4</option>
          </select>
        </Field>
      </>);

    case "whatsapp-cta":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        <Field label="Subheading"><TextInput value={(s as any).subheading ?? ""} onChange={(e) => on({ subheading: e.target.value || undefined })} /></Field>
        <Field label="WhatsApp number (with country code)"><TextInput value={(s as any).phone ?? ""} onChange={(e) => on({ phone: e.target.value || undefined })} placeholder="2348012345678" /></Field>
        <Field label="Button label"><TextInput value={(s as any).buttonLabel ?? ""} onChange={(e) => on({ buttonLabel: e.target.value || undefined })} placeholder="Chat with us" /></Field>
        <Field label="Pre-filled message"><TextInput value={(s as any).prefilledMessage ?? ""} onChange={(e) => on({ prefilledMessage: e.target.value || undefined })} placeholder="Hello, I'd like to order..." /></Field>
      </>);

    case "trust-badges":
      return (<>
        <Field label="Heading"><TextInput value={(s as any).heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        {((s as any).badges ?? []).map((b: any, i: number) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <Field label="Icon"><TextInput value={b.icon ?? ""} onChange={(e) => on({ badges: (s as any).badges.map((x: any, j: number) => j === i ? { ...x, icon: e.target.value } : x) })} placeholder="shield, truck, check..." /></Field>
            <Field label="Label"><TextInput value={b.label ?? ""} onChange={(e) => on({ badges: (s as any).badges.map((x: any, j: number) => j === i ? { ...x, label: e.target.value } : x) })} /></Field>
            <Field label="Description"><TextInput value={b.description ?? ""} onChange={(e) => on({ badges: (s as any).badges.map((x: any, j: number) => j === i ? { ...x, description: e.target.value || undefined } : x) })} /></Field>
            <button onClick={() => on({ badges: (s as any).badges.filter((_: any, j: number) => j !== i) })} className="text-xs text-destructive">Remove</button>
          </div>
        ))}
        <button onClick={() => on({ badges: [...((s as any).badges ?? []), { icon: "shield", label: "New badge" }] })} className="text-sm text-primary">+ Add badge</button>
      </>);

    case "payment-methods": {
      const pm = s as any;
      return (<>
        <Field label="Heading"><TextInput value={pm.heading ?? ""} onChange={(e) => on({ heading: e.target.value })} /></Field>
        {(pm.methods ?? []).map((m: any, i: number) => (
          <label key={i} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={m.enabled} onChange={(e) => on({ methods: pm.methods.map((x: any, j: number) => j === i ? { ...x, enabled: e.target.checked } : x) })} />
            {m.label}
          </label>
        ))}
        <button onClick={() => on({ methods: [...(pm.methods ?? []), { id: `method-${Date.now()}`, label: "Custom method", enabled: true }] })} className="text-sm text-primary">+ Add method</button>
      </>);
    }

    case "custom":
      return <CustomSectionInspector s={s as unknown as CustomSection} on={on} selectedBlockId={selectedBlockId ?? null} onSelectBlock={onSelectBlock ?? (() => {})} />;

    case "custom-html":
      return (<>
        <Field label="Block label (internal)">
          <TextInput value={(s as any).label ?? ""} onChange={(e) => on({ label: e.target.value || undefined } as any)} placeholder="e.g. Embed widget, Custom banner" />
        </Field>
        <Field label="HTML / Embed code">
          <textarea
            value={(s as any).html ?? ""}
            onChange={(e) => on({ html: e.target.value } as any)}
            rows={10}
            className={`${inputCls} font-mono text-xs resize-y`}
            placeholder={"Paste raw HTML, iframe embeds, or script tags here.\n\nExample:\n<iframe src=\"https://...\" ...></iframe>"}
            spellCheck={false}
          />
        </Field>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          HTML is rendered as-is in the live storefront. Scripts only execute on the published site, not in the editor preview.
        </p>
      </>);
  }
}
