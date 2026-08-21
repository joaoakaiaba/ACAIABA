"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Ticket } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, subtotal, discount, total, coupon, applyCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    if (!couponCode.trim()) return;

    const success = await applyCoupon(couponCode);
    if (success) {
      setCouponSuccess(`Cupom ${couponCode.toUpperCase()} aplicado com sucesso!`);
      setCouponCode("");
    } else {
      setCouponError("Cupom inválido ou valor mínimo não atendido.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-8">
        Seu Carrinho
      </h1>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const itemPrice = item.promotionalPrice ?? item.price;
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-xl border border-gray-100 bg-white shadow-sm gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm hover:text-amber-600">
                        <Link href={`/produto/${item.sku.toLowerCase().split("-")[0]}`}>{item.name}</Link>
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 font-mono uppercase">SKU: {item.sku}</p>
                      <p className="text-xs text-amber-600 font-semibold mt-1">
                        Tamanho: {item.size || "Único"} / Cor: {item.color || "Padrão"}
                      </p>
                    </div>
                  </div>

                  {/* Quantity and Price section */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:space-x-8">
                    {/* Quantity selectors */}
                    <div className="flex items-center border border-gray-200 rounded-lg h-9 bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 text-gray-500 hover:text-amber-600 font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold font-mono text-gray-800">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 text-gray-500 hover:text-amber-600 font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Price and Subtotal */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-sm font-extrabold text-slate-950">
                        R$ {(itemPrice * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        un: R$ {itemPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remover do carrinho"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Checkout & Order Summary Card */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-100 bg-slate-50 p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-200 pb-4 mb-4">
                Resumo do Pedido
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold font-mono">R$ {subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1">
                      <Ticket className="h-4 w-4" />
                      <span>Desconto ({coupon})</span>
                    </span>
                    <span className="font-bold font-mono">- R$ {discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span className="font-bold text-xs uppercase text-gray-400">Calcular no checkout</span>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between text-slate-950">
                  <span className="font-black uppercase text-base">Total</span>
                  <span className="text-lg font-black font-mono">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="mt-6 border-t border-gray-200 pt-6 space-y-2">
                <label className="text-xs font-black text-gray-900 uppercase tracking-wider block">Cupom de Desconto</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: ACAIABA10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-grow rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500 uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-gray-950 hover:bg-gray-900 text-white font-bold text-xs uppercase px-4 rounded-lg tracking-wider"
                  >
                    Aplicar
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-600 font-medium">{couponError}</p>}
                {couponSuccess && <p className="text-xs text-emerald-600 font-semibold">{couponSuccess}</p>}
              </form>

              {/* Secure Checkout CTA */}
              <div className="mt-8 space-y-4">
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center space-x-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 text-sm uppercase tracking-wider shadow shadow-amber-600/10"
                >
                  <span>Ir para o pagamento</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="flex justify-center items-center gap-1.5 text-xs text-gray-400 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Ambiente 100% Criptografado e Seguro</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-24 text-center px-4 max-w-2xl mx-auto">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800 uppercase tracking-tight">Seu carrinho está vazio</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
            Navegue pelos nossos segmentos de calçados, fitness e moda para encontrar as melhores ofertas.
          </p>
          <div className="mt-6">
            <Link
              href="/loja"
              className="inline-flex items-center rounded-lg bg-amber-600 px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow"
            >
              Ir para a Loja
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
