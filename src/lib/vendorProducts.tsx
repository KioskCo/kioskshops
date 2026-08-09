/**
 * Vendor products context.
 *
 * - `products`    → vendor's real products for grids/lists. Falls back to demo if none loaded yet.
 * - `findProduct` → looks up by id OR slug; tries vendor products first, then demo fallback.
 *                   This means template sections that still reference demo slugs keep showing
 *                   demo products until the vendor explicitly picks their own via the toggle.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { products as staticProducts, type Product } from "./products";

const VENDOR_ID_CHANGED_EVENT = "kiosk_vendor_id_changed";

export function setActiveVendorId(vendorId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("kiosk_vendor_id", vendorId);
  window.dispatchEvent(new CustomEvent(VENDOR_ID_CHANGED_EVENT, { detail: vendorId }));
}

export type VendorProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  images?: string[];
  category: string;
  stock: number;
  tagline: string;
  image: string;
  salePrice?: number | null;
  saleEndsAt?: string | null;
  preorder?: boolean;
  preorderReleaseDate?: string | null;
  vendorUsername?: string;
};

/**
 * Effective price charged for a product: the active sale price when a sale is live,
 * otherwise the list price. The server applies the same rule when deriving order totals.
 */
export function effectivePrice(p: VendorProduct): number {
  if (p.salePrice != null && Number(p.salePrice) > 0 && p.saleEndsAt) {
    const ends = new Date(p.saleEndsAt);
    if (ends > new Date()) return Number(p.salePrice);
  }
  return Number(p.price ?? 0);
}

type Ctx = {
  /** For shop grids and lists — vendor products when loaded, demo products otherwise. */
  products: VendorProduct[];
  /** For template section lookup — tries vendor products first, falls back to demo. */
  findProduct: (idOrSlug: string) => VendorProduct | undefined;
  /** Alias for findProduct kept for backwards compat. */
  getProduct: (idOrSlug: string) => VendorProduct | undefined;
  loading: boolean;
};

const demoProducts: VendorProduct[] = staticProducts.map(toVendorProduct);

const VendorProductsCtx = createContext<Ctx>({
  products: demoProducts,
  findProduct: (s) => demoProducts.find((p) => p.id === s || p.slug === s),
  getProduct:  (s) => demoProducts.find((p) => p.id === s || p.slug === s),
  loading: false,
});

function toVendorProduct(p: Product): VendorProduct {
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.image,
    category: p.category,
    stock: 999,
    tagline: p.tagline,
    image: p.image,
    salePrice: null,
    saleEndsAt: null,
    preorder: false,
    preorderReleaseDate: null,
  };
}

export function VendorProductsProvider({ children }: { children: ReactNode }) {
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const readVendorId = () => sessionStorage.getItem("kiosk_vendor_id") ?? "";
    const syncVendorId = (event?: Event) => {
      const next =
        event instanceof CustomEvent && typeof event.detail === "string"
          ? event.detail
          : readVendorId();
      setVendorId(next);
    };

    syncVendorId();
    window.addEventListener(VENDOR_ID_CHANGED_EVENT, syncVendorId as EventListener);
    window.addEventListener("storage", syncVendorId);

    return () => {
      window.removeEventListener(VENDOR_ID_CHANGED_EVENT, syncVendorId as EventListener);
      window.removeEventListener("storage", syncVendorId);
    };
  }, []);

  useEffect(() => {
    if (!vendorId) {
      setVendorProducts([]);
      return;
    }

    const base = ((import.meta as any).env?.["VITE_API_BASE"] as string | undefined) ?? "/api";
    let cancelled = false;
    setLoading(true);
    fetch(`${base}/buyers/products?vendorId=${encodeURIComponent(vendorId)}`)
      .then((r) => r.json())
      .then((json: { success: boolean; data?: VendorProduct[] }) => {
        if (cancelled) return;
        if (json.success && json.data && json.data.length > 0) {
          setVendorProducts(
            json.data.map((p) => ({
              ...p,
              tagline: p.description?.slice(0, 60) ?? "",
              image: p.imageUrl ?? staticProducts[0]!.image,
              images: Array.isArray(p.images) ? p.images : [],
            }))
          );
        } else {
          setVendorProducts([]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  // Grid/list: real vendor products, or demo if none loaded
  const products = vendorProducts.length > 0 ? vendorProducts : demoProducts;

  // Section lookup: check vendor products first (by UUID), then demo (by slug)
  const findProduct = (idOrSlug: string): VendorProduct | undefined =>
    vendorProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ??
    demoProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug);

  return (
    <VendorProductsCtx.Provider value={{ products, findProduct, getProduct: findProduct, loading }}>
      {children}
    </VendorProductsCtx.Provider>
  );
}

export const useVendorProducts = () => useContext(VendorProductsCtx);
