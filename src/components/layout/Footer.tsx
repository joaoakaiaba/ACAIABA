"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20produtos%20da%20ACAIABA!`;

  const benefits = [
    { value: "Frete", label: "Rápido para todo o Brasil" },
    { value: "100%", label: "Compra segura e criptografada" },
    { value: "30 dias", label: "Para trocas e devoluções" },
    { value: "PIX", label: "Confirmação instantânea" },
  ];

  return (
    <footer className="border-t border-white/10 bg-ink-950 text-ink-300">
      {/* Faixa de confiança — tipográfica, sem ícones */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.value} className="px-6 py-8 text-center lg:py-10">
              <p className="font-display text-2xl font-black uppercase tracking-tight text-electric-500 lg:text-3xl">
                {b.value}
              </p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-label text-ink-400">
                {b.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
          {/* Marca */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex flex-col leading-none" aria-label="ACAIABA — página inicial">
              <span className="font-display text-2xl font-black uppercase tracking-brand text-white">
                Acaiaba
              </span>
              <span className="mt-1.5 flex items-center gap-1.5">
                <span className="h-px w-5 bg-electric-500" aria-hidden="true" />
                <span className="font-display text-[10px] font-bold uppercase tracking-brand text-ink-400">
                  Eletric
                </span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-ink-400">
              O estilo que marca presença. Curadoria de alto padrão em calçados,
              fitness, moda, casa e beleza.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-label text-white transition-colors hover:border-electric-500 hover:text-electric-400"
            >
              Atendimento via WhatsApp
            </a>
          </div>

          {/* Categorias */}
          <nav aria-label="Categorias">
            <h3 className="eyebrow !text-white">Categorias</h3>
            <ul className="mt-5 space-y-3">
              {[
                { href: "/loja?categoria=calcados", label: "Calçados & Tênis" },
                { href: "/loja?categoria=fitness", label: "Fitness & Academia" },
                { href: "/loja?categoria=moda", label: "Moda Casual" },
                { href: "/loja?categoria=casa-enxoval", label: "Casa & Enxoval" },
                { href: "/loja?categoria=beleza-cuidados", label: "Beleza & Cuidados" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-400 transition-colors hover:text-electric-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Ajuda */}
          <nav aria-label="Ajuda e suporte">
            <h3 className="eyebrow !text-white">Ajuda & Suporte</h3>
            <ul className="mt-5 space-y-3">
              {[
                { href: "/contato", label: "Fale Conosco" },
                { href: "/politicas/entregas", label: "Política de Envios" },
                { href: "/politicas/trocas", label: "Trocas e Devoluções" },
                { href: "/politicas/privacidade", label: "Privacidade & LGPD" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-400 transition-colors hover:text-electric-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Pagamento */}
          <div>
            <h3 className="eyebrow !text-white">Pagamento & Segurança</h3>
            <p className="mt-5 text-sm leading-relaxed text-ink-400">
              Cartão de crédito em até 10x, débito, boleto e PIX com confirmação
              instantânea. Transações 100% criptografadas.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["PIX", "Crédito 10x", "Boleto"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm border border-white/10 px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-label text-ink-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Wordmark gigante — assinatura editorial */}
        <div className="mt-16 select-none overflow-hidden" aria-hidden="true">
          <p className="whitespace-nowrap text-center font-display text-[16vw] font-black uppercase leading-none tracking-brand text-white/[0.04] lg:text-[11rem]">
            Acaiaba
          </p>
        </div>

        {/* Base */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-ink-500">
            &copy; {currentYear} ACAIABA Store. Todos os direitos reservados. CNPJ: 12.345.678/0001-99.
          </p>
          <p className="font-display text-[11px] font-bold uppercase tracking-label text-ink-400">
            O estilo que marca presença.
          </p>
        </div>
      </div>
    </footer>
  );
}
