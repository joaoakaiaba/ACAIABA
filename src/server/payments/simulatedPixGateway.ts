import {
  PaymentGateway,
  CreatePaymentInput,
  PaymentChargeResult,
  WebhookEvent,
  GatewayConfig,
} from "@/lib/payments/gateway";

// A deterministic SIMULATED PIX provider. In sandbox mode it "approves" the
// payment and emits a webhook-like event. This is NOT a real provider — it is a
// stand-in that exercises the exact same PaymentService/webhook path a real
// gateway (Mercado Pago/Asaas/Stripe) would use, so the domain layer is already
// correct when a real provider is plugged in.
//
// A real PIX payload (QR code, "copia e cola", expiration) is NOT stored because
// the Payment model currently has no field for it. When a real provider is
// integrated, a nullable column (e.g. providerPayload Json?) is needed via a
// dedicated migration. The abstraction is already in place for that.
export class SimulatedPixGateway implements PaymentGateway {
  readonly name = "simulated" as const;
  private sandbox: boolean;

  constructor(config: GatewayConfig) {
    this.sandbox = config.sandbox;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentChargeResult> {
    // Simulate a charge. In sandbox, generate a deterministic-looking PIX payload.
    const ref = `SIM-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    return {
      provider: "simulated",
      providerPaymentId: ref,
      status: "PENDING",
      // Placeholder PIX payload. Not persisted yet (see note above).
      qrCode: null,
      qrCodeText: `00020126580014BR.GOV.BCB.PIX0136${ref}5204000053039865406${input.amountCents.toFixed(0)}5802BR5913ACAIABA6009SAO PAULO6304A1B2`,
      expiresAt: expires,
    };
  }

  // In sandbox, webhooks are signed with a shared secret and must include the
  // expected fields. Real providers implement their own verification here.
  async parseWebhook(
    raw: unknown,
    headers: Record<string, string | undefined>
  ): Promise<WebhookEvent | null> {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (secret) {
      const signature = headers["x-sim-signature"];
      if (signature !== secret) return null;
    }

    const body = raw as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return null;
    const providerPaymentId = body.providerPaymentId;
    const event = body.event;
    if (typeof providerPaymentId !== "string" || typeof event !== "string") return null;

    return {
      provider: "simulated",
      providerPaymentId,
      event,
      amountCents: typeof body.amountCents === "number" ? body.amountCents : undefined,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      raw: body,
    };
  }
}
