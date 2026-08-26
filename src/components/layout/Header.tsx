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
    { name: "Início", href: "/" },
    { name: "Loja Complete", href: "/loja" },
    { name: "Calçados", href: "/loja?categoria=calcados" },
    { name: "Fitness", href: "/loja?categoria=fitness" },
    { name: "Moda", href: "/loja?categoria=moda" },
    { name: "Casa & Enxoval", href: "/loja?categoria=casa-enxoval" },
    { name: "Beleza", href: "/loja?categoria=beleza-cuidados" },
  ];

  const iconBtn =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition-colors hover:text-ink-950 dark:text-ink-300 dark:hover:text-white";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-ink-100 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-ink-950/85">
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

        {/* Wordmark — presença de marca */}
        <Link href="/" className="group flex flex-col leading-none" aria-label="ACAIABA — página inicial">
          <span className="font-display text-lg font-black uppercase tracking-brand text-ink-950 transition-colors group-hover:text-electric-600 dark:text-white dark:group-hover:text-electric-400 lg:text-xl">
            Acaiaba
          </span>
          <span className="mt-1 flex items-center gap-1.5">
            <span className="h-px w-4 bg-electric-600" aria-hidden="true" />
            <span className="font-display text-[9px] font-bold uppercase tracking-brand text-ink-400 dark:text-ink-300">
              Eletric
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="relative font-display text-[11px] font-bold uppercase tracking-label text-ink-500 transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-electric-600 after:transition-all after:duration-300 hover:text-ink-950 hover:after:w-full dark:text-ink-300 dark:hover:text-white dark:after:bg-electric-400"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block" role="search">
            <input
              type="search"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar produtos"
              className="w-56 rounded-full border border-ink-200 bg-transparent py-2 pl-10 pr-4 text-sm text-ink-900 placeholder-ink-400 outline-none transition-all focus:border-electric-500 focus:w-64 dark:border-white/15 dark:text-ink-100 dark:placeholder-ink-500 dark:focus:border-electric-400"
            />
            <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-ink-400" />
          </form>

          <ThemeToggle />

          <Link href="/favoritos" className={iconBtn} title="Favoritos" aria-label={`Favoritos (${favoritesCount})`}>
            <Heart className="h-5 w-5" />
            {favoritesCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-electric-600 px-1 text-[10px] font-bold text-white">
                {favoritesCount}
              </span>
            )}
          </Link>

          <Link href="/carrinho" className={iconBtn} title="Carrinho" aria-label={`Carrinho (${cartCount} itens)`}>
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-electric-600 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href={isAdmin ? "/admin" : "/conta"}
                className="ml-1 hidden h-10 items-center gap-2 rounded-full border border-ink-200 px-3 text-xs font-bold text-ink-800 transition-colors hover:border-electric-500 hover:text-electric-600 dark:border-white/15 dark:text-ink-100 dark:hover:border-electric-400 dark:hover:text-electric-400 sm:flex"
                title="Minha Conta"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric-600 font-display text-[10px] font-black text-white">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </span>
                <span className="max-w-[90px] truncate">{user?.name?.split(" ")[0] || "Conta"}</span>
              </Link>
              <button type="button" onClick={handleLogout} className={iconBtn} title="Sair" aria-label="Sair da conta">
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

      {/* Mobile overlay: busca + navegação editorial */}
      {isMenuOpen && (
        <div className="border-t border-ink-100 bg-white px-4 pb-8 pt-4 dark:border-white/10 dark:bg-ink-950 lg:hidden">
          <form onSubmit={handleSearch} className="relative w-full" role="search">
            <input
              type="search"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar produtos"
              className="w-full rounded-full border border-ink-200 bg-transparent py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder-ink-400 outline-none focus:border-electric-500 dark:border-white/15 dark:text-ink-100 dark:placeholder-ink-500"
            />
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
          </form>

          <nav className="mt-6 flex flex-col" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="border-b border-ink-100 py-3.5 font-display text-sm font-bold uppercase tracking-label text-ink-800 transition-colors hover:text-electric-600 dark:border-white/10 dark:text-ink-100 dark:hover:text-electric-400"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {isAuthenticated && (
            <div className="mt-6 flex items-center gap-3">
              <Link
                href={isAdmin ? "/admin" : "/conta"}
                onClick={() => setIsMenuOpen(false)}
                className="btn-outline !px-5 !py-2.5"
              >
                Minha conta
              </Link>
              <button type="button" onClick={handleLogout} className="btn-ghost">
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
