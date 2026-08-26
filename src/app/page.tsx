import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import NewsletterForm from "@/components/ui/NewsletterForm";

async function getHomePageData() {
  try {
    // Dynamic import: if the Prisma client cannot be loaded (e.g. infra
    // failure), the existing catch degrades to the real empty states instead
    // of a hard 500. When the client is available, behavior is unchanged.
    const { prisma } = await import("@/lib/config/prisma");
    const products = await prisma.product.findMany({
      where: { isActive: true },
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
    });

    // Map database structures into storefront-friendly props
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
        categorySlug: prod.category.slug,
        variants: prod.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock: v.inventory?.quantity ?? 0,
        })),
      };
    });

    const featured = formattedProducts.filter((p) => p.isFeatured);
    const offers = formattedProducts.filter((p) => p.promotionalPrice !== null);

    return { featured, offers };
  } catch (error) {
    console.error("Error fetching homepage products:", error);
    return { featured: [], offers: [] };
  }
}

// Categorias reais do sistema (mesmos slugs/links já utilizados pela Home).
const CATEGORIES = [
  {
    name: "Calçados",
    slug: "calcados",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Fitness & Gym",
    slug: "fitness",
    img: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Moda Casual",
    slug: "moda",
    img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Casa & Enxoval",
    slug: "casa-enxoval",
    img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&auto=format&fit=crop&q=80",
  },
  {
    name: "Beleza",
    slug: "beleza-cuidados",
    img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&auto=format&fit=crop&q=80",
  },
];

