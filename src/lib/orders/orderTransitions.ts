// Pure, DB-free rules for order/payment lifecycle transitions.
// This is the SINGLE source of truth for the order/payment state machine.
// Mirrors the OrderStatus / PaymentStatus enums and the InventoryMovementType
// values without importing the generated client, so they can be unit-tested.

import { isOrderStatus, type OrderStatusValue } from "./orderStatus";

export const PAYMENT_STATUSES = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "DECLINED",
  "REFUNDED",
  "CANCELED",
] as const;

export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

export function isPaymentStatus(value: string | null | undefined): value is PaymentStatusValue {
  return typeof value === "string" && (PAYMENT_STATUSES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// ORDER STATE MACHINE
// ---------------------------------------------------------------------------
// Valid OrderStatus transitions. An admin (or the system) may only move an order
// along one of these edges. Anything else is rejected on the server.
//
//   PENDING
//     → AWAITING_PAYMENT
//     → PAID            (payment confirmed)
//     → CANCELLED
//   AWAITING_PAYMENT
//     → PAID            (payment confirmed)
//     → CANCELLED
//   PAID
//     → PROCESSING
//     → REFUNDED
//     → CANCELLED
//   PROCESSING
//     → SHIPPED
//     → CANCELLED
//   SHIPPED
//     → DELIVERED
//     → REFUNDED
//   DELIVERED
//     → REFUNDED
//   CANCELLED / REFUNDED   (terminal — no outgoing edges)

const ORDER_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ["AWAITING_PAYMENT", "PAID", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransitionOrder(
  from: string | null | undefined,
  to: string | null | undefined
): boolean {
  if (!isOrderStatus(from) || !isOrderStatus(to)) return false;
  if (from === to) return true; // no-op is allowed (idempotent)
  return (ORDER_TRANSITIONS[from] ?? []).includes(to);
}

// ---------------------------------------------------------------------------
// PAYMENT ↔ ORDER SYNCHRONIZATION
// ---------------------------------------------------------------------------
// Maps a target OrderStatus to the PaymentStatus it implies, keeping both
// consistent. Only the meaningful, non-ambiguous mappings are returned.
export function paymentStatusForOrderStatus(
  orderStatus: string | null | undefined
): PaymentStatusValue | null {
  switch (orderStatus) {
    case "PENDING":
    case "AWAITING_PAYMENT":
      return "PENDING";
    case "PAID":
    case "PROCESSING":
    case "SHIPPED":
    case "DELIVERED":
      return "PAID";
    case "CANCELLED":
      return "CANCELED";
    case "REFUNDED":
      return "REFUNDED";
    default:
      return null;
  }
}

// A payment may be confirmed (PIX) only while it is still PENDING or AUTHORIZED.
export function canConfirmPayment(status: string | null | undefined): boolean {
  return status === "PENDING" || status === "AUTHORIZED";
}

// An order may be confirmed as paid only while it is still awaiting payment.
export function canMarkOrderPaid(status: string | null | undefined): boolean {
  return status === "PENDING" || status === "AWAITING_PAYMENT";
}

// An order may be cancelled by the customer only if it has not been shipped or
// delivered yet, and is not already cancelled/refunded.
export function canCancelOrder(status: string | null | undefined): boolean {
  return (
    status === "PENDING" ||
    status === "AWAITING_PAYMENT" ||
    status === "PAID" ||
    status === "PROCESSING"
  );
}

// After cancellation, stock must be returned. Maps the target order status to
// the correct inventory movement type (only when stock was actually taken).
export function cancellationMovementType(status: string | null | undefined) {
  if (status === "PENDING" || status === "AWAITING_PAYMENT") {
    // No sale confirmed yet: release any reservation.
    return "RELEASE";
  }
  return "CANCELLATION"; // PAID/PROCESSING => sale was deducted, so cancel restores it.
}

// A cancelled/refunded terminal order cannot be re-confirmed or re-cancelled.
export function isTerminalStatus(status: string | null | undefined): boolean {
  return status === "CANCELLED" || status === "REFUNDED";
}

export { isOrderStatus };
export type { OrderStatusValue };
