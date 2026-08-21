"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Eye } from "lucide-react";

export default function OrdersPage() {
  const orders = [
    {
      id: "PED-928374",
      date: "21/08/2026",
      total: 249.90,
      status: "Pago",
      statusColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
      itemsCount: 1,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Meus Pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">Acompanhe suas compras e histórico de transações.</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-xl border border-gray-100 bg-white shadow-sm gap-4"
            >
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-slate-950 font-mono text-sm uppercase">{order.id}</span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded border uppercase tracking-wider ${order.statusColor}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mt-2 font-semibold">
                  <span>Data: {order.date}</span>
                  <span>Quantidade: {order.itemsCount} {order.itemsCount === 1 ? "item" : "itens"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 sm:space-x-8">
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-950">
                    R$ {order.total.toFixed(2)}
                  </p>
                </div>

                <Link
                  href={`/pedidos/${order.id}`}
                  className="h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-amber-600 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span>Detalhes</span>
                </Link>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-24 text-center px-4 max-w-2xl mx-auto">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800 uppercase tracking-tight">Sem pedidos no momento</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
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
