import React from "react";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/guard";
import { getDashboardData, type DashboardData } from "@/server/admin/dashboardService";
import PeriodSelector from "@/components/admin/PeriodSelector";
import {
  TrendingUp,
  ShoppingBag,
  Wallet,
  Users,
  AlertTriangle,
  ArrowRight,
  Package,
  History,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";

const PERIODS = ["today", "7d", "30d"] as const;

function isValidPeriod(v: string | undefined): v is "today" | "7d" | "30d" {
  return PERIODS.includes(v as any);
}

function statusBadge(status: string) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border tracking-wider";
  if (status === "PAID" || status === "DELIVERED") return `${base} bg-emerald-50 border-emerald-100 text-emerald-700`;
  if (status === "PENDING" || status === "AWAITING_PAYMENT") return `${base} bg-amber-50 border-amber-100 text-amber-700`;
  if (status === "CANCELLED" || status === "REFUNDED") return `${base} bg-red-50 border-red-100 text-red-700`;
  return `${base} bg-gray-100 border-gray-200 text-gray-500`;
}

function MetricCard({ label, value, icon: Icon, accent = "bg-amber-50 text-amber-600" }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
        <h3 className="text-xl font-black text-slate-950 dark:text-white font-mono mt-1">{value}</h3>
      </div>
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  await requireAdmin();
  const period = isValidPeriod(searchParams?.period) ? searchParams.period : "30d";
  const d: DashboardData = await getDashboardData(period);

  const menuItems = [
    { name: "Painel Principal", href: "/admin", icon: TrendingUp, active: true },
    { name: "Produtos", href: "/admin/produtos", icon: Package, active: false },
    { name: "Controle de Estoque", href: "/admin/estoque", icon: AlertTriangle, active: false },
    { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag, active: false },
    { name: "Cupons", href: "/admin/cupons", icon: Tag, active: false },
    { name: "Registro de Auditoria", href: "/admin/auditoria", icon: History, active: false },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-64 space-y-2 bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 h-fit">
          <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white uppercase text-xs tracking-wider">Painel Administrativo</h3>
            <p className="text-[10px] text-amber-600 font-extrabold uppercase mt-1">Nível: Super Admin</p>
          </div>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                item.active ? "bg-amber-600 text-white shadow shadow-amber-600/10" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        {/* Workspace */}
        <div className="flex-1 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-slate-800 pb-5 gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Dashboard Administrativo</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Métricas reais calculadas no servidor a partir do PostgreSQL.</p>
            </div>
            <PeriodSelector current={period} />
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="Faturamento Total" value={`R$ ${d.totalRevenue.toFixed(2)}`} icon={Wallet} />
            <MetricCard label={`Faturamento (${period})`} value={`R$ ${d.periodRevenue.toFixed(2)}`} icon={TrendingUp} />
            <MetricCard label="Total de Pedidos" value={`${d.totalOrders}`} icon={ShoppingBag} />
            <MetricCard label="Ticket Médio" value={`R$ ${d.averageTicket.toFixed(2)}`} icon={Users} />
            <MetricCard label="Pedidos Pagos" value={`${d.paidOrders}`} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
            <MetricCard label="Pedidos Pendentes" value={`${d.pendingOrders}`} icon={Clock} accent="bg-amber-50 text-amber-600" />
            <MetricCard label="Cancelados" value={`${d.cancelledOrders}`} icon={XCircle} accent="bg-red-50 text-red-600" />
            <MetricCard label="Reembolsados" value={`${d.refundedOrders}`} icon={RotateCcw} accent="bg-blue-50 text-blue-600" />
            <MetricCard label="Produtos Ativos" value={`${d.activeProducts}`} icon={Package} />
            <MetricCard label="Estoque Baixo" value={`${d.lowStockProducts}`} icon={AlertTriangle} accent="bg-amber-50 text-amber-600" />
            <MetricCard label="Esgotados" value={`${d.outOfStockProducts}`} icon={AlertTriangle} accent="bg-red-50 text-red-600" />
            <MetricCard label="Cupons Utilizados" value={`${d.couponsUsed}`} icon={Tag} />
          </div>

          {/* Sales by day */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white uppercase text-xs tracking-wider">Vendas por dia</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-center">Pedidos</th>
                    <th className="px-4 py-3 text-right">Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {d.salesByDay.map((day) => (
                    <tr key={day.date}>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-900 dark:text-white">{day.date}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-gray-800 dark:text-gray-100">{day.orders}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-900 dark:text-white">R$ {day.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent orders + low stock */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white uppercase text-xs tracking-wider">Últimos Pedidos</h3>
                <Link href="/admin/pedidos" className="text-xs font-bold text-amber-600 hover:text-amber-500 uppercase flex items-center space-x-1">
                  <span>Ver Todos</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {d.recentOrders.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {d.recentOrders.map((order) => (
                    <Link key={order.id} href={`/admin/pedidos/${order.orderNumber}`} className="py-3 flex justify-between items-center hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60 rounded">
                      <div>
                        <span className="text-xs font-bold font-mono text-slate-950 dark:text-white uppercase">{order.orderNumber}</span>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Cliente: {order.customerName}</p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase mt-0.5">Pag.: {order.paymentMethod || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-slate-950 dark:text-white">R$ {order.total.toFixed(2)}</p>
                        <span className={statusBadge(order.status)}>{order.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">Nenhum pedido registrado.</p>
              )}
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white uppercase text-xs tracking-wider">Produtos com Estoque Baixo</h3>
                <Link href="/admin/estoque" className="text-xs font-bold text-amber-600 hover:text-amber-500 uppercase flex items-center space-x-1">
                  <span>Ver Estoque</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {d.lowStock.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {d.lowStock.map((item, idx) => (
                    <div key={idx} className="py-3">
                      <div className="flex justify-between">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.productName}</p>
                        <span className={`text-[10px] font-bold font-mono ${item.available <= 0 ? "text-red-600" : "text-amber-600"}`}>
                          {item.available} disp.
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono uppercase mt-0.5">
                        {item.sku} · {item.variantLabel} · {item.total} total / {item.reserved} reserv.
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">Nenhum produto com estoque baixo.</p>
              )}
            </div>
          </div>

          {/* Recent audits */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white uppercase text-xs tracking-wider">Atividade Administrativa Recente</h3>
              <Link href="/admin/auditoria" className="text-xs font-bold text-amber-600 hover:text-amber-500 uppercase flex items-center space-x-1">
                <span>Ver Auditoria</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {d.recentAudits.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {d.recentAudits.map((audit) => (
                  <div key={audit.id} className="py-3">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-900 dark:text-white uppercase tracking-tight">{audit.action} - {audit.entity}</span>
                      <span className="text-gray-400 font-mono text-[10px]">{new Date(audit.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Por: {audit.userName}</p>
                    {audit.details && (
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{audit.details}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">Nenhum registro de auditoria.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
