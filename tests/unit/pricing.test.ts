import { describe, it, expect } from "vitest";

function calculateSubtotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateDiscount(subtotal: number, coupon: { type: "PERCENTAGE" | "FIXED_AMOUNT"; value: number; minSubtotal: number }) {
  if (subtotal < coupon.minSubtotal) {
    return 0;
  }

  if (coupon.type === "PERCENTAGE") {
    return Number((subtotal * (coupon.value / 100)).toFixed(2));
  } else {
    return Math.min(coupon.value, subtotal);
  }
}

describe("Pricing and Coupon Calculations", () => {
  const items = [
    { price: 100.00, quantity: 2 }, // 200
    { price: 50.00, quantity: 1 },  // 50
  ];

  it("should calculate correct subtotal", () => {
    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(250.00);
  });

  it("should apply percentage coupon correctly", () => {
    const subtotal = 250.00;
    const coupon = {
      type: "PERCENTAGE" as const,
      value: 10, // 10%
      minSubtotal: 50.00,
    };

    const discount = calculateDiscount(subtotal, coupon);
    expect(discount).toBe(25.00);
  });

  it("should apply fixed amount coupon correctly", () => {
    const subtotal = 250.00;
    const coupon = {
      type: "FIXED_AMOUNT" as const,
      value: 50.00,
      minSubtotal: 200.00,
    };

    const discount = calculateDiscount(subtotal, coupon);
    expect(discount).toBe(50.00);
  });

  it("should return zero discount if subtotal is below coupon minSubtotal", () => {
    const subtotal = 150.00;
    const coupon = {
      type: "FIXED_AMOUNT" as const,
      value: 50.00,
      minSubtotal: 200.00,
    };

    const discount = calculateDiscount(subtotal, coupon);
    expect(discount).toBe(0.00);
  });
});
