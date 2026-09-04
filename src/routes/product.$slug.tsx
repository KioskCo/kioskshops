import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bag, BagPlus, Basket3, Cart3, CartPlus, CheckLg, DashLg, Plus, PlusLg, StarFill, Star } from "react-bootstrap-icons";
import { formatPrice } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/product-card";
import { useStorefront, type CartBtnIcon } from "@/lib/storefront";
import { useVendorProducts, effectivePrice } from "@/lib/vendorProducts";
import { SectionRenderer } from "@/components/sections";
import { setMetaProperty, setMeta, injectJsonLd, setCanonical } from "@/lib/seo";

function CartGlyph({ icon }: { icon: CartBtnIcon }) {
  switch (icon) {
    case "plus": return <Plus style={{ fontSize: 16 }} />;
    case "cart": return <Cart3 style={{ fontSize: 15 }} />;
    case "cart-plus": return <CartPlus style={{ fontSize: 15 }} />;
    case "bag-plus": return <BagPlus style={{ fontSize: 15 }} />;
    case "basket": return <Basket3 style={{ fontSize: 15 }} />;
    case "bag":
    default: return <Bag style={{ fontSize: 15 }} />;
  }
}

export const Route = createFileRoute("/product/$slug")({
  // Loader just surfaces the slug — actual product lookup is in the component
  // so it works for both static demo products AND live vendor products.
  loader: ({ params }) => ({ slug: params.slug }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `Product — ${loaderData.slug}` }] : [],
  }),
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-serif text-4xl">Product not found</h1>
      <Link to="/shop" search={{ category: "" }} className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground">Back to shop</Link>
    </div>
  ),
});

