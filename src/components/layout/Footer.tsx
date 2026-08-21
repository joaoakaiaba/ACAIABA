"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, PhoneCall, ShieldCheck, Truck, RefreshCw, CreditCard } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20os%20produtos%20da%20ACAIABA!`;

  return (
    <footer className="bg-gray-950 text-gray-300">
      
      {/* Trust benefits bar */}
      <div className="border-b border-gray-800 bg-gray-900 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
            <div className="flex items-center space-x-4">
              <Truck className="h-8 w-8 text-amber-500" />
              <div>
                <h4 className="font-semibold text-white">Frete Rápido</h4>
                <p className="text-xs text-gray-400">Entregamos em todo o Brasil.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ShieldCheck className="h-8 w-8 text-amber-500" />
              <div>
                <h4 className="font-semibold text-white">Compra Segura</h4>
                <p className="text-xs text-gray-400">Seus dados 100% protegidos.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <RefreshCw className="h-8 w-8 text-amber-500" />
              <div>
                <h4 className="font-semibold text-white">Troca Fácil</h4>
                <p className="text-xs text-gray-400">Até 30 dias para devolução.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-8 w-8 text-amber-500" />
              <div>
                <h4 className="font-semibold text-white">Atendimento Premium</h4>
                <p className="text-xs text-gray-400">Suporte humanizado no WhatsApp.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer contents */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
          
          {/* Logo & About */}
          <div className="space-y-4">
            <span className="bg-amber-600 px-3 py-1.5 text-2xl font-black tracking-wider text-white uppercase rounded-md inline-block">
              ACAIABA
            </span>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed">
              O estilo que marca presença. Produtos selecionados de alto padrão para Calçados, Fitness, Moda, Casa e Beleza.
            </p>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 shadow transition-all"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Atendimento via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Categories links */}
          <div>
            <h3 className="font-bold text-white text-base tracking-wide uppercase">Categorias</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/loja?categoria=calcados" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Calçados & Tênis
                </Link>
              </li>
              <li>
                <Link href="/loja?categoria=fitness" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Fitness & Academia
                </Link>
              </li>
              <li>
                <Link href="/loja?categoria=moda" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Moda Casual
                </Link>
              </li>
              <li>
                <Link href="/loja?categoria=casa-enxoval" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Casa & Enxoval
                </Link>
              </li>
              <li>
                <Link href="/loja?categoria=beleza-cuidados" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Beleza & Cuidados
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service & Institutional links */}
          <div>
            <h3 className="font-bold text-white text-base tracking-wide uppercase">Ajuda & Suporte</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/contato" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Fale Conosco
                </Link>
              </li>
              <li>
                <Link href="/politicas/entregas" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Política de Envios
                </Link>
              </li>
              <li>
                <Link href="/politicas/trocas" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Trocas e Devoluções
                </Link>
              </li>
              <li>
                <Link href="/politicas/privacidade" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Privacidade & LGPD
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Trust */}
          <div>
            <h3 className="font-bold text-white text-base tracking-wide uppercase">Pagamento & Segurança</h3>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed">
              Aceitamos as principais bandeiras de cartão de crédito, débito, boleto bancário e PIX com confirmação instantânea.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="flex items-center space-x-1 rounded bg-gray-900 border border-gray-800 px-2.5 py-1.5 text-xs text-white">
                <CreditCard className="h-4 w-4 text-amber-500" />
                <span>PIX / Cartão</span>
              </span>
            </div>
          </div>

        </div>

        {/* Divider and Copyright */}
        <div className="mt-16 border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-y-4">
          <p className="text-xs text-gray-400">
            &copy; {currentYear} ACAIABA Store. Todos os direitos reservados. CNPJ: 12.345.678/0001-99.
          </p>
          <p className="text-xs text-gray-400">
            O estilo que marca presença.
          </p>
        </div>
      </div>
    </footer>
  );
}
