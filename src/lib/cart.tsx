import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useVendorProducts, effectivePrice, type VendorProduct } from "./vendorProducts";

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
const KEY = "cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { products } = useVendorProducts();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
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
