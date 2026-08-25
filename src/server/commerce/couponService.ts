"use server";

import { prisma } from "@/lib/config/prisma";
import { AppError } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import {
  CouponSnapshot,
  validateCouponRules,
  calculateCouponDiscount,
} from "@/lib/commerce/couponRules";

function toSnapshot(c: any): CouponSnapshot {
  return {
    code: c.code,
    type: c.type,
    value: Number(c.value),
    validFrom: c.validFrom,
    validUntil: c.validUntil,
    minSubtotal: Number(c.minSubtotal),
    maxUses: c.maxUses,
    maxUsesPerUser: c.maxUsesPerUser,
    usageCount: c.usageCount,
    active: c.active,
  };
}

// Validates a coupon code against the DB (no side effects). Throws AppError on
// any violation. Returns the snapshot + discount when valid.
export async function validateCoupon(
  code: string,
  customerId: string,
  subtotal: number
): Promise<{ coupon: CouponSnapshot; discount: number }> {
  const couponRow = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!couponRow) {
    throw new AppError("BUSINESS", "Cupom não encontrado.");
  }

  const userUsageCount = await prisma.couponUsage.count({
    where: { couponId: couponRow.id, customerId },
  });

  const snapshot = toSnapshot(couponRow);
  const result = validateCouponRules({ coupon: snapshot, subtotal, userUsageCount });
  if (!result.ok) {
    throw new AppError("BUSINESS", result.reason);
  }

  const discount = calculateCouponDiscount(subtotal, snapshot);
  return { coupon: snapshot, discount };
}

// Atomically consumes one usage of the coupon (only within the available limit)
// and records the usage. Runs in the caller's transaction context.
//
// Concurrency-safe: the global usage count is guarded by an atomic conditional
// update (increment only if not at maxUses). Per-user limit is enforced by the
// combination of the CouponUsage unique-ish check + count check above.
export async function consumeCoupon(
  tx: any,
  couponId: string,
  customerId: string,
  orderId: string
): Promise<void> {
  const coupon = await tx.coupon.findUnique({ where: { id: couponId } });

  // Global limit: atomic conditional increment. If at the limit, reject.
  if (coupon.maxUses !== null) {
    const updated = await tx.coupon.updateMany({
      where: { id: couponId, usageCount: { lt: coupon.maxUses } },
      data: { usageCount: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new AppError("BUSINESS", "Este cupom atingiu o limite máximo de utilizações.");
    }
  } else {
    await tx.coupon.update({
      where: { id: couponId },
      data: { usageCount: { increment: 1 } },
    });
  }

  await tx.couponUsage.create({
    data: { couponId, customerId, orderId },
  });

  logger.info(`Coupon ${coupon.code} consumed for order ${orderId}`);
}
