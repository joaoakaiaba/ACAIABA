"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, CreditCard, Ticket, ArrowLeft, Send, PhoneCall } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { processCheckout } from "@/server/commerce/checkout";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotal, discount, total, coupon, applyCoupon, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();

  // Step state: 1 = Address & Delivery, 2 = Payment, 3 = Completed
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [completedOrder, setCompletedOrder] = useState<{ orderNumber: string; total: number; whatsappText: string } | null>(null);

  // Address form fields
  const [cep, setCep] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");

  // Shipping selection
  const [shippingMethod, setShippingMethod] = useState("SEDEX");
  const [shippingCost, setShippingCost] = useState(15.0);

  // Payment selection
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");

  // Require authentication to proceed with checkout.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/checkout");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (cartItems.length === 0 && step !== 3) {
      router.push("/carrinho");
    }
  }, [cartItems, step, router]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep || !state || !city || !neighborhood || !street || !number) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios do endereço.");
      return;
    }
    setErrorMessage("");
    setStep(2);
  };

  const handleCheckoutComplete = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          variantId: item.id,
          quantity: item.quantity,
        })),
        address: {
          cep,
          state,
          city,
          neighborhood,
          street,
          number,
          complement,
        },
        couponCode: coupon || undefined,
        paymentMethod: paymentMethod === "PIX" ? ("PIX" as const) : ("CREDIT_CARD" as const),
        shippingCost,
      };

      // Creates the real order in the database (authenticated customer, stock, coupon, audit).
      const result = await processCheckout(orderData as any);

      setCompletedOrder(result);
      clearCart();
      setStep(3);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "Falha ao processar pedido. Por favor, revise seus dados.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-gray-500">
        Verificando sua sessão...
      </div>
    );
  }

  if (step === 3 && completedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center space-y-8">
        <div className="rounded-full bg-emerald-50 h-16 w-16 flex items-center justify-center mx-auto text-emerald-600">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Pedido Recebido com Sucesso!</h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Obrigado por comprar na ACAIABA! Seu pedido foi registrado sob o número <span className="font-mono font-black text-slate-950">{completedOrder.orderNumber}</span>.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 p-6 bg-slate-50 text-left max-w-md mx-auto space-y-4">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-400">Resumo da Confirmação</h4>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-600">Número do Pedido:</span>
            <span className="font-bold text-slate-900 font-mono">{completedOrder.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-600">Total Pago:</span>
            <span className="font-bold text-slate-900 font-mono">R$ {completedOrder.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-gray-600">Método de Envio:</span>
            <span className="font-bold text-slate-900 uppercase">{shippingMethod}</span>
          </div>
        </div>

        {/* WhatsApp completion and CTA actions */}
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <a
            href={completedOrder.whatsappText.startsWith("http") ? completedOrder.whatsappText : `https://wa.me/5511999999999?text=${completedOrder.whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-sm uppercase tracking-wider shadow"
          >
            <PhoneCall className="h-5 w-5" />
            <span>Finalizar pelo WhatsApp</span>
          </a>
          <Link
            href="/loja"
            className="w-full h-11 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all"
          >
            Voltar para a Loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      
      <div className="flex items-center space-x-4 border-b border-gray-100 pb-5">
        <button
          onClick={() => (step === 2 ? setStep(1) : router.push("/carrinho"))}
          className="text-gray-400 hover:text-amber-600 transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Checkout Seguro</h1>
          <p className="text-xs text-gray-500 mt-1">Sua compra é criptografada e segura de ponta a ponta.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div className="rounded-xl border border-gray-100 p-6 space-y-4 bg-white shadow-sm">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-100 pb-3 flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-amber-600" />
                  <span>Endereço de Entrega</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-900 uppercase tracking-wider block mb-2">CEP *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 01310-100"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-900 uppercase tracking-wider block mb-2">Estado *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: SP"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-black text-gray-900 uppercase tracking-wider block mb-2">Rua / Logradouro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Av. Paulista"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-900 uppercase tracking-wider block mb-2">Número *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 1000"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-900 uppercase tracking-wider block mb-2">Complemento</label>
                    <input
                      type="text"
                      placeholder="Ex: Apto 42"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-900 uppercase tracking-wider block mb-2">Bairro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Bela Vista"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-900 uppercase tracking-wider block mb-2">Cidade *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Abstraction */}
              <div className="rounded-xl border border-gray-100 p-6 space-y-4 bg-white shadow-sm">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-100 pb-3">Método de Envio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    onClick={() => { setShippingMethod("SEDEX"); setShippingCost(15.0); }}
                    className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      shippingMethod === "SEDEX" ? "border-amber-500 bg-amber-50/20" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900 uppercase">Correios SEDEX</span>
                    <span className="text-sm font-bold text-slate-950 font-mono mt-2">R$ 15,00</span>
                    <span className="text-[10px] text-gray-400 mt-1">Entrega em até 3 dias úteis</span>
                  </label>

                  <label
                    onClick={() => { setShippingMethod("PAC"); setShippingCost(8.0); }}
                    className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      shippingMethod === "PAC" ? "border-amber-500 bg-amber-50/20" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900 uppercase">Correios PAC</span>
                    <span className="text-sm font-bold text-slate-950 font-mono mt-2">R$ 8,00</span>
                    <span className="text-[10px] text-gray-400 mt-1">Entrega em até 8 dias úteis</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow transition-all"
              >
                Prosseguir para Pagamento
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Payment Abstraction */}
              <div className="rounded-xl border border-gray-100 p-6 space-y-4 bg-white shadow-sm">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-100 pb-3 flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  <span>Opções de Pagamento</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    onClick={() => setPaymentMethod("PIX")}
                    className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      paymentMethod === "PIX" ? "border-amber-500 bg-amber-50/20" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900 uppercase">Pagar via PIX</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded uppercase mt-2 w-fit">
                      Aprovação imediata
                    </span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod("CREDIT_CARD")}
                    className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      paymentMethod === "CREDIT_CARD" ? "border-amber-500 bg-amber-50/20" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xs font-extrabold text-slate-900 uppercase">Cartão de Crédito</span>
                    <span className="text-[10px] text-gray-500 font-semibold mt-2">
                      Aceitamos Visa, Mastercard, Elo
                    </span>
                  </label>
                </div>

                {paymentMethod === "CREDIT_CARD" && (
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    <p className="text-xs text-gray-400 italic font-semibold">
                      * O checkout seguro se conecta ao gateway em ambiente sandbox de simulação comercial. Nenhuma cobrança real será realizada.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 h-12 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCheckoutComplete}
                  disabled={loading}
                  className="flex-grow h-12 flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow transition-all disabled:opacity-50"
                >
                  {loading ? "Finalizando..." : "Finalizar Pedido"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-slate-50 p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-200 pb-4 mb-4">
              Itens do Pedido
            </h3>

            {/* Cart products summary list */}
            <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-gray-400 mt-0.5 font-semibold">
                      Qtd: {item.quantity} / Tam: {item.size || "U"}
                    </p>
                  </div>
                  <span className="font-bold text-slate-950 font-mono">
                    R$ {((item.promotionalPrice ?? item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-xs border-t border-gray-200 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold font-mono">R$ {subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1 font-semibold">
                    <Ticket className="h-4 w-4" />
                    <span>Desconto ({coupon})</span>
                  </span>
                  <span className="font-bold font-mono">- R$ {discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Frete ({shippingMethod})</span>
                <span className="font-bold font-mono">R$ {shippingCost.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-between text-slate-950">
                <span className="font-black uppercase text-sm">Total Geral</span>
                <span className="text-base font-black font-mono">R$ {(subtotal - discount + shippingCost).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Criptografia SSL de 256 bits</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
