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
    "relative flex h-10 w-10 items-center justify-center text-fg transition-colors hover:text-muted";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line/15 bg-bg/90 text-fg backdrop-blur-md">
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
          className="font-display text-lg font-black uppercase tracking-[0.35em] text-fg transition-colors hover:text-muted lg:text-xl"
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
              className="group relative font-display text-[11px] font-bold uppercase tracking-label text-muted transition-colors hover:text-fg"
            >
              {link.name}
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 left-0 h-px w-0 bg-fg transition-all duration-300 group-hover:w-full"
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
              className="w-40 border-b border-line/25 bg-transparent py-2 pl-8 pr-2 text-sm text-fg placeholder-muted outline-none transition-all focus:w-56 focus:border-fg"
            />
            <Search className="pointer-events-none absolute left-0 top-2.5 h-4 w-4 text-muted" />
          </form>

          <ThemeToggle className="text-fg hover:text-muted" />

          <Link
            href="/favoritos"
            className={iconBtn}
            title="Favoritos"
            aria-label={`Favoritos (${favoritesCount})`}
          >
            <Heart className="h-5 w-5" />
            {favoritesCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-fg px-1 text-[9px] font-black text-bg">
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
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-fg px-1 text-[9px] font-black text-bg">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href={isAdmin ? "/admin" : "/conta"}
                className="ml-1 hidden h-10 items-center gap-2 border border-line/25 px-3 font-display text-[10px] font-bold uppercase tracking-label text-fg transition-colors hover:border-fg sm:flex"
                title="Minha Conta"
              >
                <span className="flex h-5 w-5 items-center justify-center bg-fg font-display text-[9px] font-black text-bg">
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
        <div className="border-t border-line/15 bg-bg px-4 pb-10 pt-6 lg:hidden">
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
              className="w-full border-b border-line/25 bg-transparent py-3 pl-8 pr-2 text-base text-fg placeholder-muted outline-none focus:border-fg"
            />
            <Search className="pointer-events-none absolute left-0 top-3.5 h-4 w-4 text-muted" />
          </form>

          <nav className="mt-8 flex flex-col" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="border-b border-line/15 py-4 font-display text-2xl font-black uppercase tracking-tight text-fg transition-colors hover:text-muted"
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
                  className="border border-line/25 px-5 py-3 font-display text-[11px] font-bold uppercase tracking-label text-fg"
                >
                  Minha conta
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-label text-muted"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="border border-line/25 px-5 py-3 font-display text-[11px] font-bold uppercase tracking-label text-fg"
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
