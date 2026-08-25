import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import ProductCard from "@/components/ui/ProductCard";
import { Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface SearchParams {
  search?: string;
  categoria?: string;
  brand?: string;
  sort?: string;
  page?: string;
}

async function getCatalogData(params: SearchParams) {
  const page = parseInt(params.page || "1", 10);
  const limit = 8;
  const skip = (page - 1) * limit;

  // Build prisma search conditions
  const where: any = {
    isActive: true,
  };

  // Search filter (Case-insensitive)
  if (params.search) {
    const term = params.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { baseSku: { contains: term, mode: "insensitive" } },
      { brand: { name: { contains: term, mode: "insensitive" } } },
      { category: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  // Category filter (support subcategories hierarchically)
  if (params.categoria) {
    const category = await prisma.category.findUnique({
      where: { slug: params.categoria },
      include: { children: true },
    });

    if (category) {
      const categoryIds = [category.id, ...category.children.map((c) => c.id)];
      where.categoryId = { in: categoryIds };
    }
  }

  // Brand filter
  if (params.brand) {
    const brand = await prisma.brand.findUnique({
      where: { slug: params.brand },
    });
    if (brand) {
      where.brandId = brand.id;
    }
  }

  // Sorting definition
  let orderBy: any = { isFeatured: "desc" }; // default: relevance
  if (params.sort === "price_asc") {
    orderBy = { price: "asc" };
  } else if (params.sort === "price_desc") {
    orderBy = { price: "desc" };
  } else if (params.sort === "latest") {
    orderBy = { createdAt: "desc" };
  } else if (params.sort === "discount_desc") {
    orderBy = { promotionalPrice: "asc" }; // Shows products on promotion first
  }

  try {
    // Run parallel queries to speed up loading
    const [products, totalCount, categories, brands] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          brand: true,
          category: true,
          images: {
            orderBy: { order: "asc" },
            take: 1,
          },
          variants: {
            include: {
              inventory: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { parentId: null }, // Top level categories for filter sidebar
        include: { children: true },
      }),
      prisma.brand.findMany({
        where: { active: true },
      }),
    ]);

    const formattedProducts = products.map((prod) => {
      const totalStock = prod.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0);
      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        brandName: prod.brand.name,
        price: Number(prod.price),
        promotionalPrice: prod.promotionalPrice ? Number(prod.promotionalPrice) : null,
        imageUrl: prod.images[0]?.url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
        stock: totalStock,
        isFeatured: prod.isFeatured,
        variants: prod.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.inventory?.quantity ?? 0,
        })),
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      products: formattedProducts,
      totalCount,
      totalPages,
      currentPage: page,
      categories,
      brands,
    };
  } catch (error) {
    console.error("Error loading catalog:", error);
    return {
      products: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      categories: [],
      brands: [],
    };
  }
}

