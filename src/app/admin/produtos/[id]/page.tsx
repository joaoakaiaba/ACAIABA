import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/config/prisma";
import { requireAdmin } from "@/server/auth/guard";
import ProductForm from "@/components/admin/ProductForm";
import { ArrowLeft } from "lucide-react";

export default async function AdminProductEditPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: { include: { inventory: true } } },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const formatted = {
    ...product,
    price: Number(product.price),
    promotionalPrice: product.promotionalPrice ? Number(product.promotionalPrice) : null,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center space-x-4 border-b border-gray-100 dark:border-slate-800 pb-5">
        <Link href="/admin/produtos" className="text-gray-400 hover:text-amber-600 transition-colors" title="Voltar">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Editar Produto</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.name}</p>
        </div>
      </div>
      <ProductForm product={formatted} brands={brands} categories={categories} />
    </div>
  );
}
