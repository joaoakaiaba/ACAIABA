"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20produtos%20da%20ACAIABA!`;

  const linkCls =
    "text-sm text-noir-500 transition-colors hover:text-noir-50";

  return (
    <footer className="border-t border-white/10 bg-noir-950 text-noir-50">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        {/* Marca + manifesto curto */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <p className="font-display text-5xl font-black uppercase leading-none tracking-[0.18em] text-noir-50 sm:text-7xl">
            Acaiaba
          </p>
          <p className="max-w-md text-sm leading-relaxed text-noir-500 lg:justify-self-end">
            ACAIABA é uma marca construída para quem faz da presença o seu
            estilo de vida. O estilo que marca presença.
          </p>
        </div>

        {/* Colunas reais */}
        <div className="mt-16 grid grid-cols-2 gap-10 border-t border-white/10 pt-12 md:grid-cols-4 lg:mt-24">
          <nav aria-label="Shop">
            <h3 className="font-display text-[11px] font-bold uppercase tracking-label text-noir-50">
              Shop
            </h3>
            <ul className="mt-5 space-y-3">
              <li><Link href="/loja" className={linkCls}>Todos os produtos</Link></li>
              <li><Link href="/loja?sort=latest" className={linkCls}>Novidades</Link></li>
              <li><Link href="/loja" className={linkCls}>Mais vendidos</Link></li>
              <li><Link href="/loja?sort=discount_desc" className={linkCls}>Promoções</Link></li>
            </ul>
          </nav>

          <nav aria-label="Coleções">
            <h3 className="font-display text-[11px] font-bold uppercase tracking-label text-noir-50">
              Coleções
            </h3>
            <ul className="mt-5 space-y-3">
              <li><Link href="/loja?categoria=calcados" className={linkCls}>Calçados</Link></li>
              <li><Link href="/loja?categoria=fitness" className={linkCls}>Fitness</Link></li>
              <li><Link href="/loja?categoria=moda" className={linkCls}>Moda</Link></li>
              <li><Link href="/loja?categoria=casa-enxoval" className={linkCls}>Casa</Link></li>
              <li><Link href="/loja?categoria=beleza-cuidados" className={linkCls}>Beleza</Link></li>
            </ul>
          </nav>

          <nav aria-label="Ajuda">
            <h3 className="font-display text-[11px] font-bold uppercase tracking-label text-noir-50">
              Ajuda
            </h3>
            <ul className="mt-5 space-y-3">
              <li><Link href="/contato" className={linkCls}>Fale conosco</Link></li>
              <li><Link href="/politicas/trocas" className={linkCls}>Trocas e devoluções</Link></li>
              <li><Link href="/politicas/entregas" className={linkCls}>Entrega</Link></li>
              <li><Link href="/politicas/privacidade" className={linkCls}>Privacidade</Link></li>
            </ul>
          </nav>

          <div>
            <h3 className="font-display text-[11px] font-bold uppercase tracking-label text-noir-50">
              Sobre
            </h3>
            <ul className="mt-5 space-y-3">
              <li><Link href="/contato" className={linkCls}>Nossa história</Link></li>
              <li><Link href="/contato" className={linkCls}>Contato</Link></li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkCls}
                >
                  WhatsApp
                </a>
              </li>
              <li><Link href="/politicas/privacidade" className={linkCls}>Política</Link></li>
            </ul>
          </div>
        </div>

        {/* Base */}
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-[11px] text-noir-500">
            &copy; {currentYear} ACAIABA Store. Todos os direitos reservados. CNPJ: 12.345.678/0001-99.
          </p>
          <p className="font-display text-[10px] font-bold uppercase tracking-label text-noir-500">
            O estilo que marca presença.
          </p>
        </div>
      </div>
    </footer>
  );
}
