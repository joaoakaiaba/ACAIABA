"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, AlertTriangle } from "lucide-react";

export default function CouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          value: Number(value),
          validFrom,
          validUntil,
          minSubtotal: Number(minSubtotal),
          maxUses: maxUses === "" ? null : Number(maxUses),
          maxUsesPerUser: Number(maxUsesPerUser),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error?.message || data?.error || "Falha ao criar cupom." });
      } else {
        setMessage({ type: "success", text: "Cupom criado com sucesso." });
        setTimeout(() => router.refresh(), 700);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-amber-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Código</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="EX: BEMVINDO20" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className={inputCls}>
            <option value="PERCENTAGE">Percentual (%)</option>
            <option value="FIXED_AMOUNT">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Valor</label>
          <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Subtotal mínimo (R$)</label>
          <input type="number" min="0" step="0.01" value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Válido de</label>
          <input type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Válido até</label>
          <input type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Limite de usos (vazio = ilimitado)</label>
          <input type="number" min="0" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Usos por cliente</label>
          <input type="number" min="1" value={maxUsesPerUser} onChange={(e) => setMaxUsesPerUser(e.target.value)} className={inputCls} />
        </div>
      </div>

      {message && (
        <div className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-xs font-semibold ${message.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-700" : "bg-red-50 border border-red-100 text-red-700"}`}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center space-x-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 shadow transition-all disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        <span>{loading ? "Salvando..." : "Criar Cupom"}</span>
      </button>
    </form>
  );
}
