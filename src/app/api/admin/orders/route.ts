import { prisma } from "@/lib/config/prisma";
import { requireAdminApi } from "@/server/auth/adminGuard";
import { handleServerException } from "@/lib/config/errors";

// Lists all real orders from the database for administrative management.
// Only users with an administrative role and ACTIVE status can list them.
export async function GET() {
  try {
    await requireAdminApi();

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { user: true } },
        payment: true,
        items: true,
      },
    });

    const payload = orders.map((o) => {
      const address = (o.addressSnapshot as any) || {};
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customer.user.name,
        customerEmail: o.customer.user.email,
        date: o.createdAt.toISOString(),
        status: o.status,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        shipping: Number(o.shipping),
        total: Number(o.total),
        paymentMethod: o.payment?.method || null,
        paymentStatus: o.payment?.status || null,
        shippingMethod: address?.shippingMethod || null,
        itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      };
    });

    return Response.json({ orders: payload });
  } catch (error) {
    return handleServerException(error);
  }
}
