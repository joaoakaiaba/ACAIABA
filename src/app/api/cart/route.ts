import { getCart, clearCart } from "@/server/commerce/cartService";
import { handleServerException } from "@/lib/config/errors";

// Returns the authenticated customer's persisted cart with server-derived pricing.
export async function GET() {
  try {
    const cart = await getCart();
    return Response.json({ cart });
  } catch (error) {
    return handleServerException(error);
  }
}

// Clears the authenticated customer's cart.
export async function DELETE() {
  try {
    const cart = await clearCart();
    return Response.json({ cart });
  } catch (error) {
    return handleServerException(error);
  }
}
