"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, AlertTriangle } from "lucide-react";

interface StockAdjustFormProps {
  sku: string;
  productName: string;
  brandName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  reserved: number;
  minStock: number;
}

export default function StockAdjustForm({
  sku,
  productName,
  brandName,
  size,
  color,
  quantity,
  reserved,
  minStock,
}: StockAdjustFormProps) {
  const router = useRouter();
  const [newQuantity, setNewQuantity] = useState(String(quantity));
  const [newMinStock, setNewMinStock] = useState(String(minStock));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const qty = Number(newQuantity);
    const min = Number(newMinStock);

    if (!Number.isInteger(qty) || qty < 0) {
      setMessage({ type: "error", text: "Quantidade deve ser um inteiro maior ou igual a zero." });
      setLoading(false);
      return;
    }
    if (!Number.isInteger(min) || min < 0) {
      setMessage({ type: "error", text: "Estoque mínimo deve ser um inteiro maior ou igual a zero." });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/inventory/${encodeURIComponent(sku)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty, minStock: min }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data?.error?.message || data?.error || "Falha ao ajustar o estoque.",
        });
      } else {
        setMessage({ type: "success", text: "Estoque atualizado com sucesso." });
        setTimeout(() => router.push("/admin/estoque"), 800);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro de conexão ao ajustar o estoque." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 text-sm space-y-1">
        <p className="font-bold text-slate-900 dark:text-white">{productName}</p>
        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">{brandName}</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono uppercase">
          SKU: {sku} / {[size, color].filter(Boolean).join(" / ") || "Padrão"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Quantidade</label>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 outline-none focus:border-amber-500"
          />
          <p className="text-[10px] text-gray-400 mt-1">Atual: {quantity} · Reservado: {reserved}</p>
        </div>

        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Estoque Mínimo</label>
          <input
            type="number"
            min={0}
            step={1}
            required
            value={newMinStock}
            onChange={(e) => setNewMinStock(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 outline-none focus:border-amber-500"
          />
          <p className="text-[10px] text-gray-400 mt-1">Atual: {minStock}</p>
        </div>
      </div>

      {Number(newQuantity) < reserved && (
        <div className="flex items-center space-x-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 px-4 py-2.5 text-xs font-semibold">
          <AlertTriangle className="h-4 w-4" />
          <span>A quantidade não pode ser menor que o estoque reservado ({reserved}).</span>
        </div>
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center space-x-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 shadow transition-all disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? "Salvando..." : "Salvar Ajuste"}</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/estoque")}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-wider px-6 py-2.5 transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
