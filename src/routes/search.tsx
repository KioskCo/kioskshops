import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useVendorProducts } from "@/lib/vendorProducts";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: (s.q as string) ?? "" }),
  component: SearchPage,
});

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<number>(500000);
  const { products } = useVendorProducts();

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const results = products.filter((p) =>
    (q.trim() === "" || (p.name + " " + (p.description ?? "")).toLowerCase().includes(q.toLowerCase())) &&
    (category === "" || p.category === category) &&
    p.price <= maxPrice,
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Search</h1>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
        <aside className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Query</label>
            <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {categories.map((c) => (
                <option key={c} value={c === "All" ? "" : c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Max price: ₦{maxPrice.toLocaleString("en-NG")}</label>
            <input type="range" min={500} max={500000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-1 w-full" />
          </div>
        </aside>
        <div>
          <p className="mb-4 text-sm text-muted-foreground">{results.length} result{results.length === 1 ? "" : "s"}</p>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {results.map((p) => (
              <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} className="group">
                <div className="aspect-square overflow-hidden rounded-md bg-secondary">
                  <img src={p.imageUrl ?? p.image ?? ""} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <p className="mt-2 text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">₦{p.price.toLocaleString("en-NG")}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
