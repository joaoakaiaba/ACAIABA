import { cancelOrder } from "@/server/commerce/orderActions";
import { handleServerException } from "@/lib/config/errors";

// Cancels the authenticated customer's order (idempotent) and releases stock.
export async function POST(
  _request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const result = await cancelOrder(params.orderNumber);
    return Response.json(result);
  } catch (error) {
    return handleServerException(error);
  }
}
