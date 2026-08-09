import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { useStorefront } from "@/lib/storefront";
import { useVendorProducts } from "@/lib/vendorProducts";
import { SectionRenderer } from "@/components/sections";
import { applyStoreSEO } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: (search["category"] as string | undefined) ?? "",
  }),
  head: () => ({
    meta: [
      { title: "Shop — Browse our collection" },
      { name: "description", content: "Browse our full collection of products." },
      { property: "og:title", content: "Shop" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category: urlCategory } = Route.useSearch();
  const [cat, setCat] = useState(urlCategory || "All");
  const { products } = useVendorProducts();
  const filtered = cat === "All" ? products : products.filter((p) => p.category === cat);
  const { pages, navbar } = useStorefront();

  const uniqueCategories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  // Sync category from URL changes
  useEffect(() => {
    setCat(urlCategory || "All");
  }, [urlCategory]);

  useEffect(() => {
    applyStoreSEO(
      navbar.brand,
      `Shop everything from ${navbar.brand}. Browse our full collection and order securely.`,
      window.location.href,
      undefined,
      undefined,
      uniqueCategories,
    );
  }, [navbar.brand, products.length]);
  const shopSections = pages.find((p) => p.slug === "/shop")?.sections ?? [];

  return (
    <>
      {shopSections.map((s) => <SectionRenderer key={s.id} section={s} />)}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The shop</p>
            <h1 className="mt-2 font-serif text-5xl">Everything we make</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", ...uniqueCategories].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`h-9 rounded-full border px-4 text-sm transition-colors ${cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </div>
    </>
  );
}
