import { getGateway } from "@/server/payments/gatewayFactory";
import { processWebhookEvent } from "@/server/commerce/paymentService";
import { handleServerException } from "@/lib/config/errors";
import { logger } from "@/lib/config/logging";

// Provider webhook endpoint.
//
// Security & correctness:
// - Signature/authenticity is validated by the gateway's parseWebhook (each
//   provider implements its own verification). Invalid payloads are rejected.
// - Payment is located by providerPaymentId (transactionId).
// - Amount is verified server-side against the persisted order.
// - Idempotent: a repeated/duplicate webhook is a no-op.
// - Order is updated ONLY through the domain state machine, never directly.
export async function POST(request: Request) {
  try {
    const gateway = getGateway();
    const raw = await request.json().catch(() => null);

    const headers: Record<string, string | undefined> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const event = await gateway.parseWebhook(raw, headers);
    if (!event) {
      logger.warn("Webhook rejected (invalid signature or payload)");
      return Response.json({ accepted: false }, { status: 400 });
    }

    const result = await processWebhookEvent({
      providerPaymentId: event.providerPaymentId,
      amountCents: event.amountCents,
      event: event.event,
      status: event.status,
    });

    return Response.json({ accepted: true, ...result }, { status: 200 });
  } catch (error) {
    return handleServerException(error);
  }
}
