import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { getActiveSession } from "@/server/auth/session";

// Returns the list of orders belonging to the currently authenticated customer.
// This replaces the previously hardcoded mock list with real data from the database.
// Only active (non-suspended) accounts can access their orders.
export async function GET() {
  const session = await getActiveSession();

  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: session.userId },
  });

  if (!customer) {
    return NextResponse.json({ orders: [] }, { status: 200 });
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payment: true,
    },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.orderNumber,
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString(),
      total: Number(o.total),
      status: o.status,
      itemsCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    })),
  });
}
