import { prisma } from "@/lib/config/prisma";
import { requireAdminApi } from "@/server/auth/adminGuard";
import { AppError, handleServerException } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";

// Updates a coupon (admin). Supports toggling active, editing value/limits, etc.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdminApi();
    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!coupon) throw new AppError("NOT_FOUND", "Cupom não encontrado.", 404);

    const body = await request.json();
    const data: any = {};

    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.value === "number" && body.value >= 0) data.value = body.value;
    if (typeof body.minSubtotal === "number" && body.minSubtotal >= 0) data.minSubtotal = body.minSubtotal;
    if (body.maxUses != null && Number(body.maxUses) >= 0) data.maxUses = Number(body.maxUses);
    if (typeof body.maxUsesPerUser === "number" && body.maxUsesPerUser >= 1) data.maxUsesPerUser = body.maxUsesPerUser;
    if (body.validFrom) data.validFrom = new Date(body.validFrom);
    if (body.validUntil) data.validUntil = new Date(body.validUntil);

    const updated = await prisma.coupon.update({ where: { id: coupon.id }, data });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "UPDATE_COUPON",
        entity: "Coupon",
        entityId: coupon.id,
        details: { code: coupon.code, ...data },
      },
    });

    logger.info(`Admin updated coupon ${coupon.code}`);
    return Response.json({ coupon: updated });
  } catch (error) {
    return handleServerException(error);
  }
}

// Deactivates a coupon (soft) — never destructive delete when it has usage history.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdminApi();
    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!coupon) throw new AppError("NOT_FOUND", "Cupom não encontrado.", 404);

    const updated = await prisma.coupon.update({
      where: { id: coupon.id },
      data: { active: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "DEACTIVATE_COUPON",
        entity: "Coupon",
        entityId: coupon.id,
        details: { code: coupon.code },
      },
    });

    return Response.json({ coupon: updated });
  } catch (error) {
    return handleServerException(error);
  }
}
