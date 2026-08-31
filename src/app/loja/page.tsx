import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";

interface SearchParams {
  search?: string;
  categoria?: string;
  brand?: string;
  sort?: string;
  page?: string;
}

// Resolvers with graceful degradation: infra failure (e.g. Prisma client not
// loadable) yields null so the filter is skipped instead of crashing the page.
async function resolveCategory(slug: string) {
  try {
    const { prisma } = await import("@/lib/config/prisma");
    return await prisma.category.findUnique({
      where: { slug },
      include: { children: true },
    });
  } catch (error) {
    console.error("Error resolving category:", error);
    return null;
  }
}

async function resolveBrand(slug: string) {
  try {
    const { prisma } = await import("@/lib/config/prisma");
    return await prisma.brand.findUnique({ where: { slug } });
  } catch (error) {
    console.error("Error resolving brand:", error);
    return null;
  }
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
    const category = await resolveCategory(params.categoria);
    if (category) {
      const categoryIds = [category.id, ...category.children.map((c) => c.id)];
      where.categoryId = { in: categoryIds };
    }
  }

  // Brand filter
  if (params.brand) {
    const brand = await resolveBrand(params.brand);
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
    // Dynamic import: if the Prisma client cannot be loaded (infra failure),
    // the catch below degrades to the real empty states instead of a hard 500.
    const { prisma } = await import("@/lib/config/prisma");

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
      const totalStock = prod.variants.reduce(
        (sum, v) => sum + (v.inventory?.quantity ?? 0),
        0
      );
      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        brandName: prod.brand.name,
        price: Number(prod.price),
        promotionalPrice: prod.promotionalPrice
          ? Number(prod.promotionalPrice)
          : null,
        imageUrl:
          prod.images[0]?.url ||
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
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

const SORT_OPTIONS = [
  { label: "Destaque", val: "relevance" },
  { label: "Menor preço", val: "price_asc" },
  { label: "Maior preço", val: "price_desc" },
  { label: "Lançamentos", val: "latest" },
];

export default async function StorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { products, totalCount, totalPages, currentPage, categories, brands } =
    await getCatalogData(searchParams);

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

  const activeSort = searchParams.sort || "relevance";
  const hasActiveFilters = !!(
    searchParams.categoria ||
    searchParams.brand ||
    searchParams.search
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* Cabeçalho editorial */}
      <div className="flex flex-col gap-6 border-b border-ink-100 pb-8 md:flex-row md:items-end md:justify-between dark:border-white/10">
        <div>
          <p className="eyebrow !text-electric-600 dark:!text-electric-400">
            Catálogo Acaiaba
          </p>
          <h1 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-ink-950 dark:text-white sm:text-5xl">
            {searchParams.search
              ? `Busca: ${searchParams.search}`
              : "Loja completa."}
          </h1>
          <p className="mt-3 text-sm text-ink-400 dark:text-ink-300">
            Mostrando {products.length} de {totalCount} produtos
          </p>
        </div>

        {/* Ordenação — hairline, sem caixas */}
        <nav aria-label="Ordenar produtos" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="eyebrow">Ordenar</span>
          {SORT_OPTIONS.map((item) => (
            <Link
              key={item.val}
              href={createQueryUrl({ sort: item.val === "relevance" ? null : item.val, page: "1" })}
              className={`font-display text-[11px] font-bold uppercase tracking-label transition-colors ${
                activeSort === item.val
                  ? "text-electric-600 underline underline-offset-8 decoration-2 dark:text-electric-400"
                  : "text-ink-500 hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-4">
        {/* Filtros */}
        <aside className="h-fit space-y-10 rounded-md border border-ink-100 bg-white p-6 dark:border-white/10 dark:bg-ink-925">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow !text-ink-950 dark:!text-white">Filtros</h2>
            {hasActiveFilters && (
              <Link
                href="/loja"
                className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-label text-electric-600 transition-colors hover:text-electric-500 dark:text-electric-400"
              >
                <RotateCcw className="h-3 w-3" />
                Limpar
              </Link>
            )}
          </div>

          {/* Busca */}
          <form action="/loja" method="GET" className="relative">
            <label htmlFor="loja-search" className="sr-only">
              Pesquisar produtos
            </label>
            <input
              id="loja-search"
              type="text"
              name="search"
              defaultValue={searchParams.search || ""}
              placeholder="Buscar palavra-chave..."
              className="field !py-2.5 !pr-10 text-xs"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-electric-600"
              aria-label="Pesquisar"
            >
              <Search className="h-4 w-4" />
            </button>
            {searchParams.categoria && (
              <input type="hidden" name="categoria" value={searchParams.categoria} />
            )}
            {searchParams.brand && (
              <input type="hidden" name="brand" value={searchParams.brand} />
            )}
            {searchParams.sort && (
              <input type="hidden" name="sort" value={searchParams.sort} />
            )}
          </form>

          {/* Segmentos */}
          <div>
            <h3 className="eyebrow border-b border-ink-100 pb-3 dark:border-white/10">
              Segmentos
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href={createQueryUrl({ categoria: null, page: "1" })}
                className={`font-display text-[11px] font-bold uppercase tracking-label transition-colors ${
                  !searchParams.categoria
                    ? "text-electric-600 dark:text-electric-400"
                    : "text-ink-500 hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
                }`}
              >
                Todos os segmentos
              </Link>
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <Link
                    href={createQueryUrl({ categoria: cat.slug, page: "1" })}
                    className={`block font-display text-[11px] font-bold uppercase tracking-label transition-colors ${
                      searchParams.categoria === cat.slug
                        ? "text-electric-600 dark:text-electric-400"
                        : "text-ink-800 hover:text-electric-600 dark:text-ink-100 dark:hover:text-electric-400"
                    }`}
                  >
                    {cat.name}
                  </Link>
                  {cat.children.length > 0 && (
                    <div className="ml-1 flex flex-col gap-1 border-l border-ink-100 pl-3 dark:border-white/10">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={createQueryUrl({ categoria: sub.slug, page: "1" })}
                          className={`text-[11px] font-medium transition-colors ${
                            searchParams.categoria === sub.slug
                              ? "text-electric-600 dark:text-electric-400"
                              : "text-ink-400 hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
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

          {/* Marcas */}
          <div>
            <h3 className="eyebrow border-b border-ink-100 pb-3 dark:border-white/10">
              Marcas
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              <Link
                href={createQueryUrl({ brand: null, page: "1" })}
                className={`font-display text-[11px] font-bold uppercase tracking-label transition-colors ${
                  !searchParams.brand
                    ? "text-electric-600 dark:text-electric-400"
                    : "text-ink-500 hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
                }`}
              >
                Todas as marcas
              </Link>
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={createQueryUrl({ brand: brand.slug, page: "1" })}
                  className={`font-display text-[11px] font-bold uppercase tracking-label transition-colors ${
                    searchParams.brand === brand.slug
                      ? "text-electric-600 dark:text-electric-400"
                      : "text-ink-500 hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
                  }`}
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Grade de produtos + paginação */}
        <div className="space-y-12 lg:col-span-3">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-ink-200 px-4 py-24 text-center dark:border-white/15">
              <p className="eyebrow">Catálogo vazio</p>
              <h3 className="mt-3 font-display text-xl font-black uppercase tracking-tight text-ink-950 dark:text-white">
                Nenhum produto encontrado
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm text-ink-400 dark:text-ink-300">
                Tente ajustar seus filtros ou limpar a pesquisa de palavra-chave
                para encontrar os produtos desejados.
              </p>
              <div className="mt-8">
                <Link href="/loja" className="btn-outline !px-6 !py-3">
                  Limpar todos os filtros
                </Link>
              </div>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <nav
              aria-label="Paginação do catálogo"
              className="flex items-center justify-center gap-2 border-t border-ink-100 pt-8 dark:border-white/10"
            >
              {currentPage > 1 ? (
                <Link
                  href={createQueryUrl({ page: String(currentPage - 1) })}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-500 transition-colors hover:border-ink-950 hover:text-ink-950 dark:border-white/15 dark:text-ink-300 dark:hover:border-white dark:hover:text-white"
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md border border-ink-100 text-ink-300 dark:border-white/10 dark:text-ink-600">
                  <ChevronLeft className="h-4 w-4" />
                </span>
              )}

              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                return (
                  <Link
                    key={p}
                    href={createQueryUrl({ page: String(p) })}
                    className={`flex h-10 w-10 items-center justify-center rounded-md font-display text-xs font-bold transition-colors ${
                      currentPage === p
                        ? "bg-ink-950 text-white dark:bg-electric-600"
                        : "border border-ink-200 text-ink-600 hover:border-ink-950 hover:text-ink-950 dark:border-white/15 dark:text-ink-300 dark:hover:border-white dark:hover:text-white"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}

              {currentPage < totalPages ? (
                <Link
                  href={createQueryUrl({ page: String(currentPage + 1) })}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-500 transition-colors hover:border-ink-950 hover:text-ink-950 dark:border-white/15 dark:text-ink-300 dark:hover:border-white dark:hover:text-white"
                  title="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md border border-ink-100 text-ink-300 dark:border-white/10 dark:text-ink-600">
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
