"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, MapPin, Shield, CreditCard, ShoppingBag, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";

export default function AccountPage() {
  const { user, isAdmin, logout } = useAuth();
  const { loading } = useRequireAuth();
  const router = useRouter();

  // While the session is loading or redirecting to login, render nothing meaningful.
  if (loading || !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-gray-500">
        Carregando sua conta...
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const initials = (user.name?.[0] || "A").toUpperCase();

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
            <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold">{initials}</div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-sm truncate">{user.name}</h4>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-wide inline-block">
                {isAdmin ? "Administrador" : "Cliente"}
              </span>
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
          {isAdmin && (
            <Link href="/admin" className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 uppercase tracking-wider transition-colors">
              <Shield className="h-4 w-4 text-gray-400" />
              <span>Painel Admin</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 uppercase tracking-wider transition-colors"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Sair</span>
          </button>
        </div>

        {/* Profile management workspace */}
        <div className="md:col-span-3 space-y-6">
          <div className="rounded-xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-100 pb-3">Informações Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-black text-gray-400 uppercase">Nome Completo</span>
                <p className="font-bold text-slate-900 mt-0.5">{user.name}</p>
              </div>
              <div>
                <span className="text-xs font-black text-gray-400 uppercase">E-mail</span>
                <p className="font-bold text-slate-900 mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-tight border-b border-gray-100 pb-3">Segurança</h3>
            <p className="text-xs text-gray-500">
              Sua sessão é protegida por autenticação segura com cookie HttpOnly. Para trocar de conta, clique na opção Sair.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>Endereços salvos: gerencie no momento do checkout.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
