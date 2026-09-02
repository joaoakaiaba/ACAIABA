"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAdmin } = useAuth();

  const redirectTo = searchParams.get("redirect") || "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Falha ao entrar.");
      return;
    }

    // Redirect to the intended destination, or to the admin/conta area otherwise.
    if (redirectTo && redirectTo.startsWith("/")) {
      router.push(redirectTo);
      return;
    }
    router.push(isAdmin ? "/admin" : "/conta");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm space-y-6">

        <div className="text-center">
          <span className="bg-amber-600 px-3 py-1 text-sm font-black tracking-wider text-white uppercase rounded-md inline-block">
            ACAIABA
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-4">
            Acessar Conta
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Insira suas credenciais abaixo</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-700 flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">E-mail</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: seu@email.com"
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider block mb-2">Senha</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow transition-all disabled:opacity-50"
          >
            {loading ? "Autenticando..." : "Entrar"}
          </button>
        </form>

        <div className="text-center border-t border-gray-100 dark:border-slate-800 pt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Não tem uma conta?{" "}
            <Link href="/cadastro" className="font-bold text-amber-600 hover:text-amber-500">
              Cadastre-se agora
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
