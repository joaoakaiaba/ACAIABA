import { z } from "zod";

export const productValidationSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  detailedDescription: z.string().optional(),
  baseSku: z.string().min(3, "SKU base inválido").toUpperCase(),
  brandId: z.string().uuid("ID de marca inválido"),
  categoryId: z.string().uuid("ID de categoria inválido"),
  price: z.number().positive("Preço deve ser positivo"),
  promotionalPrice: z.number().positive("Preço promocional deve ser positivo").nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
}).refine(data => {
  if (data.promotionalPrice && data.promotionalPrice >= data.price) {
    return false;
  }
  return true;
}, {
  message: "Preço promocional deve ser menor que o preço original",
  path: ["promotionalPrice"],
});

export const variantValidationSchema = z.object({
  productId: z.string().uuid(),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sku: z.string().min(3).toUpperCase(),
  price: z.number().positive().nullable().optional(),
  stock: z.number().int().nonnegative("Estoque não pode ser negativo"),
});