export default async function StorePage({ searchParams }: { searchParams: SearchParams }) {
  const { products, totalCount, totalPages, currentPage, categories, brands } = await getCatalogData(searchParams);

  // Helper to construct query URLs
  const createQueryUrl = (newParams: Record<string, string | null>) => {
    const current = { ...searchParams } as Record<string, string>;
    Object.keys(newParams).forEach((key) => {
      if (newParams[key] === null) {
        delete current[key];
      } else {
        current[key] = newParams[key] as string;
      }
    });

    const searchStr = new URLSearchParams(current).toString();
    return `/loja?${searchStr}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 dark:border-slate-800 pb-5 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Catálogo Completo
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mostrando {products.length} de {totalCount} produtos encontrados
          </p>
        </div>
        
        {/* Sorting controls */}
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="relative inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <span>Ordenar por:</span>
            <div className="flex gap-2">
              {[
                { label: "Destaque", val: "relevance" },
                { label: "Menor Preço", val: "price_asc" },
                { label: "Maior Preço", val: "price_desc" },
                { label: "Lançamentos", val: "latest" },
              ].map((item) => (
                <Link
                  key={item.val}
                  href={createQueryUrl({ sort: item.val, page: "1" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                    (searchParams.sort || "relevance") === item.val
                      ? "bg-amber-600 border-amber-600 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filter Sidebar */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 h-fit">
          
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-950 dark:text-white uppercase tracking-tight flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-amber-600" />
              <span>Filtros</span>
            </h3>
            {(searchParams.categoria || searchParams.brand || searchParams.search) && (
              <Link
                href="/loja"
                className="text-xs font-bold text-amber-600 hover:text-amber-500 uppercase flex items-center space-x-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Limpar</span>
              </Link>
            )}
          </div>

          {/* Search bar inside filter */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Pesquisar</h4>
            <form action="/loja" method="GET" className="relative">
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search || ""}
                placeholder="Buscar palavra-chave..."
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-4 pr-10 text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button type="submit" className="absolute right-3 top-2.5">
                <Search className="h-4 w-4 text-gray-400" />
              </button>
              {/* Keep other active filters */}
              {searchParams.categoria && <input type="hidden" name="categoria" value={searchParams.categoria} />}
              {searchParams.brand && <input type="hidden" name="brand" value={searchParams.brand} />}
              {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
            </form>
          </div>

          {/* Categories list */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-slate-700 pb-2">Segmentos</h4>
            <div className="flex flex-col space-y-2 mt-3">
              <Link
                href={createQueryUrl({ categoria: null, page: "1" })}
                className={`text-xs font-semibold uppercase tracking-wider py-1 hover:text-amber-600 transition-colors ${
                  !searchParams.categoria ? "text-amber-600 font-bold" : "text-gray-600"
                }`}
              >
                Todos os Segmentos
              </Link>
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <Link
                    href={createQueryUrl({ categoria: cat.slug, page: "1" })}
                    className={`text-xs font-bold uppercase py-1 hover:text-amber-600 transition-colors block ${
                      searchParams.categoria === cat.slug ? "text-amber-600" : "text-gray-800"
                    }`}
                  >
                    {cat.name}
                  </Link>
                  {/* Render children subcategories if top category is clicked */}
                  {cat.children.length > 0 && (
                    <div className="pl-3 flex flex-col space-y-1 border-l border-gray-200 dark:border-slate-700 ml-1">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={createQueryUrl({ categoria: sub.slug, page: "1" })}
                          className={`text-[11px] font-semibold uppercase py-0.5 hover:text-amber-600 transition-colors ${
                            searchParams.categoria === sub.slug ? "text-amber-600 font-bold" : "text-gray-500"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Brands list */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-slate-700 pb-2">Marcas</h4>
            <div className="flex flex-col space-y-2 mt-3">
              <Link
                href={createQueryUrl({ brand: null, page: "1" })}
                className={`text-xs font-semibold uppercase tracking-wider py-1 hover:text-amber-600 transition-colors ${
                  !searchParams.brand ? "text-amber-600 font-bold" : "text-gray-600"
                }`}
              >
                Todas as Marcas
              </Link>
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={createQueryUrl({ brand: brand.slug, page: "1" })}
                  className={`text-xs font-semibold uppercase tracking-wider py-1 hover:text-amber-600 transition-colors ${
                    searchParams.brand === brand.slug ? "text-amber-600 font-bold" : "text-gray-600"
                  }`}
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Product Grid & Pagination */}
        <div className="lg:col-span-3 space-y-12">
          
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 py-24 text-center px-4">
              <RotateCcw className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">Nenhum produto encontrado</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Tente ajustar seus filtros ou limpar a pesquisa de palavra-chave para encontrar os produtos desejados.
              </p>
              <div className="mt-6">
                <Link
                  href="/loja"
                  className="inline-flex items-center rounded-lg bg-amber-600 px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow"
                >
                  Limpar todos os filtros
                </Link>
              </div>
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 border-t border-gray-100 dark:border-slate-800 pt-8">
              {/* Prev Page Button */}
              {currentPage > 1 ? (
                <Link
                  href={createQueryUrl({ page: String(currentPage - 1) })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all"
                  title="Página Anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-gray-300 cursor-not-allowed">
                  <ChevronLeft className="h-5 w-5" />
                </span>
              )}

              {/* Page Number Badges */}
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                return (
                  <Link
                    key={p}
                    href={createQueryUrl({ page: String(p) })}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold uppercase transition-all ${
                      currentPage === p
                        ? "bg-amber-600 text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}

              {/* Next Page Button */}
              {currentPage < totalPages ? (
                <Link
                  href={createQueryUrl({ page: String(currentPage + 1) })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all"
                  title="Próxima Página"
                >
                  <ChevronRight className="h-5 w-5" />
                </Link>
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-gray-300 cursor-not-allowed">
                  <ChevronRight className="h-5 w-5" />
                </span>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
