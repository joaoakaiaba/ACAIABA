import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import { AlertTriangle, TrendingUp, SlidersHorizontal, Edit2 } from "lucide-react";

async function getAdminStock() {
  try {
    const stockItems = await prisma.inventory.findMany({
      orderBy: { quantity: "asc" },
      include: {
        variant: {
          include: {
            product: { include: { brand: true } },
          },
        },
      },
    });

    return stockItems.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productName: item.variant.product.name,
      brandName: item.variant.product.brand.name,
      sku: item.variant.sku,
      size: item.variant.size,
      color: item.variant.color,
      quantity: item.quantity,
      reserved: item.reserved,
      minStock: item.minStock,
    }));
  } catch (error) {
    console.error("Error loading admin stock items:", error);
    return [];
  }
}

export default async function AdminStockPage() {
  const stock = await getAdminStock();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Controle de Estoque Transacional</h1>
          <p className="text-sm text-gray-500 mt-1">Monitore níveis de estoque, gerencie quantidades mínimas e execute movimentações.</p>
        </div>
      </div>

      {stock.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4">SKU / Atributos</th>
                  <th className="px-6 py-4 text-center">Quantidade</th>
                  <th className="px-6 py-4 text-center">Reservado</th>
                  <th className="px-6 py-4 text-center">Estoque Mínimo</th>
                  <th className="px-6 py-4">Status Alerta</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stock.map((item) => {
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity > 0 && item.quantity <= item.minStock;
                  
                  let badge = (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border tracking-wider bg-emerald-50 border-emerald-100 text-emerald-700">
                      Normal
                    </span>
                  );
                  if (isOutOfStock) {
                    badge = (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border tracking-wider bg-red-50 border-red-100 text-red-700">
                        Esgotado
                      </span>
                    );
                  } else if (isLowStock) {
                    badge = (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border tracking-wider bg-amber-50 border-amber-100 text-amber-700">
                        Baixo Estoque
                      </span>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                        <div>
                          <p>{item.productName}</p>
                          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">{item.brandName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        <div>
                          <p className="font-mono text-xs uppercase text-slate-900">SKU: {item.sku}</p>
                          <span className="text-[10px] text-gray-400 uppercase">Size: {item.size || "U"} / Color: {item.color || "P"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold font-mono text-slate-950">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold font-mono text-gray-400">
                        {item.reserved}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-bold font-mono text-gray-500">
                        {item.minStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {badge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/admin/estoque/ajustar?sku=${item.sku}`}
                          className="h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-amber-600 font-bold text-[10px] uppercase tracking-wider px-3 inline-flex items-center justify-center space-x-1.5 shadow-sm transition-all ml-auto"
                          title="Lançar ajuste"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Ajustar</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 py-24 text-center px-4 max-w-2xl mx-auto">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800 uppercase tracking-tight">Sem estoque registrado</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
            Não existem itens de inventário associados às variantes de produtos.
          </p>
        </div>
      )}

    </div>
  );
}
