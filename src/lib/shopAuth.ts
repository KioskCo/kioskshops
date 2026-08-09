/**
 * Auth utilities for the shop's web editor.
 * Token is stored in localStorage under "kiosk_editor_token".
 * All API calls go to the same backend as the mobile app.
 */

const TOKEN_KEY = "kiosk_editor_token";
const USER_KEY = "kiosk_editor_user";

function apiBase(): string {
  return (import.meta.env as any).VITE_API_BASE || "/api";
}

export interface EditorUser {
  id: string;
  email: string;
  name: string | null;
  businessName: string | null;
  username: string | null;
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function getStoredUser(): EditorUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function devLogin(): void {
  const fakeUser: EditorUser = {
    id: "dev-local",
    email: "dev@localhost",
    name: "Dev User",
    businessName: "My Store",
    username: "devstore",
  };
  localStorage.setItem(TOKEN_KEY, "dev-token-local");
  localStorage.setItem(USER_KEY, JSON.stringify(fakeUser));
}

function storeSession(token: string, user: EditorUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(email: string, password: string): Promise<EditorUser> {
  const res = await fetch(`${apiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json() as { success: boolean; token?: string; user?: any; error?: string };
  if (!json.success || !json.token) throw new Error(json.error ?? "Login failed");
  const user: EditorUser = {
    id: json.user?.id ?? "",
    email: json.user?.email ?? email,
    name: json.user?.name ?? null,
    businessName: json.user?.businessName ?? null,
    username: json.user?.username ?? null,
  };
  storeSession(json.token, user);
  return user;
}

export async function fetchMe(): Promise<EditorUser | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${apiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { clearSession(); return null; }
    const json = await res.json() as { user?: any };
    return json.user ?? null;
  } catch {
    return null;
  }
}

export interface DbTemplate {
  id: string;
  name: string;
  launched: boolean | null;
  settings: { templateJson?: string } | null;
}

/** Fetch the vendor's template list from the API. Returns [] on error. */
export async function fetchTemplates(): Promise<DbTemplate[]> {
  const token = getToken();
  if (!token) return [];
  try {
    const res = await fetch(`${apiBase()}/templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const json = await res.json() as { success: boolean; data?: DbTemplate[] };
    return json.success ? (json.data ?? []) : [];
  } catch {
    return [];
  }
}

/** Save the current template JSON to the backend (called on Publish). */
export async function publishTemplate(templateId: string, templateJson: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${apiBase()}/templates/${templateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ settings: { templateJson } }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(json.error ?? "Publish failed");
  }
}

/** Launch the template to make it live on kiosk.store/@username. */
export async function launchTemplate(templateId: string): Promise<{ launchUrl: string }> {
  const token = getToken();
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${apiBase()}/templates/${templateId}/launch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({}),
  });
  const json = await res.json() as { success: boolean; data?: { launchUrl?: string }; error?: string };
  if (!json.success) throw new Error(json.error ?? "Launch failed");
  return { launchUrl: json.data?.launchUrl ?? "" };
}
