import { describe, it, expect, vi, beforeEach } from "vitest";

// processCheckout is a Server Action, so an authenticated client can call it with
// arbitrary arguments. These tests cover the validation of the caller-supplied
// financial inputs (shippingCost and quantity), which is what stops a negative
// shippingCost or a negative quantity from producing a zero/negative order total.
//
// Session and Prisma are mocked: the validation under test runs before any database
// access, so the transaction must never be reached. `vi.hoisted` is used because
// Vitest hoists `vi.mock` above the imports, and the factory needs the spy.
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getActiveSession: vi.fn(),
}));

vi.mock("@/server/auth/session", () => ({
  getActiveSession: mocks.getActiveSession,
}));

vi.mock("@/lib/config/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { processCheckout } from "@/server/commerce/checkout";

const VALID_ADDRESS = {
  cep: "01310-100",
  state: "SP",
  city: "São Paulo",
  neighborhood: "Bela Vista",
  street: "Av. Paulista",
  number: "1000",
};

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    items: [{ variantId: "variant-1", quantity: 2 }],
    address: VALID_ADDRESS,
    paymentMethod: "PIX" as const,
    shippingCost: 15,
    idempotencyKey: "test-checkout-key-0001",
    ...overrides,
  };
}

describe("processCheckout — validação dos valores financeiros vindos do cliente", () => {
  beforeEach(() => {
    mocks.transaction.mockReset();
    mocks.getActiveSession.mockReset();
    mocks.getActiveSession.mockResolvedValue({
      userId: "user-1",
      name: "Cliente Teste",
      email: "cliente@teste.com",
      role: "CUSTOMER",
      status: "ACTIVE",
    });
  });

  it("rejeita shippingCost negativo (vetor de pedido a R$ 0)", async () => {
    await expect(processCheckout(baseInput({ shippingCost: -10000 }) as never)).rejects.toThrow(
      /frete inválido/i
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejeita shippingCost NaN ou não numérico", async () => {
    await expect(
      processCheckout(baseInput({ shippingCost: Number.NaN }) as never)
    ).rejects.toThrow(/frete inválido/i);
    await expect(
      processCheckout(baseInput({ shippingCost: "15" }) as never)
    ).rejects.toThrow(/frete inválido/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("aceita shippingCost zero (frete grátis legítimo)", async () => {
    // Zero must pass the guard. It fails later only because Prisma is mocked.
    mocks.transaction.mockRejectedValueOnce(new Error("db indisponível no teste"));
    await expect(processCheckout(baseInput({ shippingCost: 0 }) as never)).rejects.toThrow(
      /db indisponível no teste/
    );
    expect(mocks.transaction).toHaveBeenCalled();
  });

  it("rejeita quantidade negativa (vetor de subtotal negativo)", async () => {
    await expect(
      processCheckout(
        baseInput({ items: [{ variantId: "variant-1", quantity: -5 }] }) as never
      )
    ).rejects.toThrow(/quantidade de item inválida/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejeita quantidade zero, fracionária ou absurda", async () => {
    for (const quantity of [0, 1.5, 1000]) {
      await expect(
        processCheckout(baseInput({ items: [{ variantId: "variant-1", quantity }] }) as never)
      ).rejects.toThrow(/quantidade de item inválida/i);
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejeita item sem variantId", async () => {
    await expect(
      processCheckout(baseInput({ items: [{ variantId: "", quantity: 1 }] }) as never)
    ).rejects.toThrow(/item de carrinho inválido/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("mantém a exigência de chave de idempotência válida", async () => {
    await expect(
      processCheckout(baseInput({ idempotencyKey: "curta" }) as never)
    ).rejects.toThrow(/idempotência/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("continua exigindo sessão autenticada antes de qualquer validação financeira", async () => {
    mocks.getActiveSession.mockResolvedValueOnce(null);
    await expect(processCheckout(baseInput() as never)).rejects.toThrow(/autenticado/i);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
