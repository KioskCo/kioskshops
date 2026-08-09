import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/invoice/$orderNumber")({
  component: InvoicePage,
});

type Invoice = {
  invoiceNumber: string;
  issuedAt: string;
  merchant: { name: string; phone?: string };
  buyer: { name: string; phone: string; email?: string; address: string };
  items: { name: string; qty: number; unitPrice: number; total: number }[];
  totalAmount: number;
  status: string;
  paymentProvider?: string;
  orderNumber: string;
};

function InvoicePage() {
  const { orderNumber } = Route.useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const base = ((import.meta as any).env?.["VITE_API_BASE"] as string | undefined) ?? "/api";
    fetch(`${base}/buyers/invoice/${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setInvoice(j.invoice); else setError(true); })
      .catch(() => setError(true));
  }, [orderNumber]);

  if (error) return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-4xl font-semibold">404</p>
      <p className="mt-3 text-muted-foreground">Invoice not found for order <strong>{orderNumber}</strong>.</p>
      <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground">Go home</Link>
    </div>
  );

  if (!invoice) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-serif text-4xl">Invoice</h1>
          <p className="mt-1 text-muted-foreground font-mono">{invoice.invoiceNumber}</p>
          <p className="mt-1 text-sm text-muted-foreground">{new Date(invoice.issuedAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm hover:bg-secondary"
        >
          Print / Save PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">From</p>
          <p className="font-semibold">{invoice.merchant.name}</p>
          {invoice.merchant.phone && <p className="text-sm text-muted-foreground">{invoice.merchant.phone}</p>}
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">To</p>
          <p className="font-semibold">{invoice.buyer.name}</p>
          {invoice.buyer.email && <p className="text-sm text-muted-foreground">{invoice.buyer.email}</p>}
          <p className="text-sm text-muted-foreground">{invoice.buyer.phone}</p>
          <p className="text-sm text-muted-foreground">{invoice.buyer.address}</p>
        </div>
      </div>

      <table className="w-full border-collapse mb-8">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Item</th>
            <th className="py-3 text-center text-xs uppercase tracking-wider text-muted-foreground">Qty</th>
            <th className="py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">Unit price</th>
            <th className="py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="py-3 text-sm">{item.name}</td>
              <td className="py-3 text-sm text-center">{item.qty}</td>
              <td className="py-3 text-sm text-right">{formatPrice(item.unitPrice)}</td>
              <td className="py-3 text-sm text-right font-medium">{formatPrice(item.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-4 text-right font-semibold">Total</td>
            <td className="pt-4 text-right font-bold font-serif text-xl">{formatPrice(invoice.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-5 py-3 text-sm">
        <span className="text-muted-foreground">Payment status</span>
        <span className={`font-medium ${invoice.status === "delivered" || invoice.status === "paid" ? "text-green-600" : "text-amber-600"}`}>
          {invoice.status === "delivered" ? "Paid & Delivered" : invoice.status === "paid" ? "Paid" : "Pending"}
          {invoice.paymentProvider ? ` via ${invoice.paymentProvider}` : ""}
        </span>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">Order reference: {invoice.orderNumber}</p>
    </div>
  );
}
