import { canAccessAdmin } from "../auth/authorize";

// Valid values of the OrderStatus enum (mirrors the Prisma schema without
// importing the generated client, so it can be unit-tested anywhere).
export const ORDER_STATUSES = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

// Validates that a given status value is a legitimate order status.
export function isOrderStatus(status: string | null | undefined): status is OrderStatusValue {
  return typeof status === "string" && (ORDER_STATUSES as readonly string[]).includes(status);
}

// Changing the status of an order is an administrative operation. It is allowed
// only for users with an administrative role whose account is ACTIVE.
export function canChangeOrderStatus(
  role: string | null | undefined,
  status: string | null | undefined
): boolean {
  return canAccessAdmin(role, status);
}
