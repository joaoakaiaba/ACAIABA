import { describe, it, expect } from "vitest";
import {
  isValidIdempotencyKey,
  classifyIdempotency,
} from "../../src/lib/commerce/idempotency";

describe("Idempotency key validation", () => {
  it("should accept a valid key", () => {
    expect(isValidIdempotencyKey("ck_abc123def456")).toBe(true);
    expect(isValidIdempotencyKey("12345678")).toBe(true);
    expect(isValidIdempotencyKey("a-b_c-d-e-f-9")).toBe(true);
  });

  it("should reject invalid keys", () => {
    expect(isValidIdempotencyKey("")).toBe(false);
    expect(isValidIdempotencyKey("short")).toBe(false); // < 8 chars
    expect(isValidIdempotencyKey(null)).toBe(false);
    expect(isValidIdempotencyKey(undefined)).toBe(false);
    expect(isValidIdempotencyKey("has space 123")).toBe(false);
    expect(isValidIdempotencyKey("has@special")).toBe(false);
  });
});

describe("Idempotency classification", () => {
  it("should classify a brand-new key as 'new'", () => {
    expect(classifyIdempotency(null, "ck_abc123def456")).toEqual({ kind: "new" });
  });

  it("should classify an existing order as a 'replay'", () => {
    expect(classifyIdempotency("PED-123456-789", "ck_abc123def456")).toEqual({
      kind: "replay",
      orderNumber: "PED-123456-789",
    });
  });

  it("should treat an invalid key as 'new' (caller decides rejection)", () => {
    expect(classifyIdempotency(null, "bad")).toEqual({ kind: "new" });
    expect(classifyIdempotency("PED-1", "bad")).toEqual({ kind: "new" });
  });
});
