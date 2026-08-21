import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import ProductCard from "@/components/ui/ProductCard";
import NewsletterForm from "@/components/ui/NewsletterForm";
import { ShoppingBag, ChevronRight, CheckCircle, Star, Sparkles, Send } from "lucide-react";

async function getHomePageData() {
  try {
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
        categorySlug: prod.category.slug,
      };
    });

    const featured = formattedProducts.filter((p) => p.isFeatured);
    const offers = formattedProducts.filter((p) => p.promotionalPrice !== null);
    const latest = formattedProducts.slice(-4); // Last 4 items

    return { featured, offers, latest, allProducts: formattedProducts };
  } catch (error) {
    console.error("Error fetching homepage products:", error);
    return { featured: [], offers: [], latest: [], allProducts: [] };
  }
}

export default async function Home() {
  const { featured, offers, latest } = await getHomePageData();

  // Premium static mock reviews to maintain UX standard
  const testimonials = [
    {
      name: "Mariana Silva",
      role: "Atleta de CrossFit",
      comment: "A calça Legging Fitness Pro é simplesmente perfeita! Zero transparência e compressão ideal para treinos pesados. A entrega foi super rápida.",
      stars: 5,
    },
    {
      name: "Thiago Ramos",
      role: "Engenheiro de Software",
      comment: "Comprei o Tênis Force 1 e superou todas as expectativas. Extremamente leve e durável, uso para corrida e no dia a dia. Recomendo muito!",
      stars: 5,
    },
    {
      name: "Beatriz M.",
      role: "Designer de Interiores",
      comment: "O jogo de cama de 300 fios transformou meu quarto. Toque acetinado incrível. A ACAIABA realmente se importa com a qualidade.",
      stars: 5,
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-32 text-white">
        {/* Background photo overlay */}
        <div className="absolute inset-0 opacity-40 mix-blend-multiply">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop&q=80"
            alt="ACAIABA Lifestyle"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Estilo, Performance e Conforto</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white uppercase">
            ACAIABA
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-amber-500 font-extrabold italic tracking-wide uppercase">
            O estilo que marca presença.
          </p>
          <p className="mt-6 max-w-xl text-base sm:text-lg text-gray-300 leading-relaxed">
            Descubra coleções exclusivas de calçados de alta tecnologia, vestuário fitness profissional, moda casual contemporânea, cama de alto padrão e cosméticos premium.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
            <Link
              href="/loja"
              className="rounded-lg bg-amber-600 hover:bg-amber-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-600/25 transition-all text-center uppercase tracking-wider"
            >
              Comprar agora
            </Link>
            <Link
              href="/loja?sort=discount_desc"
              className="rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-3.5 text-base font-bold text-white transition-all text-center uppercase tracking-wider"
            >
              Ver ofertas
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase sm:text-3xl">
            Explorar Categorias
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Navegue pelos nossos principais segmentos e encontre o que precisa
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { name: "Calçados", slug: "calcados", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80" },
            { name: "Fitness & Gym", slug: "fitness", img: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&auto=format&fit=crop&q=80" },
            { name: "Moda Casual", slug: "moda", img: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80" },
            { name: "Casa & Enxoval", slug: "casa-enxoval", img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&auto=format&fit=crop&q=80" },
            { name: "Beleza", slug: "beleza-cuidados", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80" },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/loja?categoria=${cat.slug}`}
              className="group relative flex aspect-[4/5] flex-col overflow-hidden rounded-xl bg-gray-100 shadow-sm"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">
                  ACAIABA
                </span>
                <span className="text-base font-extrabold text-white uppercase tracking-tight block">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products ("Mais Vendidos") */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase sm:text-3xl">
              Mais Vendidos & Destaques
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Os produtos que são sucesso absoluto de vendas
            </p>
          </div>
          <Link
            href="/loja"
            className="hidden sm:inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-500"
          >
            <span>Ver todos</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
            Nenhum produto em destaque encontrado. Execute o seed no banco de dados.
          </div>
        )}
      </section>

      {/* 4. Promotional Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-amber-600 px-6 py-12 md:p-16 text-white overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 bottom-0 opacity-15 hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=800&auto=format&fit=crop&q=80"
              alt="Promo background"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative max-w-xl">
            <span className="font-extrabold tracking-wider text-amber-200 uppercase text-sm block mb-2">
              Oferta Especial de Lançamento
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
              GANHE 10% DE DESCONTO
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/90 leading-relaxed">
              Utilize o cupom <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-white font-bold">ACAIABA10</span> no checkout para compras acima de R$ 50,00 e garanta frete seguro em sua primeira compra.
            </p>
            <div className="mt-8">
              <Link
                href="/loja"
                className="rounded-lg bg-gray-950 hover:bg-gray-900 px-6 py-3 text-sm font-bold text-white transition-all uppercase tracking-wider shadow"
              >
                Ativar Desconto
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Offers Section ("Novidades e Promoções") */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase sm:text-3xl">
              Melhores Ofertas
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Produtos selecionados com descontos especiais para você
            </p>
          </div>
          <Link
            href="/loja?sort=discount_desc"
            className="hidden sm:inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-500"
          >
            <span>Ver ofertas</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {offers.length > 0 ? (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {offers.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
            Nenhuma oferta especial no momento.
          </div>
        )}
      </section>

      {/* 6. Brand Benefits */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Qualidade Comercial de Alta Linha", desc: "A curadoria da ACAIABA trabalha apenas com materiais importados e tecidos sustentáveis de altíssima durabilidade." },
              { title: "Segurança de Dados Rigorosa", desc: "Trabalhamos com transações 100% criptografadas de ponta a ponta e gateways financeiros de padrão global." },
              { title: "Logística Conectada e Rápida", desc: "Parceria direta com transportadoras locais e Correios para garantir postagem em até 24 horas úteis." }
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4">
                <CheckCircle className="h-10 w-10 text-amber-600 mb-4" />
                <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-tight">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-xs">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonials Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase sm:text-3xl">
            Quem Usa, Recomenda
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Veja os depoimentos de clientes reais que marcam presença com a ACAIABA
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((test, idx) => (
            <div key={idx} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-1 text-amber-500 mb-4">
                {[...Array(test.stars)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed">
                &quot;{test.comment}&quot;
              </p>
              <div className="mt-4 border-t border-gray-50 pt-4">
                <h4 className="font-bold text-sm text-slate-900">{test.name}</h4>
                <p className="text-xs text-amber-600 font-semibold">{test.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Newsletter Subscription */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-slate-950 px-6 py-12 md:p-16 text-white text-center relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_1px]" />
          <div className="relative max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tight">
              Faça Parte do Nosso Clube
            </h2>
            <p className="text-sm text-gray-400">
              Receba novidades, coleções sazonais exclusivas e promoções secretas em primeira mão diretamente no seu e-mail.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>

    </div>
  );
}
