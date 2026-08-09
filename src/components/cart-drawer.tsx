import { Link } from "@tanstack/react-router";
import { XLg, DashLg, PlusLg } from "react-bootstrap-icons";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export function CartDrawer() {
  const { open, setOpen, detailed, subtotal, setQty, remove, count } = useCart();
  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-serif text-2xl">Your bag <span className="text-muted-foreground text-base">({count})</span></h2>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className="rounded-full p-1 hover:bg-secondary">
            <XLg style={{ fontSize: 18 }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {detailed.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <p className="font-serif text-2xl text-foreground">Your bag is empty</p>
              <p className="mt-2 text-sm">Discover something worth keeping.</p>
              <Link
                to="/shop"
                search={{ category: "" }}
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm text-primary-foreground transition-opacity hover:opacity-90"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {detailed.map(({ product, qty }) => (
                <li key={product.slug} className="flex gap-4 py-5">
                  <img src={product.image} alt={product.name} width={96} height={96} loading="lazy" className="h-24 w-24 rounded-md object-cover" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link to="/product/$slug" params={{ slug: product.slug }} onClick={() => setOpen(false)} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                      <span className="font-medium">{formatPrice(product.price * qty)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button onClick={() => setQty(product.slug, qty - 1)} className="px-2 py-1 hover:bg-secondary" aria-label="Decrease"><DashLg style={{ fontSize: 12 }} /></button>
                        <span className="min-w-8 text-center text-sm">{qty}</span>
                        <button onClick={() => setQty(product.slug, qty + 1)} className="px-2 py-1 hover:bg-secondary" aria-label="Increase"><PlusLg style={{ fontSize: 12 }} /></button>
                      </div>
                      <button onClick={() => remove(product.slug)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {detailed.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-serif text-2xl">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
