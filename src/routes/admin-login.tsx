import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { login, getToken, devLogin } from "@/lib/shopAuth";
import splashLogo from "@/assets/splash.png";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [{ title: "Editor Login — Kiosk" }, { name: "robots", content: "noindex" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in → go to dashboard
  if (typeof window !== "undefined" && getToken()) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message ?? "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-lg">
        {/* Brand */}
        <div className="mb-8 text-center">
          <img src={splashLogo} alt="Kiosk" className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain" />
          <h1 className="text-xl font-semibold">Sign in to your store</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the email and password from the Kiosk merchant app
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <span className="font-medium text-foreground">Download the Kiosk app to sign up.</span>
        </p>

        {import.meta.env.DEV && (
          <div className="mt-6 border-t border-dashed border-border pt-5">
            <p className="mb-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Local dev only
            </p>
            <button
              type="button"
              onClick={() => { devLogin(); navigate({ to: "/admin" }); }}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10"
            >
              ⚡ Dev Login (skip auth)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
