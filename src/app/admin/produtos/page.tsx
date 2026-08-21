import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import { Plus, Edit, Copy, Archive, CheckCircle, SlidersHorizontal, Package } from "lucide-react";

async function getAdminProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        brand: true,
        category: true,
        variants: {
          include: { inventory: true },
        },
      },
    });

    return products.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        baseSku: p.baseSku,
        brandName: p.brand.name,
        categoryName: p.category.name,
        price: Number(p.price),
        promotionalPrice: p.promotionalPrice ? Number(p.promotionalPrice) : null,
        stock: totalStock,
        status: p.status,
      };
    });
  } catch (error) {
    console.error("Error loading admin products:", error);
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Gerenciamento de Produtos</h1>
          <p className="text-sm text-gray-500 mt-1">Crie, edite, duplique ou altere o status de produtos do catálogo.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/produtos/novo"
            className="inline-flex items-center space-x-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-3 text-xs uppercase tracking-wider shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Produto / SKU</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Preço</th>
                  <th className="px-6 py-4 text-center">Estoque</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <span className="text-[10px] text-gray-400 font-semibold font-mono uppercase">SKU: {p.baseSku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">
                      {p.categoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-extrabold text-slate-950 font-mono">R$ {p.price.toFixed(2)}</p>
                        {p.promotionalPrice && (
                          <span className="text-[10px] text-emerald-600 font-bold font-mono">Promo: R$ {p.promotionalPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold font-mono text-slate-800">
                      {p.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border tracking-wider ${
                        p.status === "ACTIVE" 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                          : "bg-gray-100 border-gray-200 text-gray-500"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/produtos/editar/${p.slug}`}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-amber-600 shadow-sm transition-all"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-amber-600 shadow-sm transition-all"
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-amber-600 shadow-sm transition-all"
                          title="Arquivar"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-24 text-center px-4 max-w-2xl mx-auto">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800 uppercase tracking-tight">Sem produtos cadastrados</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
            Por favor, execute o script de seed ou adicione novos produtos utilizando o botão acima.
          </p>
        </div>
      )}

    </div>
  );
}
