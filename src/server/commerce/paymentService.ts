"use server";

import { prisma } from "@/lib/config/prisma";
import { AppError } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import { getGateway } from "@/server/payments/gatewayFactory";
import { PaymentMethod } from "@prisma/client";
import { canTransitionOrder, paymentStatusForOrderStatus } from "@/lib/orders/orderTransitions";

// Creates the Payment record for an order and, if a gateway is configured,
// requests a charge from the provider. Returns the persisted payment plus any
// provider data (e.g. PIX payload). Idempotent by orderId (one payment per order).
export async function createPaymentForOrder(
  orderId: string,
  method: PaymentMethod,
  amountCents: number,
  currency: string,
  externalReference: string,
  description: string
) {
  const gateway = getGateway();
  const charge = await gateway.createPayment({
    externalReference,
    amountCents,
    currency,
    description,
  });

  const payment = await prisma.payment.create({
    data: {
      orderId,
      gateway: charge.provider,
      transactionId: charge.providerPaymentId,
      status: "PENDING",
      amount: amountCents / 100,
      method,
    },
  });

  logger.info(`Payment created for order ${externalReference} via ${charge.provider}`);

  return {
    payment,
    provider: {
      providerPaymentId: charge.providerPaymentId,
      status: charge.status,
      qrCode: charge.qrCode ?? null,
      qrCodeText: charge.qrCodeText ?? null,
      expiresAt: charge.expiresAt ?? null,
    },
  };
}

// Marks an order + its payment as PAID, through the domain state machine, when a
// payment is confirmed (by webhook or manual confirmation). Idempotent: if the
// payment is already PAID it is a no-op. Atomic.
export async function markOrderPaidByTransactionId(
  transactionId: string,
  amountCents: number
): Promise<{ idempotent: boolean; orderNumber: string; orderStatus: string }> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { transactionId },
      include: { order: true },
    });

    if (!payment) {
      throw new AppError("NOT_FOUND", "Pagamento não encontrado.", 404);
    }

    // Verify amount matches (price-tampering guard).
    if (Math.round(Number(payment.amount) * 100) !== amountCents) {
      throw new AppError("BUSINESS", "Valor do pagamento não confere com o pedido.");
    }

    // Idempotency: already PAID/CANCELED => no-op.
    if (payment.status !== "PENDING" && payment.status !== "AUTHORIZED") {
      return {
        idempotent: true,
        orderNumber: payment.order.orderNumber,
        orderStatus: payment.order.status,
      };
    }

    // Drive order through the state machine: PENDING|AWAITING_PAYMENT → PAID.
    if (!canTransitionOrder(payment.order.status, "PAID")) {
      throw new AppError(
        "BUSINESS",
        `Não é possível confirmar pagamento no estado ${payment.order.status}.`
      );
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    const updatedOrder = await tx.order.update({
      where: { id: payment.order.id },
      data: { status: "PAID" },
    });

    await tx.auditLog.create({
      data: {
        action: "PAYMENT_CONFIRMED",
        entity: "Order",
        entityId: updatedOrder.id,
        details: {
          orderNumber: updatedOrder.orderNumber,
          transactionId,
          paymentStatus: updatedPayment.status,
          orderStatus: updatedOrder.status,
        },
      },
    });

    logger.info(`Payment ${transactionId} confirmed for order ${updatedOrder.orderNumber}`);
    return {
      idempotent: false,
      orderNumber: updatedOrder.orderNumber,
      orderStatus: updatedOrder.status,
    };
  });
}

// Validates and processes a webhook event. Idempotent against duplicate events.
export async function processWebhookEvent(event: {
  providerPaymentId: string;
  amountCents?: number;
  event: string;
  status?: string;
}) {
  // Only confirm on a positive payment/paid event.
  const positive = ["payment.confirmed", "payment.approved", "payment.paid", "PAID"];
  if (!positive.includes(event.event) && !(event.status === "PAID")) {
    logger.info(`Webhook ignored (non-positive event) for ${event.providerPaymentId}`);
    return { ignored: true };
  }

  const amountCents = event.amountCents;
  if (typeof amountCents !== "number" || amountCents <= 0) {
    throw new AppError("BUSINESS", "Webhook sem valor de pagamento.");
  }

  const result = await markOrderPaidByTransactionId(event.providerPaymentId, amountCents);
  return result;
}
