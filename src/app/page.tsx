import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, MapPin } from "lucide-react";
import MinimalProductCard from "@/components/ui/MinimalProductCard";
import NewsletterForm from "@/components/ui/NewsletterForm";

// The home page reads products, prices and stock from PostgreSQL but uses no
// request-scoped API (no cookies/searchParams), so Next.js prerenders it ONCE at
// build time and — confirmed in .next/prerender-manifest.json — keeps
// `initialRevalidateSeconds: false`, i.e. it would serve that frozen HTML until the
// next deploy. ISR (60s) keeps it served statically while the catalog refreshes.
export const revalidate = 60;

async function getHomePageData() {
  try {
    // Dynamic import: if the Prisma client cannot be loaded (e.g. infra
    // failure), the catch degrades to the real empty states instead of a 500.
    const { prisma } = await import("@/lib/config/prisma");

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          brand: true,
          category: true,
          images: { orderBy: { order: "asc" }, take: 1 },
          variants: { include: { inventory: true } },
        },
      }),
      prisma.category.findMany({
        where: { parentId: null },
        include: { children: true },
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

    return {
      featured: formattedProducts.filter((p) => p.isFeatured),
      categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
    };
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    return { featured: [], categories: [] };
  }
}

// Imagens já utilizadas pelo projeto (nenhuma URL nova/quebrada).
const CATEGORY_IMAGES: Record<string, string> = {
  calcados:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80",
  fitness:
    "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=900&auto=format&fit=crop&q=80",
  moda: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&auto=format&fit=crop&q=80",
  "casa-enxoval":
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&auto=format&fit=crop&q=80",
  "beleza-cuidados":
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&auto=format&fit=crop&q=80",
};
const FALLBACK_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop&q=80";

