import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Copy, Edit2, Layers, Plus, Store, Trash2, Upload, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStorefront, type Template } from "@/lib/storefront";
import { getToken, getStoredUser } from "@/lib/shopAuth";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Templates — Kiosk" }, { name: "robots", content: "noindex" }] }),
  component: TemplatesGate,
});

function TemplatesGate() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) { navigate({ to: "/admin-login" }); return; }
    setChecking(false);
  }, []);

  if (checking) return null;
  return <TemplatesPage />;
}

function TemplatesPage() {
  const { templates, activeTemplateId, applyTemplate, newTemplate, newBlankTemplate, duplicateTemplate, deleteTemplate, patchTemplate, renameTemplate } = useStorefront();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createMode, setCreateMode] = useState<"atelier" | "blank">("atelier");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (showCreate) setTimeout(() => nameRef.current?.focus(), 50); }, [showCreate]);

  const openEditor = (id: string, studio = false) => {
    applyTemplate(id);
    if (studio) navigate({ to: "/admin", search: { studio: true } });
    else navigate({ to: "/admin" });
  };

  const handleCreate = () => {
    if (!createName.trim()) return;
    const isBlank = createMode === "blank";
    const id = isBlank ? newBlankTemplate(createName.trim()) : newTemplate(createName.trim());
    applyTemplate(id);
    setCreateName("");
    setShowCreate(false);
    if (isBlank) navigate({ to: "/admin", search: { studio: true } });
    else navigate({ to: "/admin" });
  };

  const confirmDelete = () => {
    if (deleteTarget) { deleteTemplate(deleteTarget.id); setDeleteTarget(null); }
  };

  const stats = {
    total: templates.length,
    pages: templates.reduce((n, t) => n + t.pages.length, 0),
    sections: templates.reduce((n, t) => n + t.pages.reduce((a, p) => a + p.sections.length, 0), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero header ── */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-secondary via-background to-accent/5">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <a href="/admin" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to editor
                </a>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Store builder</p>
              <h1 className="mt-2 font-serif text-5xl sm:text-6xl leading-tight">Templates</h1>
              <p className="mt-3 max-w-md text-base text-muted-foreground">
                Design your store from scratch or start from a styled layout. Each template is a full storefront you can customise.
              </p>
              <div className="mt-5 flex items-center gap-5 text-sm text-muted-foreground">
                <span><strong className="text-foreground font-semibold">{stats.total}</strong> template{stats.total !== 1 ? "s" : ""}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span><strong className="text-foreground font-semibold">{stats.pages}</strong> page{stats.pages !== 1 ? "s" : ""}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span><strong className="text-foreground font-semibold">{stats.sections}</strong> section{stats.sections !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-2xl bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="h-4 w-4" /> New template
            </button>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/6 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-primary/4 blur-3xl" />
      </div>

      {/* ── Template grid ── */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
              <Store className="h-9 w-9 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No templates yet</h2>
            <p className="mt-2 text-muted-foreground">Create your first template to get started.</p>
            <button onClick={() => setShowCreate(true)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Create template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                active={t.id === activeTemplateId}
                onEdit={() => openEditor(t.id)}
                onDuplicate={() => duplicateTemplate(t.id)}
                onRename={(name) => renameTemplate(t.id, name)}
                onThumbnailChange={(thumbnail) => patchTemplate(t.id, { thumbnail })}
                onDelete={templates.length > 1 ? () => setDeleteTarget(t) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-background p-7 shadow-2xl ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">New template</h2>
                <p className="mt-1 text-sm text-muted-foreground">Give it a name then choose your starting point.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border hover:bg-secondary transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              ref={nameRef}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Summer Collection, Main Store…"
              className="h-12 w-full rounded-xl border border-border bg-secondary/40 px-4 text-sm outline-none focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setCreateMode("atelier")}
                className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${createMode === "atelier" ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border hover:border-primary/40 hover:bg-secondary/60"}`}
              >
                {createMode === "atelier" && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-bold">From Atelier</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Pre-styled with Kiosk design tokens — ready to tweak</p>
              </button>
              <button
                onClick={() => setCreateMode("blank")}
                className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${createMode === "blank" ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "border-border hover:border-primary/40 hover:bg-secondary/60"}`}
              >
                {createMode === "blank" && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                )}
                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-border">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold">Blank Canvas</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Opens the Studio — build sections freely from scratch</p>
              </button>
            </div>

            <button
              onClick={handleCreate}
              disabled={!createName.trim()}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {createMode === "blank" ? "Create & open Studio" : "Create & open Editor"}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-7 shadow-2xl ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Delete template?</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">"{deleteTarget.name}"</span> will be permanently deleted. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button onClick={() => setDeleteTarget(null)} className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-destructive px-5 text-sm text-white hover:opacity-90 transition-opacity">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template, active, onEdit, onDuplicate, onDelete, onThumbnailChange, onRename,
}: {
  template: Template; active: boolean; onEdit: () => void; onDuplicate: () => void;
  onDelete?: () => void; onThumbnailChange: (thumbnail: string) => void; onRename: (name: string) => void;
}) {
  const thumbRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(template.name);
  const sectionCount = template.pages.reduce((n, p) => n + p.sections.length, 0);

  const handleThumbFile = (file: File) => {
    if (file.size > 3 * 1024 * 1024) { if (!window.confirm("Image > 3MB. Continue?")) return; }
    const r = new FileReader();
    r.onload = () => onThumbnailChange(String(r.result));
    r.readAsDataURL(file);
  };

  const saveName = () => {
    if (draftName.trim()) onRename(draftName.trim());
    setEditingName(false);
  };

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border-2 bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/8 ${active ? "border-primary shadow-lg shadow-primary/10" : "border-border shadow-sm"}`}
    >
      {/* Thumbnail */}
      <div className="group/thumb relative aspect-[16/10] overflow-hidden bg-secondary">
        {template.thumbnail ? (
          <img src={template.thumbnail} alt={template.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <DefaultThumbnail template={template} />
        )}
        {active && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-md">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80 animate-pulse" /> Active
          </span>
        )}
        <button
          onClick={() => thumbRef.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover/thumb:opacity-100"
        >
          <Upload className="h-5 w-5 text-white" />
          <span className="text-[11px] font-medium text-white">Change cover</span>
        </button>
        <input ref={thumbRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbFile(f); e.target.value = ""; }} />
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                autoFocus
                className="w-full rounded-lg border border-primary bg-transparent px-2 py-0.5 text-base font-bold outline-none"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-base font-bold">{template.name}</h2>
                <button
                  onClick={() => { setDraftName(template.name); setEditingName(true); }}
                  title="Rename"
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {template.pages.length} page{template.pages.length !== 1 ? "s" : ""} · {sectionCount} section{sectionCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onEdit}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-90"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={onDuplicate}
            title="Duplicate"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              title="Delete"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function DefaultThumbnail({ template }: { template: Template }) {
  const hero = template.pages[0]?.sections.find((s) => s.type === "hero") as any;
  const accent = template.pages[0]?.sections.find((s) => s.type === "announcement") as any;
  const heroBg = hero?.bgColor ?? "#1a1a2e";
  const accentBg = accent?.bgColor ?? "#16213e";
  const isDark = template.theme === "dark";
  const pageBg = isDark ? "#0f0f0f" : "#f9f7f4";

  return (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: pageBg }}>
      {/* Announcement bar */}
      <div className="h-5 w-full shrink-0 flex items-center justify-center px-3" style={{ backgroundColor: accentBg }}>
        <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.4)" }} />
      </div>
      {/* Navbar mock */}
      <div className="flex h-7 shrink-0 items-center justify-between px-4" style={{ backgroundColor: pageBg, borderBottom: `1px solid ${isDark ? "#222" : "#eee"}` }}>
        <div className="h-2 w-14 rounded-full" style={{ backgroundColor: isDark ? "#444" : "#ccc" }} />
        <div className="flex gap-2">
          {[1,2,3].map(i => <div key={i} className="h-1.5 w-8 rounded-full" style={{ backgroundColor: isDark ? "#333" : "#ddd" }} />)}
        </div>
      </div>
      {/* Hero */}
      <div className="flex shrink-0 items-center justify-center px-6 py-5" style={{ backgroundColor: heroBg, flex: "0 0 46%" }}>
        <div className="text-center">
          <div className="mx-auto mb-2 h-3 w-24 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.75)" }} />
          <div className="mx-auto mb-3 h-2 w-32 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.4)" }} />
          <div className="mx-auto h-5 w-20 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.35)" }} />
        </div>
      </div>
      {/* Product cards */}
      <div className="flex flex-1 items-start gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-1 flex-col gap-1.5">
            <div className="aspect-square w-full rounded-lg" style={{ backgroundColor: isDark ? "#1e1e1e" : "#e8e4dc" }} />
            <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: isDark ? "#2a2a2a" : "#d4cfc6" }} />
            <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: isDark ? "#222" : "#ccc" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
