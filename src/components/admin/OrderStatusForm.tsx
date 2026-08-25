"use client";

import React, { useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";

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

interface OrderStatusFormProps {
  orderNumber: string;
  currentStatus: string;
  statuses: readonly string[];
}

export default function OrderStatusForm({ orderNumber, currentStatus, statuses }: OrderStatusFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data?.error?.message || data?.error || "Falha ao atualizar o status.",
        });
      } else {
        setStatus(data?.order?.status ?? status);
        setMessage({ type: "success", text: "Status atualizado com sucesso." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro de conexão ao atualizar o status." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-amber-500"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] || s}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading || status === currentStatus}
          className="inline-flex items-center justify-center space-x-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 shadow transition-all disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{loading ? "Salvando..." : "Atualizar Status"}</span>
        </button>
      </div>

      {message && (
        <div
          className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
              : "bg-red-50 border border-red-100 text-red-700"
          }`}
        >
          {message.type === "success" && <CheckCircle2 className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}
    </form>
  );
}
