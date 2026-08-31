"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface CustomerOrderActionsProps {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string | null;
  canPay: boolean;
  canCancel: boolean;
}

export default function CustomerOrderActions({
  orderNumber,
  orderStatus,
  paymentStatus,
  canPay,
  canCancel,
}: CustomerOrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"pay" | "cancel" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const run = async (action: "pay" | "cancel") => {
    setLoading(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderNumber}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error?.message || data?.error || "Falha na operação." });
      } else {
        setMessage({
          type: "success",
          text: action === "pay" ? "Pagamento confirmado com sucesso." : "Pedido cancelado. Estoque devolvido.",
        });
        setTimeout(() => router.refresh(), 700);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro de conexão." });
    } finally {
      setLoading(null);
    }
  };

  if (orderStatus === "CANCELLED" || orderStatus === "REFUNDED") {
    return (
      <div className="rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
        Este pedido está {orderStatus === "CANCELLED" ? "cancelado" : "reembolsado"}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {canPay && (
        <button
          onClick={() => run("pay")}
          disabled={loading !== null}
          className="w-full inline-flex items-center justify-center space-x-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 shadow transition-all disabled:opacity-50"
        >
          {loading === "pay" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{loading === "pay" ? "Confirmando..." : "Confirmar Pagamento (PIX)"}</span>
        </button>
      )}

      {canCancel && (
        <button
          onClick={() => run("cancel")}
          disabled={loading !== null}
          className="w-full inline-flex items-center justify-center space-x-2 rounded-lg border border-red-200 bg-white dark:bg-slate-900 hover:bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wider px-5 py-3 transition-all disabled:opacity-50"
        >
          {loading === "cancel" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          <span>{loading === "cancel" ? "Cancelando..." : "Cancelar Pedido"}</span>
        </button>
      )}

      {message && (
        <div
          className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-xs font-semibold ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
              : "bg-red-50 border border-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <p className="text-[10px] text-gray-400">
        Pagamento atual: <span className="font-bold uppercase">{paymentStatus || "N/A"}</span>
      </p>
    </div>
  );
}
