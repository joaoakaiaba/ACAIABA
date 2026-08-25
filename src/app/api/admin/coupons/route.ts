import { prisma } from "@/lib/config/prisma";
import { requireAdminApi } from "@/server/auth/adminGuard";
import { AppError, handleServerException } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";
import { CouponType } from "@prisma/client";

const COUPON_TYPES = ["PERCENTAGE", "FIXED_AMOUNT"];

// Lists all coupons (admin).
export async function GET() {
  try {
    await requireAdminApi();
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ coupons });
  } catch (error) {
    return handleServerException(error);
  }
}

// Creates a coupon (admin). All fields validated server-side.
export async function POST(request: Request) {
  try {
    const session = await requireAdminApi();
    const body = await request.json();

    const code = String(body?.code || "").trim().toUpperCase();
    const type = body?.type;
    const value = Number(body?.value);
    const validFrom = body?.validFrom ? new Date(body.validFrom) : null;
    const validUntil = body?.validUntil ? new Date(body.validUntil) : null;
    const minSubtotal = Number(body?.minSubtotal ?? 0);
    const maxUses = body?.maxUses != null ? Number(body.maxUses) : null;
    const maxUsesPerUser = Number(body?.maxUsesPerUser ?? 1);

    if (!code || !COUPON_TYPES.includes(type)) {
      throw new AppError("VALIDATION", "Código ou tipo de cupom inválido.");
    }
    if (!isFinite(value) || value < 0) {
      throw new AppError("VALIDATION", "Valor do cupom inválido.");
    }
    if (!validFrom || !validUntil || validUntil <= validFrom) {
      throw new AppError("VALIDATION", "Período de validade inválido.");
    }

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new AppError("CONFLICT", "Já existe um cupom com este código.");
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type,
        value,
        validFrom,
        validUntil,
        minSubtotal,
        maxUses,
        maxUsesPerUser,
        active: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "CREATE_COUPON",
        entity: "Coupon",
        entityId: coupon.id,
        details: { code: coupon.code, type: coupon.type, value: Number(coupon.value) },
      },
    });

    logger.info(`Admin created coupon ${code}`);
    return Response.json({ coupon }, { status: 201 });
  } catch (error) {
    return handleServerException(error);
  }
}
