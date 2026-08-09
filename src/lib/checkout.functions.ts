import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const checkoutSchema = z.object({
  vendorId:        z.string().optional(),
  email:           z.string().email().max(200),
  phone:           z.string().max(30).optional(),
  full_name:       z.string().min(1).max(120),
  address:         z.string().min(1).max(200),
  city:            z.string().min(1).max(80),
  state:           z.string().max(80).optional(),
  zip:             z.string().max(20).optional(),
  paymentRef:      z.string().optional(),
  paymentProvider: z.string().optional(),
  discountCode:    z.string().optional(),
  discountId:      z.string().optional(),
  referralCode:    z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name:      z.string().min(1),
        qty:       z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(50),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => checkoutSchema.parse(input))
  .handler(async ({ data }) => {
    const apiBase  = (import.meta.env["VITE_API_BASE"] as string | undefined) ?? process.env["VITE_API_BASE"] ?? "http://localhost:3000/api";
    const vendorId = data.vendorId ?? (import.meta.env["VITE_VENDOR_ID"] as string | undefined) ?? process.env["VITE_VENDOR_ID"] ?? "";

    if (!vendorId) {
      throw new Error("Store is not configured for checkout. Contact the store owner.");
    }

    // Send productId — server re-derives prices from DB (never trust client prices)
    const resp = await fetch(`${apiBase}/buyers/orders`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        vendorId,
        buyerEmail:       data.email,
        buyerPhone:       data.phone ?? "",
        buyerName:        data.full_name,
        buyerAddress:     data.address,
        buyerCity:        data.city,
        buyerState:       data.state ?? "",
        buyerZip:         data.zip ?? "",
        items:            data.items,
        paymentReference: data.paymentRef ?? undefined,
        paymentProvider:  data.paymentProvider ?? undefined,
        discountCode:     data.discountCode ?? undefined,
        discountId:       data.discountId ?? undefined,
        referralCode:     data.referralCode ?? undefined,
      }),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      console.error("placeOrder failed:", body);
      throw new Error("Could not place your order. Please try again.");
    }

    const result = await resp.json() as { success: boolean; data: { orderNumber: string; total: number; escrowPin?: string; referralCode?: string } };
    return { orderNumber: result.data.orderNumber, total: result.data.total, escrowPin: result.data.escrowPin, referralCode: result.data.referralCode };
  });
