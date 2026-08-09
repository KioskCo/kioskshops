import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getToken, getStoredUser, clearSession } from "@/lib/shopAuth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kiosk" }, { name: "robots", content: "noindex" }] }),
  component: DashboardGate,
});

function DashboardGate() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) { navigate({ to: "/admin-login" }); return; }
    setChecking(false);
  }, []);

  if (checking) return null;
  return <Dashboard />;
}

function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleSignOut = () => {
    clearSession();
    navigate({ to: "/admin-login" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* Goofy illustration */}
      <div className="mb-8 select-none text-8xl" aria-hidden="true">
        🏗️
      </div>

      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
        Coming soon
      </div>

      <h1 className="mt-6 font-serif text-5xl leading-tight md:text-6xl">
        Dashboard is under construction
      </h1>

      <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">
        We're building something great here. Sales reports, customer insights, the whole deal.
        For now, head to the editor to manage your store.
      </p>

      {/* Fun secondary copy */}
      <p className="mt-3 text-sm text-muted-foreground italic">
        (Our dev is currently running on jollof rice and caffeine ☕)
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          to="/admin"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Open store editor →
        </Link>
        <Link
          to="/templates"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-8 text-sm font-medium hover:bg-secondary transition-colors"
        >
          Manage templates
        </Link>
      </div>

      <div className="mt-16 border-t border-border pt-8 w-full max-w-sm">
        <p className="text-xs text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <button
          onClick={handleSignOut}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
