"use client";

import React from "react";
import Link from "next/link";
import { User, MapPin, Shield, CreditCard, ShoppingBag, LogOut } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Minha Conta</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie seu perfil, endereços de entrega e pedidos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Account menu navigation */}
        <div className="space-y-2 bg-slate-50 p-6 rounded-xl border border-gray-100 h-fit">
          <div className="flex items-center space-x-3 border-b border-gray-200 pb-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold">A</div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Mariana Silva</h4>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Cliente Premium</span>
            </div>
          </div>
          
          <Link href="/conta" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 uppercase tracking-wider">
            <User className="h-4 w-4" />
            <span>Meu Perfil</span>
          </Link>
          <Link href="/pedidos" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 uppercase tracking-wider transition-colors">
            <ShoppingBag className="h-4 w-4 text-gray-400" />
            <span>Meus Pedidos</span>
          </Link>
          <Link href="/login" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 uppercase tracking-wider transition-colors">
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Sair</span>
          </Link>
        </div>

        {/* Profile management workspace */}
        <div className="md:col-span-3 space-y-6">
          <div className="rounded-xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-100 pb-3">Informações Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-black text-gray-400 uppercase">Nome Completo</span>
                <p className="font-bold text-slate-900 mt-0.5">Mariana Silva</p>
              </div>
              <div>
                <span className="text-xs font-black text-gray-400 uppercase">E-mail</span>
                <p className="font-bold text-slate-900 mt-0.5">mariana@email.com</p>
              </div>
              <div>
                <span className="text-xs font-black text-gray-400 uppercase">Telefone</span>
                <p className="font-bold text-slate-900 mt-0.5">(11) 99999-9999</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-100 pb-3">Endereços Salvos</h3>
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex justify-between items-start">
              <div>
                <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">Padrão</span>
                <p className="text-sm font-bold text-slate-900 mt-2">Av. Paulista, 1000 - Apto 42</p>
                <p className="text-xs text-gray-500">Bela Vista, São Paulo - SP, CEP: 01310-100</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
