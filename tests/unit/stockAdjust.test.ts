import { describe, it, expect } from "vitest";
import {
  isValidQuantity,
  isValidMinStock,
  canAdjustQuantity,
} from "../../src/lib/inventory/stockAdjust";

describe("Stock adjustment validation", () => {
  it("should accept a valid non-negative integer quantity", () => {
    expect(isValidQuantity(0)).toBe(true);
    expect(isValidQuantity(10)).toBe(true);
    expect(isValidQuantity(5)).toBe(true);
  });

  it("should reject invalid quantity values", () => {
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
    expect(isValidQuantity("10")).toBe(false);
    expect(isValidQuantity(null)).toBe(false);
    expect(isValidQuantity(undefined)).toBe(false);
    expect(isValidQuantity(NaN)).toBe(false);
  });

  it("should accept a valid non-negative integer minStock", () => {
    expect(isValidMinStock(0)).toBe(true);
    expect(isValidMinStock(5)).toBe(true);
  });

  it("should reject invalid minStock values", () => {
    expect(isValidMinStock(-3)).toBe(false);
    expect(isValidMinStock(2.5)).toBe(false);
    expect(isValidMinStock("5")).toBe(false);
    expect(isValidMinStock(null)).toBe(false);
  });

  it("should NOT allow quantity below reserved stock", () => {
    // reserved = 3, so available = quantity - 3 must stay >= 0
    expect(canAdjustQuantity(3, 3)).toBe(true);
    expect(canAdjustQuantity(5, 3)).toBe(true);
    expect(canAdjustQuantity(2, 3)).toBe(false);
    expect(canAdjustQuantity(0, 3)).toBe(false);
  });

  it("should allow quantity equal to reserved (zero available)", () => {
    expect(canAdjustQuantity(4, 4)).toBe(true);
    expect(canAdjustQuantity(0, 0)).toBe(true);
  });
});
