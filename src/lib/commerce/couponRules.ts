// Pure, DB-free coupon validation & discount rules. This is the SINGLE source of
// truth for how a coupon is validated and how its discount is computed. The
// frontend never decides a discount — the server validates and calculates.

export interface CouponSnapshot {
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  validFrom: Date;
  validUntil: Date;
  minSubtotal: number;
  maxUses: number | null;
  maxUsesPerUser: number;
  usageCount: number;
  active: boolean;
}

export interface CouponValidationInput {
  coupon: CouponSnapshot | null;
  subtotal: number;
  now?: Date;
  userUsageCount?: number; // how many times this customer already used it
}

export type CouponValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

// Validates a coupon against all business rules (existence, active, validity,
// min subtotal, global usage limit, per-user usage limit).
export function validateCouponRules(input: CouponValidationInput): CouponValidationResult {
  const { coupon, subtotal, now = new Date(), userUsageCount = 0 } = input;

  if (!coupon) {
    return { ok: false, reason: "Cupom não encontrado." };
  }
  if (!coupon.active) {
    return { ok: false, reason: "Cupom inativo." };
  }
  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { ok: false, reason: "Cupom expirado." };
  }
  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      reason: `Valor mínimo de subtotal não atendido (R$ ${coupon.minSubtotal.toFixed(2)}).`,
    };
  }
  if (coupon.maxUses !== null && coupon.usageCount >= coupon.maxUses) {
    return { ok: false, reason: "Este cupom atingiu o limite máximo de utilizações." };
  }
  if (userUsageCount >= coupon.maxUsesPerUser) {
    return { ok: false, reason: "Este cupom já foi utilizado por você." };
  }
  return { ok: true };
}

// Computes the discount amount for a validated coupon. Mirrors the checkout rule.
export function calculateCouponDiscount(
  subtotal: number,
  coupon: Pick<CouponSnapshot, "type" | "value">
): number {
  if (coupon.type === "PERCENTAGE") {
    return (subtotal * coupon.value) / 100;
  }
  return Math.min(coupon.value, subtotal);
}
