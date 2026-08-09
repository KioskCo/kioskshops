import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StarFill, Star } from "react-bootstrap-icons";

export const Route = createFileRoute("/review")({
  validateSearch: (s: Record<string, unknown>) => ({ orderId: (s.orderId as string) ?? "" }),
  head: () => ({ meta: [{ title: "Leave a Review" }] }),
  component: ReviewPage,
});

interface OrderItem {
  productId: string;
  productName: string;
}

interface OrderData {
  orderId: string;
  buyerName: string;
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
}

interface ReviewForm {
  rating: number;
  body: string;
  submitted: boolean;
}

function ReviewPage() {
  const { orderId } = Route.useSearch();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, ReviewForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const base = (import.meta.env as any)["VITE_API_BASE"] ?? "/api";

  useEffect(() => {
    fetch(`${base}/reviews/order/${orderId}`)
      .then((r) => r.json())
      .then((res: any) => {
        if (!res.success) { setError(res.error ?? "Order not found"); return; }
        const data = res.data as OrderData;
        setOrder(data);
        const initial: Record<string, ReviewForm> = {};
        for (const item of data.items) {
          initial[item.productId] = { rating: 5, body: "", submitted: false };
        }
        setForms(initial);
      })
      .catch(() => setError("Could not load order details. Please try again."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const setRating = (productId: string, rating: number) =>
    setForms((prev) => ({ ...prev, [productId]: { ...prev[productId]!, rating } }));

  const setBody = (productId: string, body: string) =>
    setForms((prev) => ({ ...prev, [productId]: { ...prev[productId]!, body } }));

  const submitAll = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      for (const item of order.items) {
        const form = forms[item.productId];
        if (!form || form.submitted) continue;
        await fetch(`${base}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId: order.vendorId,
            productId: item.productId,
            productName: item.productName,
            orderId: order.orderId,
            buyerName: order.buyerName,
            rating: form.rating,
            body: form.body.trim() || undefined,
          }),
        });
        setForms((prev) => ({
          ...prev,
          [item.productId]: { ...prev[item.productId]!, submitted: true },
        }));
      }
      setAllDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-medium text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">If this link expired, contact the store directly.</p>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl">⭐</div>
        <h1 className="mt-6 font-serif text-3xl">Thank you!</h1>
        <p className="mt-3 text-muted-foreground">
          Your review helps {order?.vendorName} and other buyers. We appreciate it!
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-4xl">How was your order?</h1>
      <p className="mt-3 text-muted-foreground">
        Leave a quick rating for {order?.vendorName} — it takes under a minute.
      </p>

      <div className="mt-10 space-y-10">
        {order?.items.map((item) => {
          const form = forms[item.productId];
          if (!form) return null;
          return (
            <div key={item.productId} className="rounded-xl border border-border p-6">
              <p className="font-medium">{item.productName}</p>

              {/* Star picker */}
              <div className="mt-4 flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(item.productId, n)}
                    className="transition-transform hover:scale-110"
                    aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                  >
                    {n <= form.rating
                      ? <StarFill className="text-amber-400" style={{ fontSize: 28 }} />
                      : <Star className="text-muted-foreground" style={{ fontSize: 28 }} />}
                  </button>
                ))}
                <span className="ml-1 text-sm text-muted-foreground">
                  {["", "Poor", "Fair", "Good", "Very good", "Excellent"][form.rating]}
                </span>
              </div>

              {/* Optional comment */}
              <textarea
                className="mt-4 w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                rows={3}
                placeholder="Tell us more (optional)…"
                value={form.body}
                onChange={(e) => setBody(item.productId, e.target.value)}
                maxLength={2000}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={submitAll}
        disabled={submitting}
        className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}
