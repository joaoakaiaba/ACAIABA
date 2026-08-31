import { describe, it, expect } from "vitest";
import {
  isPaymentStatus,
  canConfirmPayment,
  canMarkOrderPaid,
  canCancelOrder,
  cancellationMovementType,
  isTerminalStatus,
  canTransitionOrder,
  paymentStatusForOrderStatus,
} from "../../src/lib/orders/orderTransitions";

describe("Order state machine (canTransitionOrder)", () => {
  it("should allow the forward happy-path transitions", () => {
    expect(canTransitionOrder("PENDING", "PAID")).toBe(true);
    expect(canTransitionOrder("PENDING", "AWAITING_PAYMENT")).toBe(true);
    expect(canTransitionOrder("AWAITING_PAYMENT", "PAID")).toBe(true);
    expect(canTransitionOrder("PAID", "PROCESSING")).toBe(true);
    expect(canTransitionOrder("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransitionOrder("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("should allow cancellation from non-terminal states", () => {
    expect(canTransitionOrder("PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("AWAITING_PAYMENT", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("PAID", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("PROCESSING", "CANCELLED")).toBe(true);
  });

  it("should allow refunds from paid states", () => {
    expect(canTransitionOrder("PAID", "REFUNDED")).toBe(true);
    expect(canTransitionOrder("SHIPPED", "REFUNDED")).toBe(true);
    expect(canTransitionOrder("DELIVERED", "REFUNDED")).toBe(true);
  });

  it("should DENY invalid/backwards/skipping transitions", () => {
    // Skipping states is not allowed.
    expect(canTransitionOrder("PENDING", "DELIVERED")).toBe(false);
    expect(canTransitionOrder("PENDING", "SHIPPED")).toBe(false);
    expect(canTransitionOrder("PENDING", "PROCESSING")).toBe(false);
    // Backwards transitions are not allowed.
    expect(canTransitionOrder("PAID", "PENDING")).toBe(false);
    expect(canTransitionOrder("SHIPPED", "PAID")).toBe(false);
    expect(canTransitionOrder("DELIVERED", "SHIPPED")).toBe(false);
    // A delivered order cannot be cancelled.
    expect(canTransitionOrder("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransitionOrder("SHIPPED", "CANCELLED")).toBe(false);
    // Terminal states have no outgoing transitions.
    expect(canTransitionOrder("CANCELLED", "PAID")).toBe(false);
    expect(canTransitionOrder("REFUNDED", "PAID")).toBe(false);
    expect(canTransitionOrder("CANCELLED", "AWAITING_PAYMENT")).toBe(false);
  });

  it("should allow a no-op (same status) for idempotency", () => {
    expect(canTransitionOrder("PENDING", "PENDING")).toBe(true);
    expect(canTransitionOrder("PAID", "PAID")).toBe(true);
    expect(canTransitionOrder("CANCELLED", "CANCELLED")).toBe(true);
  });

  it("should reject invalid or unknown statuses", () => {
    expect(canTransitionOrder("PENDING", "COMPLETED")).toBe(false);
    expect(canTransitionOrder("NOPE", "PAID")).toBe(false);
    expect(canTransitionOrder(null, "PAID")).toBe(false);
    expect(canTransitionOrder("PENDING", undefined)).toBe(false);
  });
});

describe("OrderStatus → PaymentStatus synchronization", () => {
  it("should map awaiting-payment order statuses to PENDING payment", () => {
    expect(paymentStatusForOrderStatus("PENDING")).toBe("PENDING");
    expect(paymentStatusForOrderStatus("AWAITING_PAYMENT")).toBe("PENDING");
  });

  it("should map paid/fullfilled order statuses to PAID payment", () => {
    expect(paymentStatusForOrderStatus("PAID")).toBe("PAID");
    expect(paymentStatusForOrderStatus("PROCESSING")).toBe("PAID");
    expect(paymentStatusForOrderStatus("SHIPPED")).toBe("PAID");
    expect(paymentStatusForOrderStatus("DELIVERED")).toBe("PAID");
  });

  it("should map cancelled/refunded order statuses to the matching payment status", () => {
    expect(paymentStatusForOrderStatus("CANCELLED")).toBe("CANCELED");
    expect(paymentStatusForOrderStatus("REFUNDED")).toBe("REFUNDED");
  });

  it("should return null for unknown statuses", () => {
    expect(paymentStatusForOrderStatus("WEIRD")).toBeNull();
    expect(paymentStatusForOrderStatus(null)).toBeNull();
    expect(paymentStatusForOrderStatus(undefined)).toBeNull();
  });
});

describe("Payment status validation", () => {
  it("should accept all legitimate payment statuses", () => {
    expect(isPaymentStatus("PENDING")).toBe(true);
    expect(isPaymentStatus("AUTHORIZED")).toBe(true);
    expect(isPaymentStatus("PAID")).toBe(true);
    expect(isPaymentStatus("DECLINED")).toBe(true);
    expect(isPaymentStatus("REFUNDED")).toBe(true);
    expect(isPaymentStatus("CANCELED")).toBe(true);
  });

  it("should reject invalid payment statuses", () => {
    expect(isPaymentStatus("CONFIRMED")).toBe(false);
    expect(isPaymentStatus("")).toBe(false);
    expect(isPaymentStatus(null)).toBe(false);
    expect(isPaymentStatus(undefined)).toBe(false);
  });
});

describe("Payment confirmation idempotency", () => {
  it("should allow confirming a PENDING or AUTHORIZED payment", () => {
    expect(canConfirmPayment("PENDING")).toBe(true);
    expect(canConfirmPayment("AUTHORIZED")).toBe(true);
  });

  it("should DENY confirming an already-paid/refunded/canceled payment (idempotency guard)", () => {
    expect(canConfirmPayment("PAID")).toBe(false);
    expect(canConfirmPayment("REFUNDED")).toBe(false);
    expect(canConfirmPayment("CANCELED")).toBe(false);
    expect(canConfirmPayment("DECLINED")).toBe(false);
    expect(canConfirmPayment(null)).toBe(false);
  });

  it("should allow marking the order PAID only while awaiting payment", () => {
    expect(canMarkOrderPaid("PENDING")).toBe(true);
    expect(canMarkOrderPaid("AWAITING_PAYMENT")).toBe(true);
    expect(canMarkOrderPaid("PAID")).toBe(false);
    expect(canMarkOrderPaid("CANCELLED")).toBe(false);
    expect(canMarkOrderPaid("SHIPPED")).toBe(false);
  });
});

describe("Order cancellation rules", () => {
  it("should allow cancelling PENDING/AWAITING_PAYMENT/PAID/PROCESSING orders", () => {
    expect(canCancelOrder("PENDING")).toBe(true);
    expect(canCancelOrder("AWAITING_PAYMENT")).toBe(true);
    expect(canCancelOrder("PAID")).toBe(true);
    expect(canCancelOrder("PROCESSING")).toBe(true);
  });

  it("should DENY cancelling shipped/delivered/terminal orders", () => {
    expect(canCancelOrder("SHIPPED")).toBe(false);
    expect(canCancelOrder("DELIVERED")).toBe(false);
    expect(canCancelOrder("CANCELLED")).toBe(false);
    expect(canCancelOrder("REFUNDED")).toBe(false);
  });

  it("should classify terminal statuses", () => {
    expect(isTerminalStatus("CANCELLED")).toBe(true);
    expect(isTerminalStatus("REFUNDED")).toBe(true);
    expect(isTerminalStatus("PAID")).toBe(false);
  });

  it("should pick the right inventory movement type on cancellation", () => {
    // Never-paid order => RELEASE (reservation released, no sale deducted).
    expect(cancellationMovementType("PENDING")).toBe("RELEASE");
    expect(cancellationMovementType("AWAITING_PAYMENT")).toBe("RELEASE");
    // Paid order => CANCELLATION (sale was deducted, must be restored).
    expect(cancellationMovementType("PAID")).toBe("CANCELLATION");
    expect(cancellationMovementType("PROCESSING")).toBe("CANCELLATION");
  });
});
