import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStorefront } from "@/lib/storefront";
import { SectionRenderer } from "@/components/sections";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Our Store" },
      { name: "description", content: "Learn about us and what we make." },
    ],
  }),
  component: About,
});

function About() {
  const { pages, navbar } = useStorefront();

  useEffect(() => {
    document.title = `About — ${navbar.brand}`;
  }, [navbar.brand]);
  const aboutSections = pages.find((p) => p.slug === "/about")?.sections ?? [];

  if (aboutSections.length > 0) {
    return (
      <div>
        {aboutSections.map((s) => <SectionRenderer key={s.id} section={s} />)}
      </div>
    );
  }

  // Default fallback when no sections are configured — matches contact.tsx's
  // pattern. This used to be hardcoded Atelier demo copy ("independent design
  // studio... Portugal, Japan, and the American South") that every vendor who
  // hadn't customized their About page would see as if it were real content.
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight md:text-6xl">Get to know us.</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Add an About section to this page from the editor to tell your story.
      </p>
    </div>
  );
}
