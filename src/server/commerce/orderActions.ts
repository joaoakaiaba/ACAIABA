"use server";

import { prisma } from "@/lib/config/prisma";
import { getActiveSession } from "@/server/auth/session";
import { AppError } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import {
  canConfirmPayment,
  canMarkOrderPaid,
  canCancelOrder,
  canTransitionOrder,
  cancellationMovementType,
} from "@/lib/orders/orderTransitions";

interface ActionResult {
  idempotent: boolean;
  orderNumber: string;
  status: string;
  paymentStatus: string | null;
}

// Fetches an order by number and verifies the authenticated customer is its owner
// (anti-IDOR). Returns the order or throws 404/403.
async function getOwnedOrderOrThrow(orderNumber: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: true,
      payment: true,
      items: { include: { variant: { include: { inventory: true } } } },
    },
  });

  if (!order) {
    throw new AppError("NOT_FOUND", "Pedido não encontrado.", 404);
  }
  if (order.customer.userId !== userId) {
    // Do not leak existence of other customers' orders.
    throw new AppError("NOT_FOUND", "Pedido não encontrado.", 404);
  }
  return order;
}

// Confirms the payment (PIX) of an order. Idempotent: if the payment is already
// PAID, it is a no-op. Runs atomically so order + payment are kept consistent.
export async function confirmOrderPayment(orderNumber: string): Promise<ActionResult> {
  const session = await getActiveSession();
  if (!session) {
    throw new AppError("AUTHENTICATION", "Não autenticado.", 401);
  }

  const order = await getOwnedOrderOrThrow(orderNumber, session.userId);

  return prisma.$transaction(async (tx) => {
    const payment = order.payment;

    // Idempotency: already paid => no-op.
    if (payment && !canConfirmPayment(payment.status)) {
      logger.info(`confirmOrderPayment idempotent no-op for ${orderNumber}`);
      return {
        idempotent: true,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: payment.status,
      };
    }

    if (!payment) {
      throw new AppError("BUSINESS", "Este pedido não possui registro de pagamento.");
    }

    // Enforce the central state machine: PENDING|AWAITING_PAYMENT → PAID.
    if (!canTransitionOrder(order.status, "PAID")) {
      throw new AppError(
        "BUSINESS",
        `Não é possível confirmar pagamento no estado ${order.status}.`
      );
    }

    // Update payment to PAID.
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    // Update the order to PAID (only if it is awaiting payment).
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: canMarkOrderPaid(order.status) ? "PAID" : order.status,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.userId,
        action: "CONFIRM_PAYMENT",
        entity: "Order",
        entityId: order.id,
        details: {
          orderNumber: order.orderNumber,
          paymentStatus: updatedPayment.status,
          orderStatus: updatedOrder.status,
        },
      },
    });

    logger.info(`confirmOrderPayment: ${orderNumber} -> PAID`);
    return {
      idempotent: false,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedPayment.status,
    };
  });
}

// Cancels an order and releases any reserved/consumed stock. Idempotent: if the
// order is already cancelled/refunded it is a no-op. Atomic.
export async function cancelOrder(orderNumber: string): Promise<ActionResult> {
  const session = await getActiveSession();
  if (!session) {
    throw new AppError("AUTHENTICATION", "Não autenticado.", 401);
  }

  const order = await getOwnedOrderOrThrow(orderNumber, session.userId);

  // Idempotency: terminal orders cannot be cancelled again.
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    logger.info(`cancelOrder idempotent no-op for ${orderNumber}`);
    return {
      idempotent: true,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
    };
  }

  if (!canCancelOrder(order.status)) {
    throw new AppError(
      "BUSINESS",
      "Este pedido não pode mais ser cancelado (já enviado ou entregue)."
    );
  }

  // Enforce the central state machine: cancellable states → CANCELLED.
  if (!canTransitionOrder(order.status, "CANCELLED")) {
    throw new AppError(
      "BUSINESS",
      `Não é possível cancelar o pedido no estado ${order.status}.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const movementType = cancellationMovementType(order.status);

    // Release stock: for each item, restore the quantity that was taken and
    // register the appropriate inventory movement.
    for (const item of order.items) {
      const inventory = item.variant?.inventory;
      if (!inventory) continue;

      // Restore available quantity.
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: { increment: item.quantity } },
      });

      // Record movement (RELEASE for never-paid orders, CANCELLATION for paid).
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          userId: session.userId,
          type: movementType as any,
          quantity: item.quantity,
          reason: `Cancelamento do pedido ${order.orderNumber}`,
        },
      });
    }

    // Mark order cancelled and payment cancelled.
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    let updatedPaymentStatus: string | null = order.payment?.status ?? null;
    if (order.payment) {
      const updatedPayment = await tx.payment.update({
        where: { id: order.payment.id },
        data: { status: "CANCELED" },
      });
      updatedPaymentStatus = updatedPayment.status;
    }

    await tx.auditLog.create({
      data: {
        userId: session.userId,
        action: "CANCEL_ORDER",
        entity: "Order",
        entityId: order.id,
        details: {
          orderNumber: order.orderNumber,
          orderStatus: "CANCELLED",
          paymentStatus: updatedPaymentStatus,
          inventoryReleased: order.items.length,
        },
      },
    });

    logger.info(`cancelOrder: ${orderNumber} -> CANCELLED (stock released)`);
    return {
      idempotent: false,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedPaymentStatus,
    };
  });
}

// Refunds a paid order: releases stock and transitions it to REFUNDED through
// the central state machine. Idempotent (already REFUNDED => no-op). Atomic.
export async function refundOrder(orderNumber: string): Promise<ActionResult> {
  const session = await getActiveSession();
  if (!session) {
    throw new AppError("AUTHENTICATION", "Não autenticado.", 401);
  }

  const order = await getOwnedOrderOrThrow(orderNumber, session.userId);

  if (order.status === "REFUNDED") {
    logger.info(`refundOrder idempotent no-op for ${orderNumber}`);
    return {
      idempotent: true,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.payment?.status ?? null,
    };
  }

  if (!canTransitionOrder(order.status, "REFUNDED")) {
    throw new AppError(
      "BUSINESS",
      `Não é possível reembolsar o pedido no estado ${order.status}.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const movementType = "CANCELLATION"; // refund restores sold stock.

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
          type: movementType as any,
          quantity: item.quantity,
          reason: `Reembolso do pedido ${order.orderNumber}`,
        },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED" },
    });

    let updatedPaymentStatus: string | null = order.payment?.status ?? null;
    if (order.payment) {
      const updatedPayment = await tx.payment.update({
        where: { id: order.payment.id },
        data: { status: "REFUNDED" },
      });
      updatedPaymentStatus = updatedPayment.status;
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
          paymentStatus: updatedPaymentStatus,
          inventoryReleased: order.items.length,
        },
      },
    });

    logger.info(`refundOrder: ${orderNumber} -> REFUNDED (stock restored)`);
    return {
      idempotent: false,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedPaymentStatus,
    };
  });
}
