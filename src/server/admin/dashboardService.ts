"use server";

import { prisma } from "@/lib/config/prisma";
import {
  REVENUE_STATUSES,
  computeAverageTicket,
  getPeriodRange,
  buildDayBucket,
  formatDayLabel,
  type DashboardPeriod,
} from "@/lib/commerce/metrics";

export interface DashboardData {
  totalRevenue: number;
  periodRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  averageTicket: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  couponsUsed: number;
  salesByDay: Array<{ date: string; orders: number; revenue: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    paymentMethod: string | null;
    createdAt: Date;
  }>;
  lowStock: Array<{
    productName: string;
    sku: string;
    variantLabel: string;
    available: number;
    reserved: number;
    total: number;
    minStock: number;
  }>;
  recentAudits: Array<{
    id: string;
    action: string;
    entity: string;
    userName: string;
    createdAt: Date;
    details: string;
  }>;
}

// Centralized, efficient dashboard queries. Uses Prisma aggregations and
// filtered counts instead of loading all rows into memory.
export async function getDashboardData(period: DashboardPeriod = "30d"): Promise<DashboardData> {
  const { start } = getPeriodRange(period);

  // Revenue: sum of totals for paid/fulfilled orders (all-time).
  const revenueAgg = await prisma.order.aggregate({
    where: { status: { in: REVENUE_STATUSES as any } },
    _sum: { total: true },
  });
  const totalRevenue = Number(revenueAgg._sum.total ?? 0);

  // Revenue within the selected period.
  const periodRevenueAgg = await prisma.order.aggregate({
    where: { status: { in: REVENUE_STATUSES as any }, createdAt: { gte: start } },
    _sum: { total: true },
  });
  const periodRevenue = Number(periodRevenueAgg._sum.total ?? 0);

  // Order counts by status (efficient filtered counts, no full-table load).
  const [totalOrders, paidOrders, pendingOrders, cancelledOrders, refundedOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.order.count({
        where: { status: { in: ["PENDING", "AWAITING_PAYMENT"] } },
      }),
      prisma.order.count({ where: { status: "CANCELLED" } }),
      prisma.order.count({ where: { status: "REFUNDED" } }),
    ]);

  // Average ticket from revenue orders (all-time).
  const revenueOrders = await prisma.order.count({
    where: { status: { in: REVENUE_STATUSES as any } },
  });
  const averageTicket = computeAverageTicket(totalRevenue, revenueOrders);

  // Active products + low/out-of-stock counts.
  const [activeProducts, lowStockProducts, outOfStockProducts] = await Promise.all([
    prisma.product.count({ where: { isActive: true, status: "ACTIVE" } }),
    prisma.inventory.count({ where: { quantity: { gt: 0, lte: prisma.inventory.fields.minStock } } }),
    prisma.inventory.count({ where: { quantity: 0 } }),
  ]);

  // Coupons used (CouponUsage rows) and distinct coupons.
  const couponsUsed = await prisma.couponUsage.count();

  // Sales by day within the period (revenue orders only).
  const salesByDay = await computeSalesByDay(period);

  // Recent orders.
  const recentOrdersRaw = await prisma.order.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { customer: { include: { user: true } }, payment: true },
  });
  const recentOrders = recentOrdersRaw.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customer.user.name,
    total: Number(o.total),
    status: o.status,
    paymentMethod: o.payment?.method ?? null,
    createdAt: o.createdAt,
  }));

  // Low-stock product details.
  const lowStockRaw = await prisma.inventory.findMany({
    where: { quantity: { lte: prisma.inventory.fields.minStock } },
    orderBy: { quantity: "asc" },
    take: 8,
    include: { variant: { include: { product: { include: { brand: true } } } } },
  });
  const lowStock = lowStockRaw.map((i) => ({
    productName: i.variant.product.name,
    sku: i.variant.sku,
    variantLabel: [i.variant.size, i.variant.color].filter(Boolean).join(" / ") || "Padrão",
    available: i.quantity - i.reserved,
    reserved: i.reserved,
    total: i.quantity,
    minStock: i.minStock,
  }));

  // Recent audit logs.
  const recentAuditsRaw = await prisma.auditLog.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  const recentAudits = recentAuditsRaw.map((a) => ({
    id: a.id,
    action: a.action,
    entity: a.entity,
    userName: a.user?.name ?? "Sistema",
    createdAt: a.createdAt,
    details: a.details ? JSON.stringify(a.details) : "",
  }));

  return {
    totalRevenue,
    periodRevenue,
    totalOrders,
    paidOrders,
    pendingOrders,
    cancelledOrders,
    refundedOrders,
    averageTicket,
    activeProducts,
    lowStockProducts,
    outOfStockProducts,
    couponsUsed,
    salesByDay,
    recentOrders,
    lowStock,
    recentAudits,
  };
}

// Computes revenue/order totals grouped by day for a period, filling gaps so the
// chart is contiguous. Uses a filtered findMany (only revenue orders in window).
async function computeSalesByDay(
  period: DashboardPeriod
): Promise<Array<{ date: string; orders: number; revenue: number }>> {
  const { start, end } = getPeriodRange(period);
  const bucket = buildDayBucket(period);

  const rows = await prisma.order.findMany({
    where: {
      status: { in: REVENUE_STATUSES as any },
      createdAt: { gte: start, lt: end },
    },
    select: { createdAt: true, total: true },
  });

  for (const r of rows) {
    const label = formatDayLabel(r.createdAt);
    const b = bucket.get(label);
    if (b) {
      b.revenue += Number(r.total);
      b.orders += 1;
    }
  }

  return Array.from(bucket.entries()).map(([date, v]) => ({
    date,
    orders: v.orders,
    revenue: Math.round(v.revenue * 100) / 100,
  }));
}
