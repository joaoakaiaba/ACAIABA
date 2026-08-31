// Pure, DB-free helpers for admin dashboard metrics. Kept separate from the
// Prisma queries so the business rules (revenue status, ticket, period ranges)
// can be unit-tested anywhere.

import { isOrderStatus, type OrderStatusValue } from "../orders/orderStatus";

// Order statuses that count towards "revenue" (paid/fulfilled), matching the
// existing dashboard semantics.
export const REVENUE_STATUSES: readonly OrderStatusValue[] = [
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export function isRevenueStatus(status: string | null | undefined): boolean {
  return isOrderStatus(status) && (REVENUE_STATUSES as readonly string[]).includes(status);
}

// Average ticket = revenue / count of revenue-generating orders.
// Returns 0 when there are no revenue orders.
export function computeAverageTicket(
  revenue: number,
  revenueOrderCount: number
): number {
  if (revenueOrderCount <= 0) return 0;
  return revenue / revenueOrderCount;
}

export type DashboardPeriod = "today" | "7d" | "30d";

// Returns the inclusive [start, end) window for a dashboard period relative to
// `now`. "today" is the current calendar day (00:00 local). The end is exclusive.
export function getPeriodRange(
  period: DashboardPeriod,
  now: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(now);
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  const days = period === "7d" ? 7 : 30;
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

// Formats a Date as a local YYYY-MM-DD label (for the sales-by-day table).
export function formatDayLabel(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Builds a contiguous map of day labels -> empty buckets for a period, so the
// chart shows every day (even days with no sales) instead of skipping gaps.
export function buildDayBucket(
  period: DashboardPeriod,
  now: Date = new Date()
): Map<string, { revenue: number; orders: number }> {
  const { start } = getPeriodRange(period, now);
  const days = period === "today" ? 1 : period === "7d" ? 7 : 30;
  const bucket = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    bucket.set(formatDayLabel(d), { revenue: 0, orders: 0 });
  }
  return bucket;
}
