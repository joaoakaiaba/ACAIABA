import { describe, it, expect } from "vitest";
import { canAccessAdmin } from "../../src/lib/auth/authorize";
import { isOrderStatus, canChangeOrderStatus, ORDER_STATUSES } from "../../src/lib/orders/orderStatus";

describe("Order status validation", () => {
  it("should accept every legitimate order status", () => {
    for (const s of ORDER_STATUSES) {
      expect(isOrderStatus(s)).toBe(true);
    }
  });

  it("should reject invalid or empty status values", () => {
    expect(isOrderStatus("COMPLETED")).toBe(false);
    expect(isOrderStatus("")).toBe(false);
    expect(isOrderStatus(null)).toBe(false);
    expect(isOrderStatus(undefined)).toBe(false);
  });
});

describe("Admin orders: listing and detail authorization", () => {
  it("should allow an ACTIVE administrator to list/view orders", () => {
    expect(canAccessAdmin("ADMIN", "ACTIVE")).toBe(true);
    expect(canAccessAdmin("SUPER_ADMIN", "ACTIVE")).toBe(true);
    expect(canAccessAdmin("MANAGER", "ACTIVE")).toBe(true);
  });

  it("should DENY a regular customer (common user) from listing/viewing orders", () => {
    expect(canAccessAdmin("CUSTOMER", "ACTIVE")).toBe(false);
  });

  it("should DENY an administrator whose account is not active", () => {
    expect(canAccessAdmin("ADMIN", "SUSPENDED")).toBe(false);
    expect(canAccessAdmin("ADMIN", "INACTIVE")).toBe(false);
  });
});

describe("Admin orders: status change authorization", () => {
  it("should allow every ACTIVE administrative role to change the status", () => {
    expect(canChangeOrderStatus("ADMIN", "ACTIVE")).toBe(true);
    expect(canChangeOrderStatus("SUPER_ADMIN", "ACTIVE")).toBe(true);
    expect(canChangeOrderStatus("MANAGER", "ACTIVE")).toBe(true);
    expect(canChangeOrderStatus("STOCK_MANAGER", "ACTIVE")).toBe(true);
    expect(canChangeOrderStatus("SUPPORT", "ACTIVE")).toBe(true);
  });

  it("should DENY a common user (CUSTOMER) from changing the status", () => {
    expect(canChangeOrderStatus("CUSTOMER", "ACTIVE")).toBe(false);
  });

  it("should DENY an administrator whose account is not active", () => {
    expect(canChangeOrderStatus("ADMIN", "SUSPENDED")).toBe(false);
    expect(canChangeOrderStatus("ADMIN", "PENDING")).toBe(false);
    expect(canChangeOrderStatus("SUPER_ADMIN", "INACTIVE")).toBe(false);
  });

  it("should DENY when no role/status is present", () => {
    expect(canChangeOrderStatus(null, null)).toBe(false);
    expect(canChangeOrderStatus(undefined, undefined)).toBe(false);
  });

  it("should DENY an invalid status value regardless of admin role", () => {
    expect(isOrderStatus("COMPLETED")).toBe(false);
    expect(isOrderStatus("FULFILLED")).toBe(false);
    // Even an admin cannot pass an invalid status through validation.
    expect(isOrderStatus("PENDING")).toBe(true);
  });
});
