import { requireAdminApi } from "@/server/auth/adminGuard";
import { handleServerException } from "@/lib/config/errors";
import { updateProduct, setProductActive } from "@/server/commerce/productService";

// Updates a product and optionally its variants/inventory (admin).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdminApi();
    const body = await request.json();
    const product = await updateProduct(params.id, {
      product: body.product ?? {},
      variants: body.variants,
      actorUserId: session.userId,
    });
    return Response.json({ product });
  } catch (error) {
    return handleServerException(error);
  }
}

// Activates / deactivates a product (admin). Soft control only.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdminApi();
    const body = await request.json();
    const active = typeof body?.active === "boolean" ? body.active : true;
    const product = await setProductActive(params.id, active, session.userId);
    return Response.json({ product });
  } catch (error) {
    return handleServerException(error);
  }
}
