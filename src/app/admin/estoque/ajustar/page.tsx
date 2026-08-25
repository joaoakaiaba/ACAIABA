import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/config/prisma";
import { requireAdmin } from "@/server/auth/guard";
import StockAdjustForm from "@/components/admin/StockAdjustForm";
import { ArrowLeft, Package } from "lucide-react";

interface SearchParams {
  sku?: string;
}

export default async function StockAdjustPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();

  const sku = searchParams?.sku;

  if (!sku) {
    notFound();
  }

  const inventory = await prisma.inventory.findUnique({
    where: { variant: { sku } },
    include: { variant: { include: { product: { include: { brand: true } } } } },
  });

  if (!inventory) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center space-x-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <Link
          href="/admin/estoque"
          className="text-gray-400 hover:text-amber-600 transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Ajustar Estoque</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Corrija a quantidade disponível e o estoque mínimo da variante.</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
          <Package className="h-5 w-5 text-amber-600" />
          <span>Ajuste Manual de Estoque</span>
        </h3>

        <StockAdjustForm
          sku={inventory.variant.sku}
          productName={inventory.variant.product.name}
          brandName={inventory.variant.product.brand.name}
          size={inventory.variant.size}
          color={inventory.variant.color}
          quantity={inventory.quantity}
          reserved={inventory.reserved}
          minStock={inventory.minStock}
        />
      </div>
    </div>
  );
}
