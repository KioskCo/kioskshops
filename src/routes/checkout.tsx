import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckLg, CreditCard2Front, ArrowRepeat } from "react-bootstrap-icons";
import { useCart } from "@/lib/cart";
import { formatPrice, NIGERIAN_STATES } from "@/lib/products";
import { placeOrder } from "@/lib/checkout.functions";
import { useStorefront } from "@/lib/storefront";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout" }] }),
  component: Checkout,
});

/** Dynamically load a payment gateway script (no-op if already loaded). */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // resolve anyway so the handler can show an error
    document.head.appendChild(s);
  });
}

function Checkout() {
  const { detailed, items, subtotal, clear } = useCart();
  const { paymentConfig, navbar, referrals, deliveryFees } = useStorefront();

  useEffect(() => {
    document.title = `Checkout — ${navbar.brand}`;
  }, [navbar.brand]);
  const placeOrderFn = useServerFn(placeOrder);
  const [done, setDone] = useState<{ orderNumber: string; total: number; escrowPin?: string; referralCode?: string } | null>(null);
  const [pinCopied, setPinCopied] = useState(false);
  const [refLinkCopied, setRefLinkCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"paystack" | "flutterwave">("paystack");
  const [buyerState, setBuyerState] = useState("Lagos");
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{ id: string; label: string; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const provider = paymentConfig.provider === "both" ? selectedProvider : paymentConfig.provider;
  // Location-aware shipping: Lagos = local rate, other states = inter-state,
  // using the vendor's own configured rates. The server re-computes authoritatively.
  const shipping =
    subtotal >= deliveryFees.freeThreshold || subtotal === 0
      ? 0
      : buyerState.toLowerCase() === "lagos"
        ? deliveryFees.lagos
        : deliveryFees.other;
  const discount = discountApplied?.amount ?? 0;
  const saleTotal = Math.max(0, subtotal + shipping - discount);
  // Payment processing fee (Paystack 1.5% + ₦100 / Flutterwave 1.4% + ₦100) —
  // added to the buyer total; the vendor keeps the full sale amount.
  const processingFee = saleTotal > 0 ? Math.ceil(saleTotal * (provider === "flutterwave" ? 0.014 : 0.015) + 100) : 0;
  const total = saleTotal + processingFee;

  const vendorId =
    sessionStorage.getItem("kiosk_vendor_id") ||
    ((import.meta.env as any)["VITE_VENDOR_ID"] as string | undefined) ||
    "";
  const incomingRef = sessionStorage.getItem("kiosk_referral_code") ?? "";

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setValidatingDiscount(true);
    setDiscountError(null);
    const base = (import.meta.env as any)["VITE_API_BASE"] ?? "/api";
    try {
      const res = await fetch(`${base}/discounts/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.trim(), vendorId, orderTotal: subtotal }),
      });      const data = await res.json();
      if (!data.success) { setDiscountError(data.error ?? "Invalid code"); return; }
      setDiscountApplied({ id: data.data.id, label: data.data.label, amount: data.data.discountAmount });
    } catch {
      setDiscountError("Could not validate code");
    } finally {
      setValidatingDiscount(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);

    const email = String(fd.get("email") || "");
    const phone = String(fd.get("phone") || "");
    const full_name = `${fd.get("first_name") || ""} ${fd.get("last_name") || ""}`.trim();
    const address = String(fd.get("address") || "");
    const city = String(fd.get("city") || "");
    const zip = String(fd.get("zip") || "");
    // Use detailed items so we send the real product UUID (id), not the slug
    const orderItems = detailed.map((d) => ({ productId: d.product.id, name: d.product.name, qty: d.qty }));

    const finalize = async (paymentRef?: string, paymentProvider?: string) => {
      try {
        const result = await placeOrderFn({
          data: { vendorId, email, phone, full_name, address, city, state: buyerState, zip, items: orderItems, paymentRef, paymentProvider, discountCode: discountApplied ? discountCode.trim() : undefined, discountId: discountApplied?.id, referralCode: incomingRef || undefined },
        });
        setDone(result);
        clear();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setSubmitting(false);
      }
    };

    if (provider === "flutterwave") {
      const fwKey = (import.meta.env as any).VITE_FLUTTERWAVE_PUBLIC_KEY as string | undefined;
      if (!fwKey) { setError("Flutterwave is not configured. Contact the site administrator."); setSubmitting(false); return; }
      try {
        await loadScript("https://checkout.flutterwave.com/v3.js");
        const fw = (window as any).FlutterwaveCheckout;
        if (!fw) throw new Error("Flutterwave SDK failed to load.");
        fw({
          public_key: fwKey,
          tx_ref: `ORDER-${Date.now()}`,
          amount: total,
          currency: paymentConfig.currency || "NGN",
          customer: { email, name: full_name },
          customizations: { title: `${navbar.brand} Checkout`, description: "Order payment" },
          callback: async (data: any) => {
            if (data.status === "successful" || data.status === "completed") {
              // Send tx_ref (the string reference we generated) — the backend
              // verifies by tx_ref. transaction_id is a numeric Flutterwave ID
              // that the verify lib doesn't accept directly.
              await finalize(data.tx_ref ?? String(data.transaction_id), "flutterwave");
            } else {
              setError("Payment was not completed. Please try again.");
              setSubmitting(false);
            }
          },
          onclose: () => setSubmitting(false),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not initialise Flutterwave.");
        setSubmitting(false);
      }
      return;
    }

    if (provider === "paystack") {
      const psKey = (import.meta.env as any).VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
      if (!psKey) { setError("Paystack is not configured. Contact the site administrator."); setSubmitting(false); return; }
      try {
        await loadScript("https://js.paystack.co/v1/inline.js");
        const PaystackPop = (window as any).PaystackPop;
        if (!PaystackPop) throw new Error("Paystack SDK failed to load.");
        const handler = PaystackPop.setup({
          key: psKey,
          email,
          amount: Math.round(total * 100), // Paystack uses subunits (kobo/pesewas/etc)
          currency: paymentConfig.currency || "NGN",
          ref: `ORDER-${Date.now()}`,
          callback: async (response: any) => {
            await finalize(response.reference, "paystack");
          },
          onClose: () => setSubmitting(false),
        });
        handler.openIframe();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not initialise Paystack.");
        setSubmitting(false);
      }
      return;
    }

    // Demo / none
    await finalize(undefined, "none");
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckLg style={{ fontSize: 24 }} />
        </div>
        <h1 className="mt-6 font-serif text-4xl">Order confirmed!</h1>
        <p className="mt-3 text-muted-foreground">A confirmation email is on its way to your inbox.</p>

        {/* Escrow PIN — prominent display */}
        {done.escrowPin && (
          <div className="mt-8 rounded-2xl border-2 border-primary/30 bg-primary/5 px-6 py-6">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">Your Delivery PIN</p>
            <div className="flex items-center justify-center gap-4">
              <span className="font-mono text-5xl font-bold tracking-[0.3em] text-foreground">{done.escrowPin}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(done.escrowPin!);
                  setPinCopied(true);
                  setTimeout(() => setPinCopied(false), 2000);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-secondary transition-colors"
                title="Copy PIN"
              >
                {pinCopied ? <CheckLg style={{ fontSize: 16 }} className="text-green-600" /> : <CreditCard2Front style={{ fontSize: 16 }} />}
              </button>
            </div>
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-amber-800 mb-1">Important — read before closing</p>
              <p className="text-sm text-amber-700">
                Give this 4-digit PIN to the <strong>delivery rider</strong> when your order arrives.
                The rider will pass it to the vendor to confirm delivery and release payment.
                <strong> Do not share it until your order is physically in your hands.</strong>
              </p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">This PIN has also been sent to your email.</p>
          </div>
        )}

        <div className="mt-6 inline-flex flex-col gap-1 rounded-lg border border-border bg-secondary/40 px-6 py-4 text-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Order</span>
          <span className="font-mono text-base">{done.orderNumber}</span>
          <span className="mt-1 font-serif text-2xl">{formatPrice(done.total)}</span>
        </div>

        {/* Share & Earn — show only when vendor has referrals enabled */}
        {referrals.enabled && done.referralCode && (() => {
          const refUrl = `${window.location.origin}/?ref=${done.referralCode}`;
          const rewardLabel = referrals.rewardLabel ?? "10% off your next order";
          return (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-left">
              <p className="text-sm font-semibold text-emerald-800">Refer a friend, earn a reward!</p>
              <p className="mt-1 text-xs text-emerald-700">Share your link. When someone orders using it, you get {rewardLabel}.</p>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
                <span className="flex-1 truncate font-mono text-xs text-emerald-700">{refUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(refUrl);
                    setRefLinkCopied(true);
                    setTimeout(() => setRefLinkCopied(false), 2000);
                  }}
                  className="shrink-0 rounded-md bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 transition-colors"
                >
                  {refLinkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          );
        })()}

        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            to="/order/$orderNumber"
            params={{ orderNumber: done.orderNumber }}
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground hover:opacity-90"
          >
            Track your order
          </Link>
          <button onClick={() => navigate({ to: "/" })} className="text-sm text-muted-foreground hover:text-foreground underline">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-serif text-4xl">Your bag is empty</h1>
        <Link to="/shop" search={{ category: "" }} className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm text-primary-foreground">Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl">Checkout</h1>
      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
        <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
          <fieldset className="space-y-4">
            <legend className="font-serif text-2xl">Contact</legend>
            <Input name="email" label="Email" type="email" required />
            <Input name="phone" label="Phone number" type="tel" placeholder="e.g. 08012345678" />
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="font-serif text-2xl">Shipping</legend>
            <div className="grid grid-cols-2 gap-4">
              <Input name="first_name" label="First name" required />
              <Input name="last_name" label="Last name" required />
            </div>
            <Input name="address" label="Address" required />
            <div className="grid grid-cols-2 gap-4">
              <Input name="city" label="City" required />
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">State</span>
                <select
                  value={buyerState}
                  onChange={(e) => setBuyerState(e.target.value)}
                  className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input name="zip" label="Postcode (optional)" />
              <div className="flex items-end">
                <p className="text-xs text-muted-foreground pb-2.5">
                  {buyerState.toLowerCase() === "lagos" ? `Lagos delivery (${formatPrice(deliveryFees.lagos)})` : `Inter-state delivery (${formatPrice(deliveryFees.other)})`}
                  {subtotal >= deliveryFees.freeThreshold && ` — free on orders over ${formatPrice(deliveryFees.freeThreshold)}`}
                </p>
              </div>
            </div>
          </fieldset>

          {/* Payment section — shows configured gateway or demo notice */}
          <fieldset className="space-y-4">
            <legend className="font-serif text-2xl">Payment</legend>
            {paymentConfig.provider === "both" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Choose your preferred payment method:</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["paystack", "flutterwave"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedProvider(p)}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-colors ${
                        selectedProvider === p
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <CreditCard2Front style={{ fontSize: 16 }} />
                      {p === "paystack" ? "Paystack" : "Flutterwave"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  A secure payment popup will open when you click Pay.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-4">
                <CreditCard2Front style={{ fontSize: 20 }} className="shrink-0 text-muted-foreground" />
                {provider === "none" ? (
                  <div>
                    <p className="text-sm font-medium">Demo mode — no payment processed</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      No payment gateway configured. Go to Admin → Payments to enable Flutterwave or Paystack.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">
                      {provider === "flutterwave" ? "Flutterwave" : "Paystack"} secure checkout
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      A secure payment popup will open when you click Pay. Your card details are handled directly by {provider === "flutterwave" ? "Flutterwave" : "Paystack"}.
                    </p>
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <><ArrowRepeat style={{ fontSize: 16 }} className="animate-spin" /> Processing…</>
            ) : provider === "flutterwave" ? (
              <>Pay with Flutterwave · {formatPrice(total)}</>
            ) : provider === "paystack" ? (
              <>Pay with Paystack · {formatPrice(total)}</>
            ) : paymentConfig.provider === "both" ? (
              <>Pay · {formatPrice(total)}</>
            ) : (
              <>Pay {formatPrice(total)}</>
            )}
          </button>
        </form>

        <aside className="h-fit rounded-lg border border-border bg-secondary/40 p-6">
          <h2 className="font-serif text-xl">Order summary</h2>
          <ul className="mt-4 divide-y divide-border">
            {detailed.map(({ product, qty }) => (
              <li key={product.slug} className="flex gap-3 py-3">
                <img src={product.image} alt={product.name} width={56} height={56} loading="lazy" className="h-14 w-14 rounded-md object-cover" />
                <div className="flex flex-1 justify-between text-sm">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-muted-foreground">Qty {qty}</p>
                  </div>
                  <span>{formatPrice(product.price * qty)}</span>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping)} />
            {discountApplied && (
              <Row label={`Discount (${discountApplied.label})`} value={`−${formatPrice(discountApplied.amount)}`} />
            )}
            {processingFee > 0 && (
              <Row label="Processing fee" value={formatPrice(processingFee)} />
            )}
            <Row label="Total" value={formatPrice(total)} bold />
          </dl>

          {/* Discount code */}
          <div className="mt-4 border-t border-border pt-4">
            {discountApplied ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span className="text-xs font-medium text-emerald-700">{discountCode.toUpperCase()} — {discountApplied.label}</span>
                <button onClick={() => { setDiscountApplied(null); setDiscountCode(""); }} className="text-xs text-muted-foreground underline">Remove</button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyDiscount())}
                    placeholder="Discount code"
                    className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={applyDiscount}
                    disabled={validatingDiscount || !discountCode.trim()}
                    className="h-9 rounded-lg bg-secondary px-3 text-sm font-medium border border-border hover:bg-border disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                {discountError && <p className="text-xs text-destructive">{discountError}</p>}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input {...props} className="mt-1 h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "pt-2 font-serif text-lg text-foreground" : "text-muted-foreground"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
