import { Link } from "@tanstack/react-router";

/** Shown when a vendor has temporarily paused their store — path-based (/@username)
 * and custom-domain storefronts both route through this so the experience matches. */
export function StorePausedPage({ storeName, label }: { storeName: string; label: string }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* subtle decorative rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full border border-border/30 opacity-40" />
        <div className="absolute h-[400px] w-[400px] rounded-full border border-border/40 opacity-50" />
        <div className="absolute h-[220px] w-[220px] rounded-full border border-border/60 opacity-60" />
      </div>

      <div className="relative z-10 max-w-md text-center">
        {/* wrench + store icon stack */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Down for maintenance
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
          {storeName || label}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          We're making some updates and will be back shortly. Thanks for your patience!
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Go to homepage
          </Link>
          <a
            href={`mailto:?subject=When will ${storeName || label} be back?`}
            className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Get notified
          </a>
        </div>

        <p className="mt-10 text-xs text-muted-foreground/60">
          Powered by <span className="font-semibold text-foreground">Kiosk</span>
        </p>
      </div>
    </div>
  );
}
