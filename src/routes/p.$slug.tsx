import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStorefront } from "@/lib/storefront";
import { SectionRenderer } from "@/components/sections";

// Legacy /p/:slug route — still renders but the new clean-URL route ($.tsx) is preferred.
export const Route = createFileRoute("/p/$slug")({
  component: LegacyPageView,
});

function LegacyPageView() {
  const { slug } = Route.useParams();
  const { pages } = useStorefront();

  // Redirect to the clean URL via window.location (once, client-side)
  useEffect(() => {
    window.location.replace(`/${slug}`);
  }, [slug]);

  // Render the page while the redirect is in flight (fallback)
  const page = pages.find((p) => {
    const s = p.slug.replace(/^\//, "");
    return s === slug;
  });

  if (!page?.sections.length) return null;
  return <div>{page.sections.map((s) => <SectionRenderer key={s.id} section={s} />)}</div>;
}
