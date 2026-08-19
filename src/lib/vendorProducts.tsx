/**
 * Vendor products context.
 *
 * - `products`    → the active vendor's real products for grids/lists.
 * - `findProduct` → looks up by id OR slug among the active vendor's products.
 *
 * The bundled demo catalogue is used ONLY when there is no active vendor at
 * all (id === "") — i.e. the local admin/editor preview, which needs
 * something to show before any real store exists. A real deployed vendor
 * shop must never substitute demo products: zero real products means the
 * section renders its own empty state ("No products yet"), and a template
 * section that still references an old demo product slug (left over from
 * starting off the Atelier starter template) must show nothing rather than
 * silently displaying someone else's example product under the vendor's name.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { products as staticProducts, type Product } from "./products";

const VENDOR_ID_CHANGED_EVENT = "kiosk_vendor_id_changed";
const VENDOR_ID_KEY = "kiosk_vendor_id";

export function setActiveVendorId(vendorId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VENDOR_ID_KEY, vendorId);
  window.dispatchEvent(new CustomEvent(VENDOR_ID_CHANGED_EVENT, { detail: vendorId }));
}

/** Reads the currently-active vendor id (empty string when there isn't one — e.g. the admin/editor preview). */
export function getActiveVendorId(): string {
  try { return typeof window !== "undefined" ? (sessionStorage.getItem(VENDOR_ID_KEY) ?? "") : ""; } catch { return ""; }
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
  products: [],
  findProduct: () => undefined,
  getProduct: () => undefined,
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

  // No active vendor at all → this is the local admin/editor preview, which
  // needs something to show. A real vendor (vendorId set) gets ONLY their own
  // products, however many that is — including zero — never the demo catalogue.
  const isPreview = !vendorId;
  const products = isPreview ? demoProducts : vendorProducts;

  const findProduct = (idOrSlug: string): VendorProduct | undefined =>
    vendorProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ??
    (isPreview ? demoProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug) : undefined);

  return (
    <VendorProductsCtx.Provider value={{ products, findProduct, getProduct: findProduct, loading }}>
      {children}
    </VendorProductsCtx.Provider>
  );
}

export const useVendorProducts = () => useContext(VendorProductsCtx);