function CategoryTile({
  category,
  index,
  className = "",
}: {
  category: (typeof CATEGORIES)[number];
  index: number;
  className?: string;
}) {
  return (
    <Link
      href={`/loja?categoria=${category.slug}`}
      className={`group relative block overflow-hidden rounded-md bg-ink-100 dark:bg-ink-925 ${className}`}
    >
      <img
        src={category.img}
        alt={`Categoria ${category.name}`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-premium group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-label text-electric-400">
            {String(index + 1).padStart(2, "0")} — Acaiaba
          </p>
          <p className="mt-1 font-display text-xl font-black uppercase tracking-tight text-white md:text-2xl">
            {category.name}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors duration-300 group-hover:border-electric-600 group-hover:bg-electric-600">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export default async function Home() {
  const { featured, offers } = await getHomePageData();
  const heroCategories = [CATEGORIES[0], CATEGORIES[2], CATEGORIES[4]];

  return (
    <div>
      {/* ================= HERO — campanha editorial ================= */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        {/* Ghost wordmark — cortado na borda superior, como campanha */}
        <p
          aria-hidden="true"
          className="text-outline pointer-events-none absolute -top-[4vw] left-0 right-0 select-none whitespace-nowrap text-center font-display text-[19vw] font-black uppercase leading-none tracking-brand"
        >
          Acaiaba
        </p>

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 lg:px-8 lg:pb-16 lg:pt-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Conteúdo principal */}
            <div className="flex flex-col justify-center lg:col-span-5">
              <p className="font-display text-[11px] font-bold uppercase tracking-brand text-electric-500">
                Acaiaba — Electric
              </p>
              <h1 className="mt-6 font-display text-[13vw] font-black uppercase leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
                <span className="block">O estilo</span>
                <span className="block">que marca</span>
                <span className="block text-electric-500">presença.</span>
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-300">
                Produtos selecionados para quem vive intensamente cada detalhe.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link href="/loja" className="btn-electric">
                  Comprar agora
                </Link>
                <Link
                  href="/loja"
                  className="group inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-label text-white transition-colors hover:text-electric-400"
                >
                  Explorar coleção
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Retrato com glow elétrico */}
            <div className="relative lg:col-span-4">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric-600/25 blur-3xl"
              />
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80"
                  alt="Campanha ACAIABA — estilo que marca presença"
                  className="aspect-[3/4] w-full object-cover object-top contrast-125 grayscale transition-transform duration-700 ease-premium hover:scale-[1.01]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent"
                />
              </div>
            </div>

            {/* Categorias em coluna vertical (desktop) / trilho (mobile) */}
            <div className="lg:col-span-3">
              <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 lg:mx-0 lg:grid lg:h-full lg:grid-rows-3 lg:overflow-visible lg:px-0">
                {heroCategories.map((cat, i) => (
                  <Link
                    key={cat.slug}
                    href={`/loja?categoria=${cat.slug}`}
                    className={`group relative block aspect-[3/4] min-w-[150px] snap-start overflow-hidden rounded-md border bg-ink-925 sm:min-w-[170px] lg:aspect-auto lg:min-w-0 ${
                      i === 0
                        ? "border-electric-500/70"
                        : "border-white/10"
                    }`}
                  >
                    <img
                      src={cat.img}
                      alt={`Categoria ${cat.name}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 ease-premium group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3.5">
                      <div>
                        <p className="font-display text-sm font-black uppercase tracking-tight text-white">
                          {cat.name}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-ink-300 transition-colors group-hover:text-electric-400">
                          Confira
                        </p>
                      </div>
                      <ArrowRight className="mb-0.5 h-3.5 w-3.5 text-ink-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-electric-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= FAIXA DE BENEFÍCIOS ================= */}
        <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-ink-925 lg:grid-cols-4">
            {[
              { value: "Frete", label: "Grátis", micro: "Para todo o Brasil" },
              { value: "100%", label: "Seguro", micro: "Seus dados protegidos" },
              { value: "30 dias", label: "Para trocas", micro: "E devoluções" },
              { value: "PIX", label: "Instantâneo", micro: "Confirmação imediata" },
            ].map((b) => (
              <div
                key={b.value}
                className="border-white/10 px-6 py-8 text-center lg:py-10 max-lg:[&:nth-child(even)]:border-l max-lg:[&:nth-child(n+3)]:border-t lg:border-l lg:first:border-l-0"
              >
                <p className="font-display text-2xl font-black uppercase tracking-tight text-electric-500 lg:text-3xl">
                  {b.value}
                </p>
                <p className="mt-1.5 font-display text-[11px] font-bold uppercase tracking-label text-white">
                  {b.label}
                </p>
                <p className="mt-1 text-[11px] text-ink-400">{b.micro}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= DESTAQUES ================= */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow !text-electric-600 dark:!text-electric-400">
              Seleção Acaiaba
            </p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-ink-950 dark:text-white sm:text-5xl">
              Destaques da vez.
            </h2>
          </div>
          <Link
            href="/loja"
            className="group hidden items-center gap-2 font-display text-xs font-bold uppercase tracking-label text-ink-500 transition-colors hover:text-electric-600 sm:inline-flex dark:text-ink-300 dark:hover:text-electric-400"
          >
            Ver todos
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="mt-12 border border-dashed border-ink-200 py-20 text-center text-sm text-ink-400 dark:border-white/15 dark:text-ink-400">
            Nenhum produto em destaque encontrado. Execute o seed no banco de dados.
          </div>
        )}

        <Link
          href="/loja"
          className="group mt-10 inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-label text-ink-500 transition-colors hover:text-electric-600 sm:hidden dark:text-ink-300 dark:hover:text-electric-400"
        >
          Ver todos
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </section>

      {/* ================= CUPOM (informação real existente) ================= */}
      <section className="border-y border-ink-100 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-8 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <p className="eyebrow !text-electric-600 dark:!text-electric-400">
              Cupom ACAIABA10
            </p>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
              10% de desconto em compras acima de R$ 50 — aplicado no checkout.
            </p>
          </div>
          <Link href="/loja" className="btn-outline shrink-0 !px-6 !py-3">
            Ativar desconto
          </Link>
        </div>
      </section>

      {/* ================= CATEGORIAS — composição assimétrica ================= */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Universo Acaiaba</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-ink-950 dark:text-white sm:text-5xl">
              Explore por categoria.
            </h2>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <CategoryTile
            category={CATEGORIES[0]}
            index={0}
            className="aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:h-full md:min-h-[560px]"
          />
          <CategoryTile category={CATEGORIES[1]} index={1} className="aspect-[4/3] md:aspect-auto md:min-h-[270px]" />
          <CategoryTile category={CATEGORIES[2]} index={2} className="aspect-[4/3] md:aspect-auto md:min-h-[270px]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-3">
            <CategoryTile category={CATEGORIES[3]} index={3} className="aspect-[16/9]" />
            <CategoryTile category={CATEGORIES[4]} index={4} className="aspect-[16/9]" />
          </div>
        </div>
      </section>

      {/* ================= OFERTAS ================= */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow !text-electric-600 dark:!text-electric-400">
              Off Electric
            </p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-tight text-ink-950 dark:text-white sm:text-5xl">
              Melhores ofertas.
            </h2>
          </div>
          <Link
            href="/loja?sort=discount_desc"
            className="group hidden items-center gap-2 font-display text-xs font-bold uppercase tracking-label text-ink-500 transition-colors hover:text-electric-600 sm:inline-flex dark:text-ink-300 dark:hover:text-electric-400"
          >
            Ver ofertas
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {offers.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {offers.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="mt-12 border border-dashed border-ink-200 py-20 text-center text-sm text-ink-400 dark:border-white/15 dark:text-ink-400">
            Nenhuma oferta especial no momento.
          </div>
        )}
      </section>

      {/* ================= MANIFESTO ================= */}
      <section className="relative overflow-hidden bg-ink-950 py-24 text-white lg:py-36">
        <p
          aria-hidden="true"
          className="text-outline pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center font-display text-[16vw] font-black uppercase leading-none tracking-brand"
        >
          Electric
        </p>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-display text-[11px] font-bold uppercase tracking-brand text-electric-500">
            Acaiaba — Manifesto
          </p>
          <p className="mt-8 max-w-4xl font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Estilo não pede licença.{" "}
            <span className="text-electric-500">Ele marca presença.</span>
          </p>
          <div className="mt-12 flex items-center gap-4">
            <span className="h-px w-16 bg-electric-600" aria-hidden="true" />
            <p className="font-display text-[11px] font-bold uppercase tracking-label text-ink-400">
              Acaiaba Electric — em cada detalhe
            </p>
          </div>
        </div>
      </section>

      {/* ================= NEWSLETTER ================= */}
      <section className="border-t border-white/10 bg-ink-950 text-white">
        <div className="mx-auto grid max-w-7xl items-end gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-brand text-electric-500">
              Stay Electric
            </p>
            <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-tight sm:text-5xl">
              Fique por dentro.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
              Coleções, drops e ofertas secretas — primeiro no seu e-mail.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
