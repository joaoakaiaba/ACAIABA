import { describe, it, expect } from "vitest";
import { isAdminRole } from "../../src/lib/auth/roles";
import {
  isActiveStatus,
  canAccessProtectedArea,
  canAccessAdmin,
} from "../../src/lib/auth/authorize";

describe("Role-based access control (RBAC)", () => {
  it("should treat all administrative roles as admin", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("SUPER_ADMIN")).toBe(true);
    expect(isAdminRole("MANAGER")).toBe(true);
    expect(isAdminRole("STOCK_MANAGER")).toBe(true);
    expect(isAdminRole("SUPPORT")).toBe(true);
  });

  it("should NOT treat a regular customer as admin", () => {
    expect(isAdminRole("CUSTOMER")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe("Status verification", () => {
  it("should only consider ACTIVE as an active status", () => {
    expect(isActiveStatus("ACTIVE")).toBe(true);
    expect(isActiveStatus("INACTIVE")).toBe(false);
    expect(isActiveStatus("SUSPENDED")).toBe(false);
    expect(isActiveStatus("PENDING")).toBe(false);
    expect(isActiveStatus(null)).toBe(false);
  });

  it("should grant protected-area access only to ACTIVE accounts", () => {
    // Regular customer (common user flow)
    expect(canAccessProtectedArea("ACTIVE")).toBe(true);
    // Suspended / inactive / pending (must be denied)
    expect(canAccessProtectedArea("SUSPENDED")).toBe(false);
    expect(canAccessProtectedArea("INACTIVE")).toBe(false);
    expect(canAccessProtectedArea("PENDING")).toBe(false);
  });
});

describe("Admin access decisions (common user vs administrator flows)", () => {
  it("should allow an ACTIVE administrator into the admin area", () => {
    expect(canAccessAdmin("ADMIN", "ACTIVE")).toBe(true);
    expect(canAccessAdmin("SUPER_ADMIN", "ACTIVE")).toBe(true);
    expect(canAccessAdmin("MANAGER", "ACTIVE")).toBe(true);
    expect(canAccessAdmin("STOCK_MANAGER", "ACTIVE")).toBe(true);
    expect(canAccessAdmin("SUPPORT", "ACTIVE")).toBe(true);
  });

  it("should DENY a regular customer access to the admin area even when active", () => {
    expect(canAccessAdmin("CUSTOMER", "ACTIVE")).toBe(false);
  });

  it("should DENY an administrator whose account is not active", () => {
    expect(canAccessAdmin("ADMIN", "SUSPENDED")).toBe(false);
    expect(canAccessAdmin("ADMIN", "INACTIVE")).toBe(false);
    expect(canAccessAdmin("ADMIN", "PENDING")).toBe(false);
  });

  it("should DENY access when the session carries no role/status", () => {
    expect(canAccessAdmin(null, null)).toBe(false);
    expect(canAccessAdmin(undefined, undefined)).toBe(false);
    expect(canAccessAdmin("ADMIN", null)).toBe(false);
  });
});
