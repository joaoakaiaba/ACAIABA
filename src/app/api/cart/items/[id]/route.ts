import { updateCartItemQuantity, removeCartItem } from "@/server/commerce/cartService";
import { handleServerException } from "@/lib/config/errors";

// Updates the quantity of a cart line (or removes it if qty <= 0).
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const quantity = body?.quantity;
    if (typeof quantity !== "number") {
      return Response.json({ error: "quantity é obrigatório." }, { status: 400 });
    }
    const cart = await updateCartItemQuantity(params.id, quantity);
    return Response.json({ cart });
  } catch (error) {
    return handleServerException(error);
  }
}

// Removes a cart line.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cart = await removeCartItem(params.id);
    return Response.json({ cart });
  } catch (error) {
    return handleServerException(error);
  }
}
