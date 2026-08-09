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

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
      <h1 className="mt-3 font-serif text-5xl leading-tight md:text-6xl">A small studio for everyday objects.</h1>
      <div className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/80">
        <p>
          Atelier is an independent design studio working at the intersection of craft and quiet utility. We design our pieces in-house, then partner with a handful of small workshops in Portugal, Japan, and the American South to bring them into the world.
        </p>
        <p>
          We release a few new things each season, in small runs. We choose materials that improve with age — full-grain leather, washed linen, brushed steel, hand-glazed stoneware — and we mend what we make, for as long as you own it.
        </p>
        <p>
          The goal is simple: a smaller shelf of better things.
        </p>
      </div>
    </div>
  );
}
