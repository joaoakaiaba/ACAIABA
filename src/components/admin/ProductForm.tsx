"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, AlertTriangle, Plus, Trash2 } from "lucide-react";

interface VariantField {
  id?: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  stock: string;
  minStock: string;
}

interface ProductFormProps {
  product?: any;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-amber-500";

export default function ProductForm({ product, brands, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [baseSku, setBaseSku] = useState(product?.baseSku ?? "");
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [promotionalPrice, setPromotionalPrice] = useState(product?.promotionalPrice != null ? String(product.promotionalPrice) : "");
  const [variants, setVariants] = useState<VariantField[]>(
    product?.variants?.map((v: any) => ({
      id: v.id,
      size: v.size ?? "",
      color: v.color ?? "",
      sku: v.sku ?? "",
      price: v.price != null ? String(v.price) : "",
      stock: String(v.inventory?.quantity ?? 0),
      minStock: String(v.inventory?.minStock ?? 0),
    })) ?? [{ size: "", color: "", sku: "", price: "", stock: "0", minStock: "0" }]
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addVariant = () => setVariants([...variants, { size: "", color: "", sku: "", price: "", stock: "0", minStock: "0" }]);
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));

  const updateVariant = (idx: number, field: keyof VariantField, value: string) => {
    setVariants(variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const body = {
      product: {
        name,
        slug,
        description,
        baseSku,
        brandId,
        categoryId,
        price: Number(price),
        promotionalPrice: promotionalPrice === "" ? null : Number(promotionalPrice),
      },
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size || null,
        color: v.color || null,
        sku: v.sku,
        price: v.price === "" ? null : Number(v.price),
        stock: Number(v.stock),
        minStock: Number(v.minStock),
      })),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error?.message || data?.error || "Falha ao salvar produto." });
      } else {
        setMessage({ type: "success", text: isEdit ? "Produto atualizado." : "Produto criado." });
        setTimeout(() => router.push("/admin/produtos"), 700);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3">Informações Básicas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Slug *</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">SKU Base *</label>
            <input value={baseSku} onChange={(e) => setBaseSku(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Marca *</label>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} required className={inputCls}>
              <option value="">Selecione</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Categoria *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputCls}>
              <option value="">Selecione</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Preço (R$) *</label>
            <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Preço Promocional (R$)</label>
            <input type="number" min="0" step="0.01" value={promotionalPrice} onChange={(e) => setPromotionalPrice(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Descrição *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className={inputCls} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Variantes & Estoque</h3>
          <button type="button" onClick={addVariant} className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 hover:text-amber-500 uppercase tracking-wider">
            <Plus className="h-4 w-4" />
            <span>Adicionar</span>
          </button>
        </div>

        {variants.map((v, idx) => (
          <div key={idx} className="rounded-lg border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <input placeholder="Tam" value={v.size} onChange={(e) => updateVariant(idx, "size", e.target.value)} className={inputCls} />
              <input placeholder="Cor" value={v.color} onChange={(e) => updateVariant(idx, "color", e.target.value)} className={inputCls} />
              <input placeholder="SKU *" value={v.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} required className={inputCls} />
              <input placeholder="Preço" type="number" min="0" step="0.01" value={v.price} onChange={(e) => updateVariant(idx, "price", e.target.value)} className={inputCls} />
              <input placeholder="Estoque *" type="number" min="0" value={v.stock} onChange={(e) => updateVariant(idx, "stock", e.target.value)} required className={inputCls} />
              <input placeholder="Min" type="number" min="0" value={v.minStock} onChange={(e) => updateVariant(idx, "minStock", e.target.value)} className={inputCls} />
            </div>
            <button type="button" onClick={() => removeVariant(idx)} className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider inline-flex items-center space-x-1">
              <Trash2 className="h-3 w-3" />
              <span>Remover</span>
            </button>
          </div>
        ))}
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
        className="inline-flex items-center justify-center space-x-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 shadow transition-all disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        <span>{loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Produto"}</span>
      </button>
    </form>
  );
}
