import { describe, it, expect } from "vitest";
import {
  validateProduct,
  validateVariant,
  type ProductInput,
} from "../../src/lib/commerce/productRules";

function makeProduct(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    name: "Tênis Teste",
    slug: "tenis-teste",
    description: "Um tênis de teste com descrição adequada.",
    baseSku: "TEN-TST",
    brandId: "brand-1",
    categoryId: "cat-1",
    price: 199.9,
    promotionalPrice: 149.9,
    ...overrides,
  };
}

describe("Product validation (server-authoritative)", () => {
  it("should accept a valid product", () => {
    expect(validateProduct(makeProduct()).ok).toBe(true);
  });

  it("should reject a product with a short name", () => {
    const r = validateProduct(makeProduct({ name: "X" }));
    expect(r.ok).toBe(false);
  });

  it("should reject an invalid slug", () => {
    expect(validateProduct(makeProduct({ slug: "TenIs Com Espaço!" })).ok).toBe(false);
    expect(validateProduct(makeProduct({ slug: "UPPERCASE" })).ok).toBe(false);
  });

  it("should reject a short description", () => {
    expect(validateProduct(makeProduct({ description: "curto" })).ok).toBe(false);
  });

  it("should reject a promotional price >= original", () => {
    expect(validateProduct(makeProduct({ price: 100, promotionalPrice: 100 })).ok).toBe(false);
    expect(validateProduct(makeProduct({ price: 100, promotionalPrice: 150 })).ok).toBe(false);
    expect(validateProduct(makeProduct({ price: 100, promotionalPrice: 99 })).ok).toBe(true);
  });

  it("should reject invalid status", () => {
    expect(validateProduct(makeProduct({ status: "NOT_A_STATUS" })).ok).toBe(false);
    expect(validateProduct(makeProduct({ status: "ACTIVE" })).ok).toBe(true);
  });

  it("should reject negative price", () => {
    expect(validateProduct(makeProduct({ price: -1 })).ok).toBe(false);
  });
});

describe("Variant validation", () => {
  it("should accept a valid variant", () => {
    expect(validateVariant({ sku: "VAR-1", stock: 5 }).ok).toBe(true);
  });

  it("should reject a short sku", () => {
    expect(validateVariant({ sku: "AB", stock: 1 }).ok).toBe(false);
  });

  it("should reject negative stock", () => {
    expect(validateVariant({ sku: "VAR-1", stock: -1 }).ok).toBe(false);
  });

  it("should reject non-integer stock", () => {
    expect(validateVariant({ sku: "VAR-1", stock: 1.5 }).ok).toBe(false);
  });

  it("should reject negative variant price", () => {
    expect(validateVariant({ sku: "VAR-1", stock: 1, price: -5 }).ok).toBe(false);
  });
});
