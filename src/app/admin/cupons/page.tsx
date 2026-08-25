import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import { requireAdmin } from "@/server/auth/guard";
import CouponForm from "@/components/admin/CouponForm";
import CouponRowActions from "@/components/admin/CouponRowActions";
import { Tag, ArrowLeft, Plus } from "lucide-react";

async function getAdminCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });
  return coupons;
}

export default async function AdminCouponsPage() {
  await requireAdmin();
  const coupons = await getAdminCoupons();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center space-x-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <Link href="/admin" className="text-gray-400 hover:text-amber-600 transition-colors" title="Voltar">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Cupons de Desconto</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Crie, gerencie e acompanhe cupons com validação no servidor.</p>
        </div>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
          <Plus className="h-5 w-5 text-amber-600" />
          <span>Novo Cupom</span>
        </h3>
        <CouponForm />
      </div>

      {/* Coupons table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-right">Mínimo</th>
                <th className="px-6 py-4 text-right">Usos</th>
                <th className="px-6 py-4">Validade</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white uppercase">{c.code}</td>
                  <td className="px-6 py-4 uppercase text-xs font-bold text-gray-600 dark:text-gray-300">{c.type}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white">
                    {c.type === "PERCENTAGE" ? `${Number(c.value)}%` : `R$ ${Number(c.value).toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">R$ {Number(c.minSubtotal).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">
                    {c._count.usages}{c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(c.validFrom).toLocaleDateString()} → {new Date(c.validUntil).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border tracking-wider ${c.active ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <CouponRowActions couponId={c.id} active={c.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
