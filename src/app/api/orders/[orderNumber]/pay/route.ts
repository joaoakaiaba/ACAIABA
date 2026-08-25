import { confirmOrderPayment } from "@/server/commerce/orderActions";
import { handleServerException } from "@/lib/config/errors";

// Confirms the PIX payment of the authenticated customer's order (idempotent).
export async function POST(
  _request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const result = await confirmOrderPayment(params.orderNumber);
    return Response.json(result);
  } catch (error) {
    return handleServerException(error);
  }
}