function useCountdown(endsAt: string | null | undefined): string | null {
  const [left, setLeft] = useState<string | null>(null);
  useEffect(() => {
    if (!endsAt) { setLeft(null); return; }
    const calc = () => {
      const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
      if (diff === 0) { setLeft(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return left;
}

interface ReviewData {
  id: string;
  buyerName: string;
  rating: number;
  body: string | null;
  reply: string | null;
  createdAt: string;
}

function ProductPage() {
  const { slug } = Route.useLoaderData();
  const { products, getProduct, loading } = useVendorProducts();
  const product = getProduct(slug);
  const { add, setOpen } = useCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { pages, navbar } = useStorefront();
  const productPageSections = pages.find((p) => p.slug === "/product/:slug")?.sections ?? [];
  const productDetailConfig = productPageSections.find((s) => s.type === "product-detail") as { cartBtnIcon?: CartBtnIcon } | undefined;
  const cartIcon = productDetailConfig?.cartBtnIcon ?? "bag";
  // This page already renders its own gallery/buy-box UI above (with logic
  // this generic section-loop can't reproduce - image gallery, reviews,
  // restock alerts) — a "product-detail" section here would render that whole
  // block a second time. The default Product page always includes one (see
  // defaultProductSections()), so this isn't a rare edge case. A configured
  // "related-products" section takes over from the hardcoded fallback below it.
  const hasRelatedSection = productPageSections.some((s) => s.type === "related-products");
  const trailingSections = productPageSections.filter((s) => s.type !== "product-detail");

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [restockPhone, setRestockPhone] = useState("");
  const [restockSent, setRestockSent] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const countdown = useCountdown((product as any)?.saleEndsAt);

  useEffect(() => {
    if (!product?.id) return;
    const base = (import.meta.env as any)["VITE_API_BASE"] ?? "/api";
    fetch(`${base}/reviews/product/${product.id}`)
      .then((r) => r.json())
      .then((res: any) => {
        if (Array.isArray(res?.data)) setReviews(res.data as ReviewData[]);
        if (res?.avgRating != null) setAvgRating(res.avgRating as number);
      })
      .catch(() => null);
  }, [product?.id]);

  const related = product
    ? products.filter((p) => p.slug !== product.slug && p.category === product.category).slice(0, 3)
    : [];

  useEffect(() => {
    if (!product) return;
    const pageUrl = window.location.href;
    const image = product.imageUrl ?? product.image ?? "";
    const description = product.description || product.tagline || `Buy ${product.name} online.`;

    document.title = `${product.name} — ${navbar.brand}`;

    // Open Graph
    setMetaProperty("og:title", `${product.name} — ${navbar.brand}`);
    setMetaProperty("og:description", description);
    setMetaProperty("og:image", image);
    setMetaProperty("og:url", pageUrl);
    setMetaProperty("og:type", "product");
    setMetaProperty("product:price:amount", String(product.price));
    setMetaProperty("product:price:currency", "NGN");

    // Twitter card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", `${product.name} — ${navbar.brand}`);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);

    // Geo (Nigeria)
    setMeta("geo.region", "NG");
    setMeta("geo.country", "NG");
    setMeta("robots", "index, follow");

    setCanonical(pageUrl);

    // Product structured data — enables rich results in Google (price, availability)
    injectJsonLd({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image,
      description,
      sku: product.slug,
      brand: { "@type": "Brand", name: navbar.brand },
      offers: {
        "@type": "Offer",
        url: pageUrl,
        price: product.price,
        priceCurrency: "NGN",
        availability: isOOS ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        seller: { "@type": "Organization", name: navbar.brand },
      },
    }, "product-jsonld");
  }, [product?.slug, navbar.brand]);

  if (loading && !product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-serif text-4xl">Product not found</h1>
        <Link to="/shop" search={{ category: "" }} className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground">
          Back to shop
        </Link>
      </div>
    );
  }

  const isOOS = !!product && (product as any).stock === 0;
  const isPreorder = !!product && (product as any).preorder === true;
  const canPurchase = !isOOS || isPreorder;
  const unitPrice = effectivePrice(product);
  const extraImages: string[] = Array.isArray((product as any).images) ? (product as any).images : [];
  const gallery = [product.imageUrl ?? product.image ?? "", ...extraImages.filter(Boolean)]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .slice(0, 5);

  const onAdd = () => {
    if (!canPurchase) return;
    add(product.slug, qty);
    setAdded(true);
    setOpen(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const onBuyNow = () => {
    if (!canPurchase) return;
    add(product.slug, qty);
    navigate({ to: "/checkout" });
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link to="/shop" search={{ category: "" }} className="hover:text-foreground">Shop</Link> <span className="mx-2">/</span> <span>{product.category}</span>
        </nav>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <div className="overflow-hidden rounded-lg bg-secondary">
              {gallery[activeImg] && <img src={gallery[activeImg]} alt={product.name} className="aspect-square w-full object-cover" />}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {gallery.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`overflow-hidden rounded-md border-2 transition-colors ${activeImg === i ? "border-primary" : "border-transparent hover:border-border"}`}>
                    <img src={img} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.category}</p>
            <h1 className="mt-3 font-serif text-5xl leading-tight">{product.name}</h1>
            {product.tagline && <p className="mt-3 text-lg text-muted-foreground">{product.tagline}</p>}
            {/* Flash sale price */}
            {(product as any).salePrice && countdown ? (
              <div className="mt-6">
                <div className="flex items-center gap-3">
                  <p className="font-serif text-3xl text-red-600">{formatPrice(parseFloat((product as any).salePrice))}</p>
                  <p className="font-serif text-xl text-muted-foreground line-through">{formatPrice(Number(product.price))}</p>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                    {Math.round((1 - parseFloat((product as any).salePrice) / Number(product.price)) * 100)}% OFF
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-600">Sale ends in {countdown}</span>
                </div>
              </div>
            ) : (
              <p className="mt-6 font-serif text-3xl">{formatPrice(unitPrice)}</p>
            )}
            {isPreorder && (
              <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-700">PREORDER — payable now</p>
                <p className="mt-1 text-sm text-indigo-800/80">
                  {product.preorderReleaseDate
                    ? `Estimated to ship on ${new Date(product.preorderReleaseDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}. Your payment is escrowed until you receive it.`
                    : "This item is a preorder. Your payment is escrowed and released only when your order ships."}
                </p>
              </div>
            )}
            {product.description && <p className="mt-8 leading-relaxed text-foreground/80">{product.description}</p>}

            <div className="mt-10 flex items-center gap-4">
              <div className={`inline-flex h-12 items-center rounded-full border ${!canPurchase ? "border-border/40 opacity-40" : "border-border"}`}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={!canPurchase} className="px-4 hover:bg-secondary rounded-l-full disabled:cursor-not-allowed" aria-label="Decrease"><DashLg style={{ fontSize: 16 }} /></button>
                <span className="min-w-10 text-center text-sm">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} disabled={!canPurchase} className="px-4 hover:bg-secondary rounded-r-full disabled:cursor-not-allowed" aria-label="Increase"><PlusLg style={{ fontSize: 16 }} /></button>
              </div>
              <button
                onClick={onAdd}
                disabled={!canPurchase}
                className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm transition-opacity ${!canPurchase ? "bg-secondary text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"}`}
              >
                {!canPurchase
                  ? "Out of Stock"
                  : isPreorder
                    ? (added ? (<><CheckLg style={{ fontSize: 16 }} /> Added</>) : `Preorder — ${formatPrice(unitPrice * qty)}`)
                    : (added
                        ? (<><CheckLg style={{ fontSize: 16 }} /> Added</>)
                        : (<><CartGlyph icon={cartIcon} /> Add to bag — {formatPrice(unitPrice * qty)}</>))}
              </button>
            </div>
            {canPurchase && (
              <button
                onClick={onBuyNow}
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-primary text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Proceed to checkout — {formatPrice(unitPrice * qty)}
              </button>
            )}

            {/* Restock alert for out-of-stock products (excludes preorders, which are purchasable) */}
            {((product as any).inStock === false || (isOOS && !isPreorder)) ? (
              <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-5">
                <p className="text-sm font-medium">Out of stock — get notified when it's back</p>
                {restockSent ? (
                  <p className="mt-2 text-sm text-emerald-600">You're on the list! We'll SMS you when it's back.</p>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="tel"
                      placeholder="Your phone number"
                      value={restockPhone}
                      onChange={(e) => setRestockPhone(e.target.value)}
                      className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      onClick={async () => {
                        if (!restockPhone || restockPhone.length < 10) return;
                        const base = (import.meta.env as any)["VITE_API_BASE"] ?? "/api";
                        await fetch(`${base}/store/${(product as any).vendorUsername ?? "store"}/products/${product.id}/restock-alert`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ customerPhone: restockPhone }),
                        }).catch(() => null);
                        setRestockSent(true);
                      }}
                      className="h-10 rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:opacity-90"
                    >
                      Notify me
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <ul className="mt-10 space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
              <li>• Free shipping on orders over ₦15,000</li>
              <li>• 30-day easy returns</li>
            </ul>
          </div>
        </div>

        {reviews.length > 0 && (
          <section className="mt-20 border-t border-border pt-12">
            <div className="mb-8 flex items-center gap-4">
              <h2 className="font-serif text-3xl">Customer Reviews</h2>
              {avgRating != null && (
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} />
                  <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {reviews.slice(0, 8).map((r) => (
                <div key={r.id} className="border-b border-border pb-6 last:border-0">
                  <div className="mb-2 flex items-center gap-3">
                    <StarRating rating={r.rating} />
                    <span className="text-sm font-medium">{r.buyerName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.body && <p className="text-sm leading-relaxed text-foreground/80">{r.body}</p>}
                  {r.reply && (
                    <div className="mt-3 rounded-lg bg-secondary px-4 py-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Seller reply</p>
                      <p className="text-sm text-foreground/80">{r.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Only a fallback for a template with no "related-products" section
            configured — normally that section (below, vendor-configurable
            heading/count) is what shows here, so it isn't shown twice. */}
        {!hasRelatedSection && related.length > 0 && (
          <section className="mt-24">
            <h2 className="font-serif text-3xl">You might also like</h2>
            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => <ProductCard key={p.slug} product={p as any} />)}
            </div>
          </section>
        )}
      </div>
      {trailingSections.map((s: any) => <SectionRenderer key={s.id} section={s} />)}
    </>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= Math.round(rating)
          ? <StarFill key={i} className="text-amber-400" style={{ fontSize: 13 }} />
          : <Star key={i} className="text-muted-foreground" style={{ fontSize: 13 }} />,
      )}
    </div>
  );
}
