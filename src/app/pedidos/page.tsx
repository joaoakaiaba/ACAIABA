"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
  itemsCount: number;
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

function statusStyle(status: string): string {
  if (status === "PAID" || status === "DELIVERED" || status === "PROCESSING") {
    return "text-emerald-700 bg-emerald-50 border-emerald-100";
  }
  if (status === "CANCELLED" || status === "REFUNDED") {
    return "text-red-700 bg-red-50 border-red-100";
  }
  return "text-amber-700 bg-amber-50 border-amber-100";
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { loading } = useRequireAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !user) return;

    const loadOrders = async () => {
      try {
        const res = await fetch("/api/orders", { method: "GET" });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Falha ao carregar pedidos.");
        } else {
          setOrders(data.orders ?? []);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError("Erro de conexão ao carregar seus pedidos.");
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-gray-500 dark:text-gray-400">
        Carregando seus pedidos...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">

      <div className="border-b border-gray-100 dark:border-slate-800 pb-5">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Meus Pedidos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Acompanhe suas compras e histórico de transações.</p>
      </div>

      {ordersLoading ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">Carregando...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 py-16 text-center px-4 max-w-2xl mx-auto text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm gap-4"
            >
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-slate-950 dark:text-white font-mono text-sm uppercase">{order.orderNumber}</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded border uppercase tracking-wider ${statusStyle(order.status)}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2 font-semibold">
                  <span>Data: {new Date(order.date).toLocaleDateString("pt-BR")}</span>
                  <span>Quantidade: {order.itemsCount} {order.itemsCount === 1 ? "item" : "itens"}</span>
                </div>
              </div>

              <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-2">
                <p className="text-sm font-extrabold text-slate-950 dark:text-white">
                  R$ {order.total.toFixed(2)}
                </p>
                <Link
                  href={`/pedidos/${order.orderNumber}`}
                  className="inline-flex items-center space-x-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 hover:text-amber-600 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 shadow-sm transition-all"
                >
                  <span>Detalhes</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 py-24 text-center px-4 max-w-2xl mx-auto">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">Sem pedidos no momento</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Você ainda não realizou compras em nossa plataforma. Explore os segmentos para marcar presença!
          </p>
          <div className="mt-6">
            <Link
              href="/loja"
              className="inline-flex items-center rounded-lg bg-amber-600 px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow"
            >
              Começar a comprar
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
