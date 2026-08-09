import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/sitemap.xml")({
  GET: async () => {
    const base = (import.meta.env["VITE_API_BASE"] as string | undefined) ?? "/api";

    type SitemapStore = { url: string | null; updatedAt: string | null };
    let stores: SitemapStore[] = [];

    try {
      const r = await fetch(`${base}/store/sitemap`);
      if (r.ok) {
        const json = (await r.json()) as { success: boolean; stores: SitemapStore[] };
        if (json.success) stores = json.stores;
      }
    } catch {
      // proceed with empty store list — at least serve static URLs
    }

    const now = new Date().toISOString().split("T")[0];
    const staticUrls = [
      { loc: "https://kiosk.store/", priority: "1.0", changefreq: "daily" },
      { loc: "https://kiosk.store/shop", priority: "0.9", changefreq: "daily" },
    ];

    const vendorUrls = stores
      .filter((s) => s.url)
      .map((s) => ({
        loc: s.url!,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: s.updatedAt ? new Date(s.updatedAt).toISOString().split("T")[0] : now,
      }));

    const allUrls = [...staticUrls, ...vendorUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${(u as any).lastmod ?? now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  },
});
