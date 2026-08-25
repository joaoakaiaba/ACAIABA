import { getFavorites } from "@/server/commerce/favoritesService";
import { handleServerException } from "@/lib/config/errors";

// Lists the authenticated customer's favorites (real, from PostgreSQL).
export async function GET() {
  try {
    const favorites = await getFavorites();
    return Response.json({ favorites });
  } catch (error) {
    return handleServerException(error);
  }
}
