import { describe, it, expect } from "vitest";
import { productValidationSchema, variantValidationSchema } from "../../src/schemas/product";

describe("Product and Variant Validation", () => {
  it("should validate a correct product", () => {
    const validProduct = {
      name: "Tênis Running Pro",
      slug: "tenis-running-pro",
      description: "O melhor tênis de corrida do mercado atual.",
      baseSku: "TEN-RUN-PRO",
      brandId: "123e4567-e89b-12d3-a456-426614174000",
      categoryId: "123e4567-e89b-12d3-a456-426614174001",
      price: 199.90,
      promotionalPrice: 149.90,
      isActive: true,
      isFeatured: false,
    };

    const result = productValidationSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("should reject a product with a promotional price higher than original", () => {
    const invalidProduct = {
      name: "Tênis Running Pro",
      slug: "tenis-running-pro",
      description: "O melhor tênis de corrida do mercado atual.",
      baseSku: "TEN-RUN-PRO",
      brandId: "123e4567-e89b-12d3-a456-426614174000",
      categoryId: "123e4567-e89b-12d3-a456-426614174001",
      price: 199.90,
      promotionalPrice: 249.90, // higher
      isActive: true,
      isFeatured: false,
    };

    const result = productValidationSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Preço promocional deve ser menor que o preço original");
    }
  });

  it("should reject a variant with negative stock", () => {
    const invalidVariant = {
      productId: "123e4567-e89b-12d3-a456-426614174000",
      size: "40",
      color: "Preto",
      sku: "TEN-RUN-PRO-40-PR",
      stock: -5, // negative
    };

    const result = variantValidationSchema.safeParse(invalidVariant);
    expect(result.success).toBe(false);
  });
});
