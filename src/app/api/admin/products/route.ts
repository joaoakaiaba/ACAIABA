import { prisma } from "@/lib/config/prisma";
import { requireAdminApi } from "@/server/auth/adminGuard";
import { handleServerException } from "@/lib/config/errors";
import { createProduct } from "@/server/commerce/productService";

// Lists products with optional filters + pagination (admin).
export async function GET(request: Request) {
  try {
    await requireAdminApi();
    const url = new URL(request.url);
    const search = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status") || "";
    const categoryId = url.searchParams.get("categoryId") || "";
    const brandId = url.searchParams.get("brandId") || "";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10) || 20));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { baseSku: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brand: true,
          category: true,
          variants: { include: { inventory: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const payload = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      baseSku: p.baseSku,
      brandName: p.brand.name,
      categoryName: p.category.name,
      price: Number(p.price),
      promotionalPrice: p.promotionalPrice ? Number(p.promotionalPrice) : null,
      status: p.status,
      isActive: p.isActive,
      stock: p.variants.reduce((s, v) => s + (v.inventory?.quantity ?? 0), 0),
    }));

    return Response.json({ products: payload, total, page, limit });
  } catch (error) {
    return handleServerException(error);
  }
}

// Creates a product with variants + inventory (admin).
export async function POST(request: Request) {
  try {
    const session = await requireAdminApi();
    const body = await request.json();
    const product = await createProduct({
      product: body.product,
      variants: body.variants ?? [],
      actorUserId: session.userId,
    });
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return handleServerException(error);
  }
}
