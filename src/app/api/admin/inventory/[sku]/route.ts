import { prisma } from "@/lib/config/prisma";
import { requireAdminApi } from "@/server/auth/adminGuard";
import { AppError, handleServerException } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import { InventoryMovementType } from "@prisma/client";

// Server-side authorization is enforced before any inventory mutation.
// Only users with an administrative role and ACTIVE status can adjust stock.
//
// This endpoint performs a manual stock adjustment (InventoryMovementType.ADJUSTMENT)
// that is independent of the checkout/order sale flow. It does NOT touch the
// reserved/quantity rules used by order processing.
export async function PATCH(
  request: Request,
  { params }: { params: { sku: string } }
) {
  try {
    const session = await requireAdminApi();

    const body = await request.json();
    const quantityRaw = body?.quantity;
    const minStockRaw = body?.minStock;

    if (typeof quantityRaw !== "number" || !Number.isInteger(quantityRaw) || quantityRaw < 0) {
      throw new AppError("VALIDATION", "Quantidade deve ser um inteiro maior ou igual a zero.");
    }

    let minStock = 0;
    if (typeof minStockRaw === "number") {
      if (!Number.isInteger(minStockRaw) || minStockRaw < 0) {
        throw new AppError("VALIDATION", "Estoque mínimo deve ser um inteiro maior ou igual a zero.");
      }
      minStock = minStockRaw;
    }

    const inventory = await prisma.inventory.findUnique({
      where: { variant: { sku: params.sku } },
      include: { variant: { include: { product: true } } },
    });

    if (!inventory) {
      throw new AppError("NOT_FOUND", "Estoque não encontrado para a variante informada.", 404);
    }

    // An ADJUSTMENT is an absolute correction of the current quantity. It must never
    // leave the available quantity (quantity - reserved) below zero.
    const newQuantity = quantityRaw;
    if (newQuantity < inventory.reserved) {
      throw new AppError(
        "BUSINESS",
        `Não é possível definir a quantidade abaixo do reservado (${inventory.reserved}).`
      );
    }

    const delta = newQuantity - inventory.quantity;

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity, minStock },
      });

      // Record the manual adjustment movement (absolute delta).
      if (delta !== 0) {
        await tx.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            userId: session.userId,
            type: InventoryMovementType.ADJUSTMENT,
            quantity: delta,
            reason: "Ajuste manual de estoque pelo administrador",
          },
        });
      }

      // Record the administrative change in the audit log.
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "ADJUST_STOCK",
          entity: "Inventory",
          entityId: inv.id,
          details: {
            sku: params.sku,
            fromQuantity: inventory.quantity,
            toQuantity: newQuantity,
            fromMinStock: inventory.minStock,
            toMinStock: minStock,
          },
        },
      });

      return inv;
    });

    logger.info(
      `Admin ${session.userId} adjusted stock for ${params.sku}: ${inventory.quantity} -> ${newQuantity}`
    );

    return Response.json({
      updated: true,
      inventory: {
        id: updated.id,
        variantId: updated.variantId,
        sku: params.sku,
        quantity: updated.quantity,
        reserved: updated.reserved,
        minStock: updated.minStock,
      },
    });
  } catch (error) {
    return handleServerException(error);
  }
}
