import { describe, it, expect } from "vitest";
import {
  computeSubtotal,
  applyCouponDiscount,
  computePricing,
  type PricingLine,
} from "../../src/lib/commerce/pricing";

function makeLine(overrides: Partial<PricingLine> = {}): PricingLine {
  return {
    variantId: "v1",
    productId: "p1",
    name: "Produto",
    sku: "SKU-1",
    size: "M",
    color: null,
    unitPrice: 100,
    quantity: 2,
    ...overrides,
  };
}

describe("Pricing (server-authoritative)", () => {
  it("should compute subtotal from server-derived unit prices", () => {
    const lines = [
      makeLine({ unitPrice: 100, quantity: 2 }), // 200
      makeLine({ variantId: "v2", unitPrice: 50, quantity: 1 }), // 50
    ];
    expect(computeSubtotal(lines)).toBe(250);
  });

  it("should apply a percentage coupon", () => {
    const discount = applyCouponDiscount(250, {
      code: "ACAIABA10",
      type: "PERCENTAGE",
      value: 10,
      minSubtotal: 50,
    });
    expect(discount).toBe(25);
  });

  it("should apply a fixed-amount coupon capped at the subtotal", () => {
    expect(applyCouponDiscount(100, { code: "B", type: "FIXED_AMOUNT", value: 50, minSubtotal: 10 })).toBe(50);
    // Cap at subtotal (never negative total).
    expect(applyCouponDiscount(30, { code: "B", type: "FIXED_AMOUNT", value: 50, minSubtotal: 10 })).toBe(30);
  });

  it("should return zero discount when subtotal is below the coupon minimum", () => {
    expect(applyCouponDiscount(40, { code: "B", type: "FIXED_AMOUNT", value: 50, minSubtotal: 100 })).toBe(0);
  });

  it("should compute a full pricing result with no coupon", () => {
    const res = computePricing([makeLine({ unitPrice: 100, quantity: 2 })], null);
    expect(res.subtotal).toBe(200);
    expect(res.discount).toBe(0);
    expect(res.total).toBe(200);
    expect(res.discountReason).toBeNull();
  });

  it("should compute a full pricing result with coupon", () => {
    const res = computePricing([makeLine({ unitPrice: 100, quantity: 2 })], {
      code: "ACAIABA10",
      type: "PERCENTAGE",
      value: 10,
      minSubtotal: 50,
    });
    expect(res.subtotal).toBe(200);
    expect(res.discount).toBe(20);
    expect(res.total).toBe(180);
    expect(res.discountReason).toBe("ACAIABA10");
  });

  it("should never produce a negative total", () => {
    const res = computePricing([makeLine({ unitPrice: 10, quantity: 1 })], {
      code: "X",
      type: "FIXED_AMOUNT",
      value: 100,
      minSubtotal: 0,
    });
    expect(res.total).toBe(0);
  });
});
