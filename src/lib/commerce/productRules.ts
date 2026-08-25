// Pure, DB-free validation rules for products and variants. The server is the
// only authority for product/pricing data; nothing here trusts the client.

export interface ProductInput {
  name: string;
  slug: string;
  description: string;
  detailedDescription?: string | null;
  baseSku: string;
  brandId: string;
  categoryId: string;
  price: number;
  promotionalPrice?: number | null;
  isActive?: boolean;
  isFeatured?: boolean;
  status?: string;
}

export interface VariantInput {
  id?: string;
  size?: string | null;
  color?: string | null;
  model?: string | null;
  sku: string;
  price?: number | null;
  stock: number;
  minStock?: number;
}

export type ProductValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "OUT_OF_STOCK", "ARCHIVED"];

// Validates a product payload. Returns a human-friendly reason on failure.
export function validateProduct(input: ProductInput): ProductValidationResult {
  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 100) {
    return { ok: false, reason: "Nome deve ter entre 2 e 100 caracteres." };
  }
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return { ok: false, reason: "Slug inválido (use letras minúsculas, números e hífens)." };
  }
  if (typeof input.description !== "string" || input.description.trim().length < 10) {
    return { ok: false, reason: "Descrição deve ter pelo menos 10 caracteres." };
  }
  if (typeof input.baseSku !== "string" || input.baseSku.trim().length < 3) {
    return { ok: false, reason: "SKU base deve ter pelo menos 3 caracteres." };
  }
  if (!input.brandId || !input.categoryId) {
    return { ok: false, reason: "Marca e categoria são obrigatórias." };
  }
  if (typeof input.price !== "number" || !isFinite(input.price) || input.price < 0) {
    return { ok: false, reason: "Preço inválido." };
  }
  if (input.promotionalPrice != null) {
    if (typeof input.promotionalPrice !== "number" || !isFinite(input.promotionalPrice) || input.promotionalPrice < 0) {
      return { ok: false, reason: "Preço promocional inválido." };
    }
    if (input.promotionalPrice >= input.price) {
      return { ok: false, reason: "Preço promocional deve ser menor que o preço original." };
    }
  }
  if (input.status && !PRODUCT_STATUSES.includes(input.status)) {
    return { ok: false, reason: "Status de produto inválido." };
  }
  return { ok: true };
}

// Validates a single variant payload.
export function validateVariant(input: VariantInput): ProductValidationResult {
  if (typeof input.sku !== "string" || input.sku.trim().length < 3) {
    return { ok: false, reason: "SKU de variante inválido." };
  }
  if (input.price != null && (typeof input.price !== "number" || !isFinite(input.price) || input.price < 0)) {
    return { ok: false, reason: "Preço de variante inválido." };
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    return { ok: false, reason: "Estoque de variante inválido." };
  }
  if (input.minStock != null && (!Number.isInteger(input.minStock) || input.minStock < 0)) {
    return { ok: false, reason: "Estoque mínimo de variante inválido." };
  }
  return { ok: true };
}
