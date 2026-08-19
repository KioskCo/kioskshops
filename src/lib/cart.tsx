import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useVendorProducts, getActiveVendorId, effectivePrice, type VendorProduct } from "./vendorProducts";

type CartItem = { slug: string; qty: number };
type CartCtx = {
  items: CartItem[];
  detailed: { product: VendorProduct; qty: number }[];
  count: number;
  subtotal: number;
  add: (slug: string, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (o: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY_BASE = "cart.v1";
/** A per-vendor cart key — without this a customer's cart bled across every
 * vendor's shop (and showed leftover items with nothing but demo products
 * behind them when there was no vendor at all). No vendor → no storage key,
 * so the cart is simply empty and never persisted. */
function cartKey(vendorId: string): string | null {
  return vendorId ? `${KEY_BASE}.${vendorId}` : null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { products } = useVendorProducts();
  const vendorIdRef = useRef(getActiveVendorId());

  // Load (or clear) the cart whenever the active vendor changes, including on
  // first mount and when vendorProducts.tsx dispatches its change event.
  useEffect(() => {
    const loadFor = (vendorId: string) => {
      vendorIdRef.current = vendorId;
      const key = cartKey(vendorId);
      if (!key) { setItems([]); setHydrated(true); return; }
      try {
        const raw = localStorage.getItem(key);
        setItems(raw ? JSON.parse(raw) : []);
      } catch {
        setItems([]);
      }
      setHydrated(true);
    };

    loadFor(getActiveVendorId());
    const onVendorChanged = (e: Event) => {
      const next = e instanceof CustomEvent && typeof e.detail === "string" ? e.detail : getActiveVendorId();
      setHydrated(false);
      loadFor(next);
    };
    window.addEventListener("kiosk_vendor_id_changed", onVendorChanged as EventListener);
    return () => window.removeEventListener("kiosk_vendor_id_changed", onVendorChanged as EventListener);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const key = cartKey(vendorIdRef.current);
    if (key) localStorage.setItem(key, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => {
    const detailed = items
      .map((i) => {
        const product = products.find((p) => p.slug === i.slug);
        return product ? { product, qty: i.qty } : null;
      })
      .filter(Boolean) as { product: VendorProduct; qty: number }[];
    return {
      items,
      detailed,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: detailed.reduce((s, { product, qty }) => s + effectivePrice(product) * qty, 0),
      add: (slug, qty = 1) =>
        setItems((cur) => {
          const found = cur.find((i) => i.slug === slug);
          if (found) return cur.map((i) => (i.slug === slug ? { ...i, qty: i.qty + qty } : i));
          return [...cur, { slug, qty }];
        }),
      remove: (slug) => setItems((cur) => cur.filter((i) => i.slug !== slug)),
      setQty: (slug, qty) =>
        setItems((cur) =>
          qty <= 0 ? cur.filter((i) => i.slug !== slug) : cur.map((i) => (i.slug === slug ? { ...i, qty } : i)),
        ),
      clear: () => setItems([]),
      open,
      setOpen,
    };
  }, [items, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
};
