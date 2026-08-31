import { describe, it, expect } from "vitest";
import {
  validateCouponRules,
  calculateCouponDiscount,
  type CouponSnapshot,
} from "../../src/lib/commerce/couponRules";

function makeCoupon(overrides: Partial<CouponSnapshot> = {}): CouponSnapshot {
  const now = new Date();
  return {
    code: "TESTE10",
    type: "PERCENTAGE",
    value: 10,
    validFrom: new Date(now.getTime() - 1000 * 60 * 60),
    validUntil: new Date(now.getTime() + 1000 * 60 * 60),
    minSubtotal: 0,
    maxUses: 100,
    maxUsesPerUser: 1,
    usageCount: 0,
    active: true,
    ...overrides,
  };
}

describe("Coupon validation rules", () => {
  it("should accept a valid coupon", () => {
    expect(validateCouponRules({ coupon: makeCoupon(), subtotal: 100 }).ok).toBe(true);
  });

  it("should reject a nonexistent coupon", () => {
    const r = validateCouponRules({ coupon: null, subtotal: 100 });
    expect(r.ok).toBe(false);
  });

  it("should reject an inactive coupon", () => {
    const r = validateCouponRules({ coupon: makeCoupon({ active: false }), subtotal: 100 });
    expect(r.ok).toBe(false);
  });

  it("should reject an expired coupon", () => {
    const r = validateCouponRules({
      coupon: makeCoupon({ validUntil: new Date(Date.now() - 1000) }),
      subtotal: 100,
    });
    expect(r.ok).toBe(false);
  });

  it("should reject a coupon below min subtotal", () => {
    const r = validateCouponRules({
      coupon: makeCoupon({ minSubtotal: 200 }),
      subtotal: 100,
    });
    expect(r.ok).toBe(false);
  });

  it("should reject when global usage limit is exhausted", () => {
    const r = validateCouponRules({
      coupon: makeCoupon({ maxUses: 5, usageCount: 5 }),
      subtotal: 100,
    });
    expect(r.ok).toBe(false);
  });

  it("should reject when per-user limit is exhausted", () => {
    const r = validateCouponRules({
      coupon: makeCoupon({ maxUsesPerUser: 1 }),
      subtotal: 100,
      userUsageCount: 1,
    });
    expect(r.ok).toBe(false);
  });
});

describe("Coupon discount calculation", () => {
  it("should compute a percentage discount", () => {
    expect(calculateCouponDiscount(250, { type: "PERCENTAGE", value: 10 })).toBe(25);
  });

  it("should compute a fixed-amount discount capped at subtotal", () => {
    expect(calculateCouponDiscount(100, { type: "FIXED_AMOUNT", value: 50 })).toBe(50);
    expect(calculateCouponDiscount(30, { type: "FIXED_AMOUNT", value: 50 })).toBe(30);
  });
});
