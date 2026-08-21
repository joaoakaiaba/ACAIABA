import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/config/prisma";
import ProductDetailView from "@/components/product/ProductDetailView";

async function getProductAndRelatedData(slug: string) {
  try {
    // 1. Fetch main product
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { order: "asc" } },
        variants: {
          include: { inventory: true },
        },
      },
    });

    if (!product || !product.isActive) {
      return null;
    }

    // 2. Fetch related products in same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      include: {
        brand: true,
        images: { orderBy: { order: "asc" }, take: 1 },
        variants: { include: { inventory: true } },
      },
    });

    // Format main product for detail view props
    const formattedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      detailedDescription: product.detailedDescription,
      price: Number(product.price),
      promotionalPrice: product.promotionalPrice ? Number(product.promotionalPrice) : null,
      brandName: product.brand.name,
      categoryName: product.category.name,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        price: v.price ? Number(v.price) : null,
        stock: v.inventory?.quantity ?? 0,
      })),
    };

    // Format related products for card display
    const formattedRelated = related.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brandName: p.brand.name,
        price: Number(p.price),
        promotionalPrice: p.promotionalPrice ? Number(p.promotionalPrice) : null,
        imageUrl: p.images[0]?.url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        stock: totalStock,
      };
    });

    return {
      product: formattedProduct,
      relatedProducts: formattedRelated,
    };
  } catch (error) {
    console.error("Error loading product detail page:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const data = await getProductAndRelatedData(params.slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="bg-white">
      <ProductDetailView product={data.product} relatedProducts={data.relatedProducts} />
    </div>
  );
}
