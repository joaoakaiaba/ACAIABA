"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ShoppingBag, Truck, MapPin, Receipt, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import CustomerOrderActions from "@/components/orders/CustomerOrderActions";

interface OrderDetail {
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  currency: string;
  notes: string | null;
  payment: { method: string; status: string; amount: number } | null;
  coupon: { code: string; type: string } | null;
  address: {
    cep: string | null;
    state: string | null;
    city: string | null;
    neighborhood: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    shippingMethod: string | null;
  };
  items: {
    productName: string;
    sku: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  AWAITING_PAYMENT: "Aguardando Pagamento",
  PAID: "Pago",
  PROCESSING: "Em Processamento",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  AUTHORIZED: "Autorizado",
  PAID: "Pago",
  DECLINED: "Recusado",
  REFUNDED: "Reembolsado",
  CANCELED: "Cancelado",
};

export default function CustomerOrderDetailPage() {
  const { user } = useAuth();
  const { loading } = useRequireAuth();
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params?.orderNumber ?? "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !user || !orderNumber) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`, { method: "GET" });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error?.message || data?.error || "Não foi possível carregar o pedido.");
        } else {
          setOrder(data.order);
        }
      } catch (err) {
        setError("Erro de conexão ao carregar o pedido.");
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [loading, user, orderNumber]);

  if (loading || !user || pageLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-500 dark:text-gray-400">Carregando pedido...</div>;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-4">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{error || "Pedido não encontrado."}</p>
        <Link
          href="/pedidos"
          className="inline-flex items-center rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5"
        >
          Voltar aos meus pedidos
        </Link>
      </div>
    );
  }

  const canPay = (order.payment?.status === "PENDING" || order.payment?.status === "AUTHORIZED") &&
    (order.status === "PENDING" || order.status === "AWAITING_PAYMENT");
  const canCancel = order.status === "PENDING" || order.status === "AWAITING_PAYMENT" || order.status === "PAID" || order.status === "PROCESSING";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-slate-800 pb-5 gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/pedidos" className="text-gray-400 hover:text-amber-600 transition-colors" title="Voltar">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Acompanhar Pedido</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono uppercase">
              {order.orderNumber} · {new Date(order.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase border tracking-wider bg-amber-50 border-amber-100 text-amber-700">
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-amber-600" />
              <span>Itens do Pedido</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Variante</th>
                    <th className="px-4 py-3 text-center">Qtd</th>
                    <th className="px-4 py-3 text-right">Preço Unit.</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {order.items.map((item, idx) => (
                    <tr key={`${item.sku}-${idx}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{item.productName}</p>
                        <span className="text-[10px] text-gray-400 font-mono uppercase">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {[item.size, item.color].filter(Boolean).join(" / ") || "Padrão"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-800 dark:text-gray-100">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">R$ {item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">R$ {item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-xs space-y-2 text-sm border-t border-gray-100 dark:border-slate-800 pt-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">R$ {order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Desconto{order.coupon ? ` (${order.coupon.code})` : ""}</span>
                    <span className="font-mono font-bold">- R$ {order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Frete</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">R$ {order.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-950 dark:text-white border-t border-gray-100 dark:border-slate-800 pt-3">
                  <span className="font-black uppercase text-sm">Total</span>
                  <span className="font-mono font-black text-base">R$ {order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Moeda</span>
                  <span className="font-bold">{order.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span>Endereço de Entrega</span>
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p className="font-semibold">
                {[order.address.street, order.address.number].filter(Boolean).join(", ")}
                {order.address.complement ? ` - ${order.address.complement}` : ""}
              </p>
              <p>
                {[order.address.neighborhood, order.address.city].filter(Boolean).join(" - ")}
                {order.address.state ? ` - ${order.address.state}` : ""}
              </p>
              {order.address.cep && <p className="font-mono text-xs text-gray-500 dark:text-gray-400">CEP: {order.address.cep}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-amber-600" />
              <span>Pagamento</span>
            </h3>
            <div className="text-sm space-y-2">
              {order.payment ? (
                <>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Método</span>
                    <span className="font-bold uppercase">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Status</span>
                    <span className="font-bold uppercase">{PAYMENT_LABELS[order.payment.status] || order.payment.status}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Valor</span>
                    <span className="font-mono font-bold">R$ {order.payment.amount.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 italic">Sem pagamento registrado.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Truck className="h-5 w-5 text-amber-600" />
              <span>Ações</span>
            </h3>
            <CustomerOrderActions
              orderNumber={order.orderNumber}
              orderStatus={order.status}
              paymentStatus={order.payment?.status ?? null}
              canPay={canPay}
              canCancel={canCancel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
