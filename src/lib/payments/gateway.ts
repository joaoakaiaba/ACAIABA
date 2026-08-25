// Payment gateway abstraction.
//
// The business/domain layer NEVER depends directly on a specific provider
// (Mercado Pago, Asaas, Stripe, etc.). Instead it uses this interface. A
// provider is just an implementation of PaymentGateway, selected by a factory.
// This keeps the Checkout → PaymentService → PaymentGateway → Provider layering
// clean and lets a real gateway be swapped in without touching the domain.

export type PaymentProviderName = "simulated" | "mercadopago" | "asaas" | "stripe";

export interface CreatePaymentInput {
  externalReference: string; // order number
  amountCents: number;
  currency: string;
  description: string;
}

export interface PaymentChargeResult {
  provider: PaymentProviderName;
  providerPaymentId: string;
  status: "PENDING" | "AUTHORIZED" | "PAID" | "DECLINED";
  // PIX-specific fields (only populated when the provider supports PIX).
  qrCode?: string | null;
  qrCodeText?: string | null; // "copia e cola"
  expiresAt?: string | null;
}

export interface WebhookEvent {
  provider: PaymentProviderName;
  providerPaymentId: string;
  event: string;
  amountCents?: number;
  currency?: string;
  status?: string;
  raw?: unknown;
}

export interface PaymentGateway {
  readonly name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<PaymentChargeResult>;
  // Parses + authenticates a raw webhook payload into a normalized event.
  // Returns null when the payload is invalid / signature mismatch (rejected).
  parseWebhook(raw: unknown, headers: Record<string, string | undefined>): Promise<WebhookEvent | null>;
  // Optional reconciliation: fetch the current status of a payment from the provider.
  getPayment?(providerPaymentId: string): Promise<{ status: string; amountCents: number }>;
}

export interface GatewayConfig {
  name: PaymentProviderName;
  sandbox: boolean;
}
