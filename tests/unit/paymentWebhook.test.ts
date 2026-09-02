import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SimulatedPixGateway } from "@/server/payments/simulatedPixGateway";

const PAYLOAD = {
  providerPaymentId: "SIM-12345678-4321",
  event: "payment.approved",
  amountCents: 19990,
  currency: "BRL",
  status: "PAID",
};

function headers(signature?: string): Record<string, string | undefined> {
  return signature === undefined ? {} : { "x-sim-signature": signature };
}

// Regression coverage for the webhook signature check.
//
// The vulnerability: verification used to be wrapped in `if (secret) { ... }`, so
// with PAYMENT_WEBHOOK_SECRET unset the check was skipped entirely on a PUBLIC
// endpoint whose events mark orders as PAID.
describe("Payment webhook signature verification", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.PAYMENT_WEBHOOK_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects every webhook in production when no secret is configured", async () => {
    const gateway = new SimulatedPixGateway({ name: "simulated", sandbox: false });
    await expect(gateway.parseWebhook(PAYLOAD, headers("anything"))).resolves.toBeNull();
    await expect(gateway.parseWebhook(PAYLOAD, headers())).resolves.toBeNull();
  });

  it("accepts a correctly signed webhook", async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = "s3cr3t-value-shared-with-the-provider";
    const gateway = new SimulatedPixGateway({ name: "simulated", sandbox: false });

    const event = await gateway.parseWebhook(
      PAYLOAD,
      headers("s3cr3t-value-shared-with-the-provider")
    );
    expect(event).not.toBeNull();
    expect(event?.providerPaymentId).toBe(PAYLOAD.providerPaymentId);
    expect(event?.amountCents).toBe(19990);
  });

  it("rejects a wrong signature", async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = "s3cr3t-value-shared-with-the-provider";
    const gateway = new SimulatedPixGateway({ name: "simulated", sandbox: false });
    await expect(gateway.parseWebhook(PAYLOAD, headers("wrong"))).resolves.toBeNull();
  });

  it("rejects a missing signature header", async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = "s3cr3t-value-shared-with-the-provider";
    const gateway = new SimulatedPixGateway({ name: "simulated", sandbox: false });
    await expect(gateway.parseWebhook(PAYLOAD, headers())).resolves.toBeNull();
  });

  it("rejects a signature of a different length without throwing", async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = "short";
    const gateway = new SimulatedPixGateway({ name: "simulated", sandbox: false });
    await expect(
      gateway.parseWebhook(PAYLOAD, headers("a-much-longer-signature-value"))
    ).resolves.toBeNull();
  });

  it("rejects a signed payload that is missing required fields", async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = "s3cr3t";
    const gateway = new SimulatedPixGateway({ name: "simulated", sandbox: false });
    await expect(
      gateway.parseWebhook({ event: "payment.approved" }, headers("s3cr3t"))
    ).resolves.toBeNull();
  });

  it("keeps the unsigned development path working outside production", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const gateway = new SimulatedPixGateway({ name: "simulated", sandbox: true });
    const event = await gateway.parseWebhook(PAYLOAD, headers());
    expect(event?.providerPaymentId).toBe(PAYLOAD.providerPaymentId);
  });
});
