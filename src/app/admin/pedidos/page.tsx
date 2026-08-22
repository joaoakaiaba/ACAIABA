import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import { ShoppingBag, Eye, Calendar, User, Search, RefreshCw } from "lucide-react";
import { requireAdmin } from "@/server/auth/guard";

async function getAdminOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { user: true } },
        payment: true,
      },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.user.name,
      customerEmail: o.customer.user.email,
      total: Number(o.total),
      status: o.status,
      paymentMethod: o.payment?.method || "N/A",
      createdAt: o.createdAt,
    }));
  } catch (error) {
    console.error("Error loading admin orders:", error);
    return [];
  }
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const orders = await getAdminOrders();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gerenciamento de Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">Monitore pedidos, atualize status e acompanhe históricos de pagamentos.</p>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Número / Data</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Pagamento</th>
                  <th className="px-6 py-4 text-center">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-mono font-bold text-slate-950 uppercase">{order.orderNumber}</p>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                      <div>
                        <p className="font-bold">{order.customerName}</p>
                        <span className="text-[10px] text-gray-400 lowercase">{order.customerEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-600 uppercase text-xs tracking-wider">
                      {order.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold font-mono text-slate-950">
                      R$ {order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border tracking-wider ${
                        order.status === "PAID" || order.status === "DELIVERED"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : order.status === "PENDING"
                          ? "bg-amber-50 border-amber-100 text-amber-700"
                          : "bg-gray-100 border-gray-200 text-gray-500"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/admin/pedidos/${order.orderNumber}`}
                        className="h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-amber-600 font-bold text-[10px] uppercase tracking-wider px-3 inline-flex items-center justify-center space-x-1.5 shadow-sm transition-all ml-auto"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver Detalhes</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-24 text-center px-4 max-w-2xl mx-auto">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800 uppercase tracking-tight">Sem pedidos registrados</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
            Não existem compras ou transações comerciais registradas por clientes no momento.
          </p>
        </div>
      )}

    </div>
  );
}
