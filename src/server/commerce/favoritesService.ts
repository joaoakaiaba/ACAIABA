"use server";

import { prisma } from "@/lib/config/prisma";
import { getActiveSession } from "@/server/auth/session";
import { AppError } from "@/lib/config/errors";

export interface FavoriteProductView {
  productId: string;
  name: string;
  slug: string;
  brandName: string;
  price: number;
  promotionalPrice: number | null;
  imageUrl: string | null;
  stock: number;
}

// Lists the authenticated customer's favorite products (real, from PostgreSQL).
export async function getFavorites(): Promise<FavoriteProductView[]> {
  const session = await getActiveSession();
  if (!session) throw new AppError("AUTHENTICATION", "Não autenticado.", 401);

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return [];

  const favorites = await prisma.favorite.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          brand: true,
          images: { orderBy: { order: "asc" }, take: 1 },
          variants: { include: { inventory: true } },
        },
      },
    },
  });

  return favorites.map((f) => {
    const totalStock = f.product.variants.reduce(
      (sum, v) => sum + (v.inventory?.quantity ?? 0),
      0
    );
    return {
      productId: f.productId,
      name: f.product.name,
      slug: f.product.slug,
      brandName: f.product.brand.name,
      price: Number(f.product.price),
      promotionalPrice: f.product.promotionalPrice ? Number(f.product.promotionalPrice) : null,
      imageUrl: f.product.images[0]?.url ?? null,
      stock: totalStock,
    };
  });
}

// Returns whether a product is favorited by the authenticated customer.
export async function isProductFavorite(productId: string): Promise<boolean> {
  const session = await getActiveSession();
  if (!session) return false;

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return false;

  const favorite = await prisma.favorite.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
  });
  return !!favorite;
}

// Adds a product to favorites (idempotent — the schema has a @@unique constraint).
export async function addFavorite(productId: string): Promise<void> {
  const session = await getActiveSession();
  if (!session) throw new AppError("AUTHENTICATION", "Não autenticado.", 401);

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) throw new AppError("NOT_FOUND", "Cliente não encontrado.", 404);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError("NOT_FOUND", "Produto não encontrado.", 404);

  await prisma.favorite.upsert({
    where: { customerId_productId: { customerId: customer.id, productId } },
    update: {},
    create: { customerId: customer.id, productId },
  });
}

// Removes a product from favorites.
export async function removeFavorite(productId: string): Promise<void> {
  const session = await getActiveSession();
  if (!session) throw new AppError("AUTHENTICATION", "Não autenticado.", 401);

  const customer = await prisma.customer.findUnique({ where: { userId: session.userId } });
  if (!customer) return;

  await prisma.favorite.deleteMany({
    where: { customerId: customer.id, productId },
  });
}
