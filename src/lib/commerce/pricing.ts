// Pure, DB-free pricing & coupon logic. This is the SINGLE source of truth for
// how subtotal, discount and total are computed. The frontend is never the
// authority for price/discount/total — the server recalculates everything.

export interface PricingLine {
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  unitPrice: number; // the effective (promotional) unit price
  quantity: number;
}

export interface CouponInput {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minSubtotal: number;
}

export interface PricingResult {
  lines: Array<PricingLine & { total: number }>;
  subtotal: number;
  discount: number;
  discountReason: string | null;
  total: number; // subtotal - discount (shipping added separately by caller)
}

// Computes the subtotal from server-derived unit prices (never from client).
export function computeSubtotal(lines: PricingLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

// Applies a coupon discount to a subtotal, mirroring the business rules used by
// the checkout (percentage vs fixed amount, capped at the subtotal).
export function applyCouponDiscount(
  subtotal: number,
  coupon: CouponInput
): number {
  if (subtotal < coupon.minSubtotal) return 0;
  if (coupon.type === "PERCENTAGE") {
    return (subtotal * coupon.value) / 100;
  }
  return Math.min(coupon.value, subtotal);
}

// Full pricing: computes subtotal, applies an optional coupon discount and
// returns a coherent result. shipping is NOT included here (added by caller).
export function computePricing(
  lines: PricingLine[],
  coupon: CouponInput | null
): PricingResult {
  const subtotal = computeSubtotal(lines);
  const discount = coupon ? applyCouponDiscount(subtotal, coupon) : 0;
  return {
    lines: lines.map((l) => ({ ...l, total: l.unitPrice * l.quantity })),
    subtotal,
    discount,
    discountReason: discount > 0 && coupon ? coupon.code : null,
    total: Math.max(0, subtotal - discount),
  };
}
