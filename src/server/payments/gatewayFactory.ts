import { PaymentGateway, GatewayConfig, PaymentProviderName } from "@/lib/payments/gateway";
import { SimulatedPixGateway } from "@/server/payments/simulatedPixGateway";

// Selects the payment gateway based on config. The default is the simulated
// provider so the app works end-to-end without external credentials. To use a
// real provider later, implement PaymentGateway and return it here based on
// process.env.PAYMENT_PROVIDER (e.g. "mercadopago").
export function getGateway(): PaymentGateway {
  const mode = (process.env.PAYMENT_PROVIDER || "simulated") as PaymentProviderName;
  const sandbox = (process.env.PAYMENT_PROVIDER_MODE || "SANDBOX") !== "PRODUCTION";

  switch (mode) {
    // Future real providers would be returned here:
    // case "mercadopago": return new MercadoPagoGateway({ sandbox });
    // case "asaas": return new AsaasGateway({ sandbox });
    // case "stripe": return new StripeGateway({ sandbox });
    default:
      return new SimulatedPixGateway({ name: "simulated", sandbox });
  }
}
