import { prisma } from "@/lib/config/prisma";
import { requireAdminApi } from "@/server/auth/adminGuard";
import { AppError, handleServerException } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import { canTransitionOrder } from "@/lib/orders/orderTransitions";

// Admin-initiated refund of an order. Authorization is validated on the server
// (admin role + ACTIVE). The transition is enforced by the central state machine
// and the Payment is kept synchronized. Refund restores sold stock.
export async function POST(
  _request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const session = await requireAdminApi();

    const order = await prisma.order.findUnique({
      where: { orderNumber: params.orderNumber },
      include: {
        payment: true,
        items: { include: { variant: { include: { inventory: true } } } },
      },
    });

    if (!order) {
      throw new AppError("NOT_FOUND", "Pedido não encontrado.", 404);
    }

    // Idempotency.
    if (order.status === "REFUNDED") {
      return Response.json({ idempotent: true, orderNumber: order.orderNumber, status: order.status });
    }

    if (!canTransitionOrder(order.status, "REFUNDED")) {
      throw new AppError(
        "BUSINESS",
        `Não é possível reembolsar o pedido no estado ${order.status}.`
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Restore stock for every item.
      for (const item of order.items) {
        const inventory = item.variant?.inventory;
        if (!inventory) continue;
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { increment: item.quantity } },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryId: inventory.id,
            userId: session.userId,
            type: "CANCELLATION" as any,
            quantity: item.quantity,
            reason: `Reembolso do pedido ${order.orderNumber}`,
          },
        });
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED" },
      });

      let paymentStatus: string | null = order.payment?.status ?? null;
      if (order.payment) {
        const p = await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: "REFUNDED" },
        });
        paymentStatus = p.status;
      }

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "REFUND_ORDER",
          entity: "Order",
          entityId: order.id,
          details: {
            orderNumber: order.orderNumber,
            orderStatus: "REFUNDED",
            paymentStatus,
            inventoryReleased: order.items.length,
          },
        },
      });

      return { updated, paymentStatus };
    });

    logger.info(`Admin refunded order ${params.orderNumber}`);
    return Response.json({
      idempotent: false,
      orderNumber: result.updated.orderNumber,
      status: result.updated.status,
      paymentStatus: result.paymentStatus,
    });
  } catch (error) {
    return handleServerException(error);
  }
}
