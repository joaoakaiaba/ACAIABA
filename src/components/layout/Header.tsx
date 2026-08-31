"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, User, Heart, ShoppingBag, Menu, X, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const { cartItems } = useCart();
  const { favorites } = useFavorites();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const favoritesCount = favorites.length;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/loja?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: "Shop", href: "/loja" },
    { name: "Promoções", href: "/loja?sort=discount_desc" },
    { name: "Contato", href: "/contato" },
  ];

  const iconBtn =
    "relative flex h-10 w-10 items-center justify-center text-noir-50 transition-colors hover:text-white";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-noir-950/90 text-noir-50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`${iconBtn} lg:hidden`}
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Wordmark — somente a marca */}
        <Link
          href="/"
          className="font-display text-lg font-black uppercase tracking-[0.35em] text-noir-50 transition-colors hover:text-white lg:text-xl"
          aria-label="ACAIABA — página inicial"
        >
          Acaiaba
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group relative font-display text-[11px] font-bold uppercase tracking-label text-noir-500 transition-colors hover:text-noir-50"
            >
              {link.name}
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-px w-0 bg-noir-50 transition-all duration-300 group-hover:w-full"
              />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block" role="search">
            <label htmlFor="header-search" className="sr-only">
              Buscar produtos
            </label>
            <input
              id="header-search"
              type="search"
              placeholder="Buscar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 border-b border-white/20 bg-transparent py-2 pl-8 pr-2 text-sm text-noir-50 placeholder-noir-500 outline-none transition-all focus:w-56 focus:border-noir-50"
            />
            <Search className="pointer-events-none absolute left-0 top-2.5 h-4 w-4 text-noir-500" />
          </form>

          <ThemeToggle className="text-noir-50 hover:text-white" />

          <Link
            href="/favoritos"
            className={iconBtn}
            title="Favoritos"
            aria-label={`Favoritos (${favoritesCount})`}
          >
            <Heart className="h-5 w-5" />
            {favoritesCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-noir-50 px-1 text-[9px] font-black text-noir-950">
                {favoritesCount}
              </span>
            )}
          </Link>

          <Link
            href="/carrinho"
            className={iconBtn}
            title="Carrinho"
            aria-label={`Carrinho (${cartCount} itens)`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-noir-50 px-1 text-[9px] font-black text-noir-950">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href={isAdmin ? "/admin" : "/conta"}
                className="ml-1 hidden h-10 items-center gap-2 border border-white/20 px-3 font-display text-[10px] font-bold uppercase tracking-label text-noir-50 transition-colors hover:border-noir-50 hover:text-white sm:flex"
                title="Minha Conta"
              >
                <span className="flex h-5 w-5 items-center justify-center bg-noir-50 font-display text-[9px] font-black text-noir-950">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </span>
                <span className="max-w-[90px] truncate">{user?.name?.split(" ")[0] || "Conta"}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={iconBtn}
                title="Sair"
                aria-label="Sair da conta"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link href="/login" className={iconBtn} title="Entrar" aria-label="Entrar na conta">
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {isMenuOpen && (
        <div className="border-t border-white/10 bg-noir-950 px-4 pb-10 pt-6 lg:hidden">
          <form onSubmit={handleSearch} className="relative w-full" role="search">
            <label htmlFor="header-search-mobile" className="sr-only">
              Buscar produtos
            </label>
            <input
              id="header-search-mobile"
              type="search"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-b border-white/20 bg-transparent py-3 pl-8 pr-2 text-base text-noir-50 placeholder-noir-500 outline-none focus:border-noir-50"
            />
            <Search className="pointer-events-none absolute left-0 top-3.5 h-4 w-4 text-noir-500" />
          </form>

          <nav className="mt-8 flex flex-col" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="border-b border-white/10 py-4 font-display text-2xl font-black uppercase tracking-tight text-noir-50 transition-colors hover:text-white"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="mt-8 flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  href={isAdmin ? "/admin" : "/conta"}
                  onClick={() => setIsMenuOpen(false)}
                  className="border border-white/20 px-5 py-3 font-display text-[11px] font-bold uppercase tracking-label text-noir-50"
                >
                  Minha conta
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-label text-noir-500"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="border border-white/20 px-5 py-3 font-display text-[11px] font-bold uppercase tracking-label text-noir-50"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
