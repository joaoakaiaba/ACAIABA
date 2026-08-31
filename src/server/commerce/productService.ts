"use server";

import { prisma } from "@/lib/config/prisma";
import { AppError } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import {
  validateProduct,
  validateVariant,
  ProductInput,
  VariantInput,
} from "@/lib/commerce/productRules";
import { InventoryMovementType } from "@prisma/client";

// Creates a product with its variants and per-variant inventory inside a single
// transaction. All validation is server-side. Records an AuditLog.
export async function createProduct(input: {
  product: ProductInput;
  variants: VariantInput[];
  actorUserId: string;
}) {
  const pv = validateProduct(input.product);
  if (!pv.ok) throw new AppError("VALIDATION", pv.reason);

  for (const v of input.variants) {
    const vv = validateVariant(v);
    if (!vv.ok) throw new AppError("VALIDATION", vv.reason);
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { slug: input.product.slug } });
    if (existing) throw new AppError("CONFLICT", "Já existe um produto com este slug.");

    const baseSkuConflict = await tx.product.findUnique({ where: { baseSku: input.product.baseSku } });
    if (baseSkuConflict) throw new AppError("CONFLICT", "Já existe um produto com este SKU base.");

    const product = await tx.product.create({
      data: {
        name: input.product.name.trim(),
        slug: input.product.slug,
        description: input.product.description.trim(),
        detailedDescription: input.product.detailedDescription || null,
        baseSku: input.product.baseSku.trim().toUpperCase(),
        brandId: input.product.brandId,
        categoryId: input.product.categoryId,
        price: input.product.price,
        promotionalPrice: input.product.promotionalPrice ?? null,
        isActive: input.product.isActive ?? true,
        isFeatured: input.product.isFeatured ?? false,
        status: input.product.status ?? "ACTIVE",
      },
    });

    for (const v of input.variants) {
      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          size: v.size ?? null,
          color: v.color ?? null,
          model: v.model ?? null,
          sku: v.sku.trim().toUpperCase(),
          price: v.price ?? null,
        },
      });

      await tx.inventory.create({
        data: {
          variantId: variant.id,
          quantity: v.stock,
          reserved: 0,
          minStock: v.minStock ?? 0,
        },
      });

      if (v.stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            inventoryId: variant.id,
            userId: input.actorUserId,
            type: InventoryMovementType.IN,
            quantity: v.stock,
            reason: "Entrada inicial via criação de produto",
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId: input.actorUserId,
        action: "CREATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        details: { name: product.name, slug: product.slug, baseSku: product.baseSku },
      },
    });

    logger.info(`Product created: ${product.slug}`);
    return product;
  });
}

// Updates a product (and, when provided, its variants/inventory). Transactional.
// Product/variant/inventory mutations are audited.
export async function updateProduct(
  productId: string,
  input: {
    product: Partial<ProductInput>;
    variants?: VariantInput[];
    actorUserId: string;
  }
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("NOT_FOUND", "Produto não encontrado.", 404);

  // Validate the merged payload against pure rules.
  const merged = { ...product, ...input.product } as ProductInput;
  merged.price = input.product.price ?? Number(product.price);
  merged.promotionalPrice = input.product.promotionalPrice !== undefined
    ? input.product.promotionalPrice
    : product.promotionalPrice ? Number(product.promotionalPrice) : null;

  const pv = validateProduct(merged);
  if (!pv.ok) throw new AppError("VALIDATION", pv.reason);

  return prisma.$transaction(async (tx) => {
    const data: any = {};
    if (input.product.name !== undefined) data.name = input.product.name.trim();
    if (input.product.description !== undefined) data.description = input.product.description.trim();
    if (input.product.detailedDescription !== undefined) data.detailedDescription = input.product.detailedDescription || null;
    if (input.product.price !== undefined) data.price = input.product.price;
    if (input.product.promotionalPrice !== undefined) data.promotionalPrice = input.product.promotionalPrice ?? null;
    if (input.product.isActive !== undefined) data.isActive = input.product.isActive;
    if (input.product.isFeatured !== undefined) data.isFeatured = input.product.isFeatured;
    if (input.product.status !== undefined) data.status = input.product.status;
    if (input.product.brandId !== undefined) data.brandId = input.product.brandId;
    if (input.product.categoryId !== undefined) data.categoryId = input.product.categoryId;

    const updated = await tx.product.update({ where: { id: productId }, data });

    // Update variants + inventory if provided.
    if (input.variants && input.variants.length > 0) {
      for (const v of input.variants) {
        const vv = validateVariant(v);
        if (!vv.ok) throw new AppError("VALIDATION", vv.reason);

        if (v.id) {
          // Existing variant: update sku/price, then inventory.
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              size: v.size ?? null,
              color: v.color ?? null,
              model: v.model ?? null,
              sku: v.sku.trim().toUpperCase(),
              price: v.price ?? null,
            },
          });
          const inv = await tx.inventory.findUnique({ where: { variantId: v.id } });
          if (inv) {
            const delta = v.stock - inv.quantity;
            await tx.inventory.update({
              where: { id: inv.id },
              data: { quantity: v.stock, minStock: v.minStock ?? inv.minStock },
            });
            if (delta !== 0) {
              await tx.inventoryMovement.create({
                data: {
                  inventoryId: inv.id,
                  userId: input.actorUserId,
                  type: InventoryMovementType.ADJUSTMENT,
                  quantity: delta,
                  reason: "Ajuste via edição de produto",
                },
              });
            }
          }
        } else {
          // New variant.
          const variant = await tx.productVariant.create({
            data: {
              productId,
              size: v.size ?? null,
              color: v.color ?? null,
              model: v.model ?? null,
              sku: v.sku.trim().toUpperCase(),
              price: v.price ?? null,
            },
          });
          await tx.inventory.create({
            data: { variantId: variant.id, quantity: v.stock, reserved: 0, minStock: v.minStock ?? 0 },
          });
        }
      }
    }

    await tx.auditLog.create({
      data: {
        userId: input.actorUserId,
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: productId,
        details: { name: updated.name, slug: updated.slug },
      },
    });

    logger.info(`Product updated: ${updated.slug}`);
    return updated;
  });
}

// Toggles a product active/inactive (soft control — never destructive).
export async function setProductActive(productId: string, active: boolean, actorUserId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("NOT_FOUND", "Produto não encontrado.", 404);

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { isActive: active, status: active ? "ACTIVE" : "INACTIVE" },
  });

  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action: active ? "ACTIVATE_PRODUCT" : "DEACTIVATE_PRODUCT",
      entity: "Product",
      entityId: productId,
      details: { name: product.name, slug: product.slug },
    },
  });

  logger.info(`Product ${active ? "activated" : "deactivated"}: ${product.slug}`);
  return updated;
}