export default async function Home() {
  const { featured, categories } = await getHomePageData();

  return (
    <div className="bg-bg text-fg">
      {/* ============ HERO — campanha (acompanha o tema) ============ */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <div className="mx-auto grid min-h-[92vh] max-w-7xl grid-cols-1 lg:grid-cols-2">
          {/* Texto */}
          <div className="relative flex flex-col justify-center px-4 py-20 sm:px-6 lg:px-8 lg:py-0">
            {/* Assinatura vertical */}
            <p
              aria-hidden="true"
              className="text-vertical absolute left-2 top-1/2 hidden -translate-y-1/2 select-none font-display text-[10px] font-bold uppercase tracking-[0.6em] text-muted lg:block"
            >
              Acaiaba
            </p>

            <p className="font-display text-[11px] font-bold uppercase tracking-label text-muted">
              Nova coleção disponível
            </p>

            <h1 className="mt-6 font-display text-[15vw] font-black uppercase leading-[0.88] tracking-tight text-fg sm:text-8xl lg:text-[6.5rem]">
              <span className="block">O estilo</span>
              <span className="block">que marca</span>
              <span className="block">presença.</span>
            </h1>

            <div className="mt-12">
              <Link
                href="/loja"
                className="group inline-flex items-center gap-3 border border-fg px-8 py-4 font-display text-xs font-black uppercase tracking-label text-fg transition-colors duration-300 hover:bg-fg hover:text-bg"
              >
                Explorar agora
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Imagem editorial */}
          <div className="relative min-h-[60vh] lg:min-h-0">
            <img
              src={HERO_IMAGE}
              alt="Campanha ACAIABA — o estilo que marca presença"
              className="absolute inset-0 h-full w-full object-cover object-top contrast-125 grayscale"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-bg via-transparent to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent"
            />
          </div>
        </div>

        {/* Indicadores */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-line/15">
          <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-4 sm:px-6 lg:px-8">
            {["01", "02", "03"].map((n, i) => (
              <span
                key={n}
                aria-hidden="true"
                className={`font-display text-[11px] font-bold tracking-label ${
                  i === 0 ? "text-fg" : "text-muted/60"
                }`}
              >
                {n}
              </span>
            ))}
            <span
              aria-hidden="true"
              className="ml-auto hidden font-display text-[10px] font-bold uppercase tracking-label text-muted sm:block"
            >
              Acaiaba — o estilo que marca presença
            </span>
          </div>
        </div>
      </section>

      {/* ============ BENEFÍCIOS — contraste proposital (preto no light, #151515 no dark) ============ */}
      <section className="border-b border-line/15 bg-noir-950 text-noir-50 dark:bg-noir-800">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { icon: Truck, title: "Frete grátis", micro: "Acima de R$199" },
            { icon: ShieldCheck, title: "Compra segura", micro: "Seus dados protegidos" },
            { icon: MapPin, title: "Envio para todo Brasil", micro: "Com rastreamento" },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-4 px-4 py-6 sm:px-8">
              <b.icon className="h-5 w-5 shrink-0 text-noir-500" aria-hidden="true" />
              <div>
                <p className="font-display text-[11px] font-black uppercase tracking-label text-noir-50">
                  {b.title}
                </p>
                <p className="mt-0.5 text-[11px] text-noir-500">{b.micro}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ NEW DROP (acompanha o tema) ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-fg sm:text-6xl">
            New Drop
          </h2>
          <Link
            href="/loja"
            className="group inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-label text-muted transition-colors hover:text-fg"
          >
            Ver todos
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
            {featured.map((product) => (
              <MinimalProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="mt-12 border border-dashed border-line/20 px-4 py-24 text-center">
            <p className="font-display text-xs font-bold uppercase tracking-label text-muted">
              Nenhum produto em destaque encontrado. Execute o seed no banco de dados.
            </p>
          </div>
        )}
      </section>

      {/* ============ BANNER EDITORIAL — propositalmente dark em ambos os temas ============ */}
      <section className="grid grid-cols-1 bg-noir-950 text-noir-50 lg:grid-cols-3">
        <div className="relative min-h-[50vh] lg:min-h-[70vh]">
          <img
            src={CATEGORY_IMAGES.moda}
            alt="Editorial ACAIABA — moda"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover contrast-125 grayscale"
          />
        </div>
        <div className="flex flex-col items-start justify-center px-4 py-16 sm:px-6 lg:px-10 lg:py-0">
          <p className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-noir-50 sm:text-5xl">
            Mais que roupa.
            <span className="block">Presença.</span>
          </p>
          <Link
            href="/loja"
            className="group mt-10 inline-flex items-center gap-2 border-b border-noir-500 pb-1 font-display text-[11px] font-bold uppercase tracking-label text-noir-50 transition-colors hover:border-noir-50"
          >
            Conhecer mais
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="relative min-h-[50vh] lg:min-h-[70vh]">
          <img
            src={CATEGORY_IMAGES.fitness}
            alt="Editorial ACAIABA — fitness"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover contrast-125 grayscale"
          />
        </div>
      </section>

      {/* ============ CATEGORIAS (acompanha o tema) ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <h2 className="font-display text-4xl font-black uppercase tracking-tight text-fg sm:text-6xl">
          Categorias
        </h2>

        {categories.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.slug}
                href={`/loja?categoria=${cat.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden border border-line/15 bg-surface"
              >
                <img
                  src={CATEGORY_IMAGES[cat.slug] || FALLBACK_CATEGORY_IMAGE}
                  alt={`Categoria ${cat.name}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover grayscale transition-transform duration-700 ease-premium group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-noir-950/90 via-noir-950/20 to-transparent transition-opacity duration-300 group-hover:opacity-80"
                />
                <p className="absolute inset-x-0 bottom-0 p-5 font-display text-2xl font-black uppercase tracking-tight text-noir-50 sm:text-3xl">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 border border-dashed border-line/20 px-4 py-24 text-center">
            <p className="font-display text-xs font-bold uppercase tracking-label text-muted">
              Categorias indisponíveis no momento.
            </p>
          </div>
        )}
      </section>

      {/* ============ MANIFESTO — contraste proposital (preto no light, elevado no dark) ============ */}
      <section className="border-t border-line/15 bg-noir-950 dark:bg-noir-800">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-36">
          <h2 className="font-display text-5xl font-black uppercase leading-[0.92] tracking-tight text-noir-50 sm:text-7xl">
            Acaiaba é
            <span className="block">para quem</span>
            <span className="block">chega diferente.</span>
          </h2>
          <div className="flex flex-col justify-end gap-6 text-sm leading-relaxed text-noir-500">
            <p>
              Não seguimos tendências.
              <br />
              Criamos presença.
            </p>
            <p>
              Estilo não é sobre chamar atenção.
              <br />
              É sobre deixar marca.
            </p>
            <p className="font-display text-xs font-black uppercase tracking-label text-noir-50">
              Acaiaba.
              <span className="block">O estilo que marca presença.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ============ NEWSLETTER (acompanha o tema) ============ */}
      <section className="border-t border-line/15">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-end gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <h2 className="font-display text-5xl font-black uppercase leading-[0.92] tracking-tight text-fg sm:text-7xl">
            Entre para
            <span className="block">o movimento.</span>
          </h2>
          <div>
            <NewsletterForm />
            <p className="mt-4 text-[11px] text-muted">
              Receba novidades, lançamentos e conteúdos exclusivos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
