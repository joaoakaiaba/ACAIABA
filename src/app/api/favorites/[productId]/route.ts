import { addFavorite, removeFavorite, isProductFavorite } from "@/server/commerce/favoritesService";
import { handleServerException } from "@/lib/config/errors";

// Adds a product to the authenticated customer's favorites (idempotent).
export async function POST(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    await addFavorite(params.productId);
    return Response.json({ favorited: true });
  } catch (error) {
    return handleServerException(error);
  }
}

// Removes a product from the authenticated customer's favorites.
export async function DELETE(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    await removeFavorite(params.productId);
    return Response.json({ favorited: false });
  } catch (error) {
    return handleServerException(error);
  }
}

// Returns whether a product is favorited.
export async function GET(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const favorited = await isProductFavorite(params.productId);
    return Response.json({ favorited });
  } catch (error) {
    return handleServerException(error);
  }
}
