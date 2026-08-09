import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckLg, Clock, BoxSeam, Truck, XCircleFill } from "react-bootstrap-icons";
import { formatPrice } from "@/lib/products";
import { useStorefront } from "@/lib/storefront";

export const Route = createFileRoute("/order/$orderNumber")({
  head: () => ({
    meta: [{ title: "Order Status" }],
  }),
  component: OrderStatus,
});

type OrderItem = { name: string; qty: number; unitPrice: string };
type Order = {
  orderNumber: string;
  status: string;
  escrowStatus: string | null;
  totalAmount: string;
  buyerName: string;
  buyerAddress: string | null;
  buyerCity: string | null;
  createdAt: string;
  trackingId: string | null;
  logisticsProvider: string | null;
  items: OrderItem[];
};

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending:   { label: "Order received",  icon: <Clock style={{ fontSize: 24 }} />,     color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  paid:      { label: "Payment confirmed", icon: <CheckLg style={{ fontSize: 24 }} />, color: "text-green-700 bg-green-50 border-green-200" },
  shipped:   { label: "On its way",      icon: <Truck style={{ fontSize: 24 }} />,     color: "text-blue-700 bg-blue-50 border-blue-200" },
  delivered: { label: "Delivered",       icon: <BoxSeam style={{ fontSize: 24 }} />,   color: "text-green-700 bg-green-50 border-green-200" },
  cancelled: { label: "Cancelled",       icon: <XCircleFill style={{ fontSize: 24 }} />, color: "text-red-700 bg-red-50 border-red-200" },
};

function OrderStatus() {
  const { orderNumber } = Route.useParams();
  const { navbar } = useStorefront();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Order ${orderNumber} — ${navbar.brand}`;
  }, [orderNumber, navbar.brand]);

  useEffect(() => {
    const base = (import.meta.env as any)["VITE_API_BASE"] ?? "/api";
    fetch(`${base}/buyers/orders/${encodeURIComponent(orderNumber)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Order not found");
        return r.json();
      })
      .then((json: { success: boolean; data: Order }) => {
        if (!json.success) throw new Error("Order not found");
        setOrder(json.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load order"))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-7xl font-semibold">404</p>
        <p className="mt-3 text-muted-foreground">
          {error ?? "Order not found."}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Check your order number and try again, or{" "}
          <Link to="/shop" search={{ category: "" }} className="underline hover:text-foreground">continue shopping</Link>.
        </p>
      </div>
    );
  }

  const meta = STATUS_META[order.status] ?? STATUS_META["pending"]!;
  const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <div className={`mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border ${meta.color}`}>
          {meta.icon}
        </div>
        <h1 className="font-serif text-4xl">{meta.label}</h1>
        <p className="mt-2 text-muted-foreground">Order <span className="font-mono">{order.orderNumber}</span> · placed {date}</p>
      </div>

      <div className="mt-10 rounded-lg border border-border">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-lg">Items</h2>
        </div>
        <ul className="divide-y divide-border">
          {order.items.map((item, i) => (
            <li key={i} className="flex items-center justify-between px-6 py-4 text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">Qty {item.qty}</p>
              </div>
              <span>{formatPrice(Number(item.unitPrice) * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="font-serif text-lg">Total</span>
          <span className="font-serif text-xl">{formatPrice(Number(order.totalAmount))}</span>
        </div>
      </div>

      {(order.buyerAddress || order.buyerCity) && (
        <div className="mt-6 rounded-lg border border-border px-6 py-4 text-sm">
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Shipping to</p>
          <p className="font-medium">{order.buyerName}</p>
          {order.buyerAddress && <p className="text-muted-foreground">{order.buyerAddress}</p>}
          {order.buyerCity && <p className="text-muted-foreground">{order.buyerCity}</p>}
        </div>
      )}

      {order.trackingId && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-6 py-4 text-sm">
          <p className="mb-1 text-xs uppercase tracking-wider text-blue-600">Shipment tracking</p>
          <p className="font-medium text-blue-900">
            {order.logisticsProvider === "kwik" ? "Kwik Delivery" : "Terminal Africa"}
          </p>
          <p className="mt-1 font-mono text-xs text-blue-700">{order.trackingId}</p>
          <a
            href={
              order.logisticsProvider === "kwik"
                ? `https://app.kwik.delivery/track/${order.trackingId}`
                : `https://app.terminal.africa/track/${order.trackingId}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-blue-600 px-5 text-xs text-white hover:bg-blue-700"
          >
            <Truck style={{ fontSize: 14 }} />
            Track live
          </a>
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          to="/invoice/$orderNumber"
          params={{ orderNumber }}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-6 text-sm hover:bg-secondary"
        >
          View invoice
        </Link>
        <Link to="/shop" search={{ category: "" }} className="text-sm text-muted-foreground hover:text-foreground underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
