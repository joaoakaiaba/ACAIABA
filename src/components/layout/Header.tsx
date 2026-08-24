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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-slate-700 bg-white shadow-sm dark:bg-slate-900 dark:shadow-slate-900/40">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Abrir menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="bg-amber-600 px-3 py-1 text-xl font-black tracking-wider text-white uppercase rounded-md shadow-sm">
            ACAIABA
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-amber-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Search, Favorites, Cart, Theme & User Profile Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Desktop Search bar */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input
              type="search"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-2 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </form>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Favorites link */}
          <Link
            href="/favoritos"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all"
            title="Favoritos"
          >
            <Heart className="h-5 w-5" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                {favoritesCount}
              </span>
            )}
          </Link>

          {/* Cart link */}
          <Link
            href="/carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all"
            title="Carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account / user area */}
          {isAuthenticated ? (
            <>
              <Link
                href={isAdmin ? "/admin" : "/conta"}
                className="flex h-10 items-center gap-2 rounded-full bg-amber-50 border border-amber-100 px-2.5 sm:px-3 text-gray-800 dark:text-gray-100 hover:bg-amber-100 transition-all"
                title="Minha Conta"
              >
                <span className="h-6 w-6 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </span>
                <span className="hidden sm:inline text-xs font-bold max-w-[90px] truncate">
                  {user?.name?.split(" ")[0] || "Conta"}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 transition-all"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all"
              title="Entrar"
            >
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search & navigation overlay */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="search"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900"
            />
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          </form>

          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-gray-800 dark:text-gray-100 hover:text-amber-600 py-1"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
