import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/server/auth/guard";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  Package,
  History,
  Tag,
  ClipboardList
} from "lucide-react";

async function getAdminMetrics() {
  try {
    // 1. Fetch sales metrics from real orders in database
    const orders = await prisma.order.findMany({
      include: { customer: { include: { user: true } } },
    });

    const totalRevenue = orders
      .filter((o) => o.status === OrderStatus.PAID || o.status === OrderStatus.PROCESSING || o.status === OrderStatus.DELIVERED)
      .reduce((sum, o) => sum + Number(o.total), 0);

    const totalOrders = orders.length;
    const ticketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Fetch customers count
    const totalCustomers = await prisma.customer.count();

    // 3. Fetch low stock and out of stock metrics
    const inventory = await prisma.inventory.findMany({
      include: { variant: { include: { product: true } } },
    });

    const outOfStock = inventory.filter((i) => i.quantity === 0).length;
    const lowStock = inventory.filter((i) => i.quantity > 0 && i.quantity <= i.minStock).length;

    // 4. Fetch recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { include: { user: true } } },
    });

    // 5. Fetch recent audit logs
    const recentAudits = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    return {
      totalRevenue,
      totalOrders,
      ticketMedio,
      totalCustomers,
      outOfStock,
      lowStock,
      recentOrders,
      recentAudits,
    };
  } catch (error) {
    console.error("Error loading admin dashboard metrics:", error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      ticketMedio: 0,
      totalCustomers: 0,
      outOfStock: 0,
      lowStock: 0,
      recentOrders: [],
      recentAudits: [],
    };
  }
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const {
    totalRevenue,
    totalOrders,
    ticketMedio,
    totalCustomers,
    outOfStock,
    lowStock,
    recentOrders,
    recentAudits,
  } = await getAdminMetrics();

  const menuItems = [
    { name: "Painel Principal", href: "/admin", icon: TrendingUp, active: true },
    { name: "Produtos", href: "/admin/produtos", icon: Package, active: false },
    { name: "Controle de Estoque", href: "/admin/estoque", icon: AlertTriangle, active: false },
    { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag, active: false },
    { name: "Registro de Auditoria", href: "/admin/auditoria", icon: History, active: false },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Admin Navigation Sidebar */}
        <div className="md:w-64 space-y-2 bg-slate-50 p-6 rounded-xl border border-gray-100 h-fit">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider">Painel Administrativo</h3>
            <p className="text-[10px] text-amber-600 font-extrabold uppercase mt-1">Nível: Super Admin</p>
          </div>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                item.active
                  ? "bg-amber-600 text-white shadow shadow-amber-600/10"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Dashboard Workspace */}
        <div className="flex-1 space-y-8">
          
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dashboard Administrativo</h1>
            <p className="text-sm text-gray-500 mt-1">Estatísticas, vendas e monitoramento de estoque com dados reais.</p>
          </div>

          {/* Cards indicators grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Faturamento Total</span>
                <h3 className="text-xl font-black text-slate-950 font-mono mt-1">R$ {totalRevenue.toFixed(2)}</h3>
              </div>
              <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total de Pedidos</span>
                <h3 className="text-xl font-black text-slate-950 font-mono mt-1">{totalOrders} pedidos</h3>
              </div>
              <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Ticket Médio</span>
                <h3 className="text-xl font-black text-slate-950 font-mono mt-1 font-bold">R$ {ticketMedio.toFixed(2)}</h3>
              </div>
              <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Estoque Baixo/Zerado</span>
                <h3 className="text-xl font-black text-slate-950 font-mono mt-1 font-bold">
                  {lowStock} / <span className="text-red-600">{outOfStock}</span>
                </h3>
              </div>
              <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

          </div>

          {/* Detailed Lists (Recent orders and Audits) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recent orders */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider">Últimos Pedidos</h3>
                <Link href="/admin/pedidos" className="text-xs font-bold text-amber-600 hover:text-amber-500 uppercase flex items-center space-x-1">
                  <span>Ver Todos</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="py-3 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold font-mono text-slate-950 uppercase">{order.orderNumber}</span>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Cliente: {order.customer.user.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-slate-950">R$ {Number(order.total).toFixed(2)}</p>
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-8">Nenhum pedido registrado.</p>
              )}
            </div>

            {/* Recent audits */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider">Últimas Atividades (Auditoria)</h3>
                <Link href="/admin/auditoria" className="text-xs font-bold text-amber-600 hover:text-amber-500 uppercase flex items-center space-x-1">
                  <span>Ver Registros</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentAudits.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {recentAudits.map((audit) => (
                    <div key={audit.id} className="py-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-900 uppercase tracking-tight">{audit.action} - {audit.entity}</span>
                        <span className="text-gray-400 font-mono text-[10px]">{new Date(audit.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        Executado por: {audit.user?.name || "Sistema"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-8">Nenhum registro de auditoria.</p>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
