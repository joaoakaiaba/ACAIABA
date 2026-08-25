import { prisma } from "@/lib/config/prisma";
import { getActiveSession } from "@/server/auth/session";
import { AppError, handleServerException } from "@/lib/config/errors";

// Returns full details of a single order FOR THE AUTHENTICATED CUSTOMER ONLY.
// Anti-IDOR: a customer can only read their own orders.
export async function GET(
  _request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      throw new AppError("AUTHENTICATION", "Não autenticado.", 401);
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber: params.orderNumber },
      include: {
        customer: { include: { user: true } },
        payment: true,
        items: true,
        coupon: true,
      },
    });

    if (!order || order.customer.userId !== session.userId) {
      throw new AppError("NOT_FOUND", "Pedido não encontrado.", 404);
    }

    const address = (order.addressSnapshot as any) || {};

    return Response.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shipping: Number(order.shipping),
        total: Number(order.total),
        currency: order.currency,
        notes: order.notes,
        payment: order.payment
          ? {
              method: order.payment.method,
              status: order.payment.status,
              amount: Number(order.payment.amount),
            }
          : null,
        coupon: order.coupon ? { code: order.coupon.code, type: order.coupon.type } : null,
        address: {
          cep: address?.cep || null,
          state: address?.state || null,
          city: address?.city || null,
          neighborhood: address?.neighborhood || null,
          street: address?.street || null,
          number: address?.number || null,
          complement: address?.complement || null,
          shippingMethod: address?.shippingMethod || null,
        },
        items: order.items.map((i) => ({
          productName: i.productName,
          sku: i.sku,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      },
    });
  } catch (error) {
    return handleServerException(error);
  }
}
