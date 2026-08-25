import React from "react";
import { prisma } from "@/lib/config/prisma";
import { History, ShieldAlert, ArrowRight, User } from "lucide-react";
import { requireAdmin } from "@/server/auth/guard";

async function getAdminAudits() {
  try {
    const audits = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    return audits.map((a) => ({
      id: auditIdSafe(a),
      username: a.user?.name || "Sistema",
      email: a.user?.email || "system@acaiaba.com",
      action: a.action,
      entity: a.entity,
      details: a.details ? JSON.stringify(a.details) : "Sem detalhes",
      createdAt: a.createdAt,
    }));
  } catch (error) {
    console.error("Error loading admin audit logs:", error);
    return [];
  }
}

function auditIdSafe(a: any) {
  return a.id;
}

export default async function AdminAuditPage() {
  await requireAdmin();
  const audits = await getAdminAudits();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Registro de Auditoria Administrativa</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitore alterações de preços, movimentações de estoque, logins e ações administrativas.</p>
        </div>
      </div>

      {audits.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">Data / Hora</th>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Ação / Entidade</th>
                  <th className="px-6 py-4">Detalhes Tecnológicos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500 dark:text-gray-400">
                      {new Date(audit.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      <div>
                        <p>{audit.username}</p>
                        <span className="text-[10px] text-gray-400 font-semibold font-mono lowercase">{audit.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-tight">{audit.action}</span>
                        <p className="text-[10px] text-amber-600 font-extrabold uppercase mt-0.5">{audit.entity}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-300 max-w-md truncate">
                      {audit.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 py-24 text-center px-4 max-w-2xl mx-auto">
          <History className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">Sem atividades auditadas</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Não existem logs ou ações de auditoria registradas pelo sistema no momento.
          </p>
        </div>
      )}

    </div>
  );
}
