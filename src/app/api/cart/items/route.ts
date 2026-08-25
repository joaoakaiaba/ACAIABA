import { addCartItem } from "@/server/commerce/cartService";
import { handleServerException } from "@/lib/config/errors";

// Adds an item (variant) to the authenticated customer's cart.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const variantId = body?.variantId;
    const quantity = body?.quantity ?? 1;

    if (typeof variantId !== "string" || !variantId) {
      return Response.json({ error: "variantId é obrigatório." }, { status: 400 });
    }

    const cart = await addCartItem(variantId, Number(quantity));
    return Response.json({ cart });
  } catch (error) {
    return handleServerException(error);
  }
}
