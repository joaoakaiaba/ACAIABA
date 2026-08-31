import { prisma } from "@/lib/config/prisma";
import { requireAdminApi } from "@/server/auth/adminGuard";
import { AppError, handleServerException } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import {
  canTransitionOrder,
  paymentStatusForOrderStatus,
} from "@/lib/orders/orderTransitions";

// Returns full details of a single order for administrative viewing.
export async function GET(
  _request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    await requireAdminApi();
    const order = await getOrderOrThrow(params.orderNumber);
    return Response.json({ order });
  } catch (error) {
    return handleServerException(error);
  }
}

// Safely changes the status of an order. Authorization is validated on the
// server (admin role + ACTIVE status). The transition is validated against the
// order state machine, and the PaymentStatus is kept synchronized with the new
// OrderStatus. The whole operation runs atomically and records an AuditLog.
export async function PATCH(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const session = await requireAdminApi();

    const body = await request.json();
    const newStatus = body?.status;

    // Validate against the state machine: the target must be a real status AND
    // the transition must be a permitted edge from the current status.
    const order = await getOrderOrThrow(params.orderNumber);

    if (!canTransitionOrder(order.status, newStatus)) {
      throw new AppError(
        "BUSINESS",
        `Transição de status inválida: ${order.status} → ${newStatus}.`
      );
    }

    // Avoid a no-op update when the status is unchanged.
    if (order.status === newStatus) {
      return Response.json({ order: order, updated: false });
    }

    // Determine the synchronized payment status implied by the new order status.
    const targetPaymentStatus = paymentStatusForOrderStatus(newStatus);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: newStatus },
        include: {
          customer: { include: { user: true } },
          payment: true,
          items: true,
        },
      });

      // Keep PaymentStatus consistent with OrderStatus when a payment exists.
      let paymentStatusChanged = false;
      if (updated.payment && targetPaymentStatus && updated.payment.status !== targetPaymentStatus) {
        await tx.payment.update({
          where: { id: updated.payment.id },
          data: { status: targetPaymentStatus },
        });
        paymentStatusChanged = true;
      }

      // Record the administrative change in the audit log.
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "UPDATE_STATUS",
          entity: "Order",
          entityId: order.id,
          details: {
            orderNumber: params.orderNumber,
            from: order.status,
            to: newStatus,
            paymentStatusChanged,
            paymentStatus: targetPaymentStatus,
          },
        },
      });

      return { updated, paymentStatusChanged };
    });

    logger.info(
      `Admin ${session.userId} changed order ${params.orderNumber} status from ${order.status} to ${newStatus}`
    );

    const { updated } = result;
    const address = (updated.addressSnapshot as any) || {};
    return Response.json({
      updated: true,
      paymentStatusChanged: result.paymentStatusChanged,
      order: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        customerName: updated.customer.user.name,
        customerEmail: updated.customer.user.email,
        date: updated.createdAt.toISOString(),
        status: updated.status,
        subtotal: Number(updated.subtotal),
        discount: Number(updated.discount),
        shipping: Number(updated.shipping),
        total: Number(updated.total),
        paymentMethod: updated.payment?.method || null,
        paymentStatus: targetPaymentStatus,
        shippingMethod: address?.shippingMethod || null,
        itemsCount: updated.items.reduce((sum, i) => sum + i.quantity, 0),
      },
    });
  } catch (error) {
    return handleServerException(error);
  }
}

async function getOrderOrThrow(orderNumber: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: { include: { user: true } },
      payment: true,
      items: true,
      coupon: true,
    },
  });

  if (!order) {
    throw new AppError("NOT_FOUND", "Pedido não encontrado.", 404);
  }

  const address = (order.addressSnapshot as any) || {};

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.user.name,
    customerEmail: order.customer.user.email,
    date: order.createdAt.toISOString(),
    status: order.status,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shipping: Number(order.shipping),
    total: Number(order.total),
    currency: order.currency,
    notes: order.notes,
    paymentMethod: order.payment?.method || null,
    paymentStatus: order.payment?.status || null,
    shippingMethod: address?.shippingMethod || null,
    address: {
      cep: address?.cep || null,
      state: address?.state || null,
      city: address?.city || null,
      neighborhood: address?.neighborhood || null,
      street: address?.street || null,
      number: address?.number || null,
      complement: address?.complement || null,
      reference: address?.reference || null,
    },
    items: order.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      sku: i.sku,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      total: Number(i.total),
    })),
    coupon: order.coupon ? { code: order.coupon.code, type: order.coupon.type } : null,
  };
}
