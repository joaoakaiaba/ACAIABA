"use client";

import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

export interface MinimalProductCardProps {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  price: number;
  promotionalPrice: number | null;
  imageUrl: string;
  stock: number;
  variants?: Array<{
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    stock: number;
  }>;
}

// Card editorial monocromático e theme-aware: imagem dominante, tipografia
// pequena, sem radius/sombra. Favorito e adicionar-à-sacola continuam REAIS.
export default function MinimalProductCard({
  id,
  name,
  slug,
  brandName,
  price,
  promotionalPrice,
  imageUrl,
  stock,
  variants = [],
}: MinimalProductCardProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const isFav = isFavorite(id);
  const activePrice = promotionalPrice ?? price;
  const hasDiscount = promotionalPrice !== null && promotionalPrice < price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock > 0) {
      const inStockVariant = variants.find((v) => v.stock > 0) || variants[0];
      addToCart(
        {
          id: inStockVariant?.id || `${id}-default`,
          productId: id,
          name,
          sku: inStockVariant?.sku || `${slug.toUpperCase()}-DEF`,
          price,
          promotionalPrice,
          size: inStockVariant?.size ?? null,
          color: inStockVariant?.color ?? null,
          imageUrl,
        },
        1
      );
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <div className="group relative flex flex-col">
      <Link
        href={`/produto/${slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-surface"
      >
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className={`h-full w-full object-cover object-center transition-transform duration-700 ease-premium group-hover:scale-[1.03] ${
            stock === 0 ? "opacity-50 grayscale" : "grayscale-[35%]"
          }`}
        />

        {/* Favorito — real */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={isFav}
          title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center transition-colors ${
            isFav ? "text-fg" : "text-muted hover:text-fg"
          }`}
        >
          <Heart className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
        </button>

        {stock === 0 && (
          <span className="absolute left-3 top-3 bg-bg/80 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-label text-fg">
            Esgotado
          </span>
        )}

        {/* Quick-add discreto (desktop) — real */}
        {stock > 0 && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-fg py-3 font-display text-[10px] font-black uppercase tracking-label text-bg opacity-0 transition-all duration-300 ease-premium group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 lg:block"
          >
            Adicionar à sacola
          </button>
        )}
      </Link>

      <div className="flex items-start justify-between gap-2 pt-3">
        <div>
          <p className="font-display text-[10px] font-bold uppercase tracking-label text-muted">
            {brandName}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-xs font-bold uppercase tracking-wide text-fg">
            <Link href={`/produto/${slug}`}>{name}</Link>
          </h3>
        </div>
        <p className="shrink-0 text-sm tabular-nums text-muted">
          R$ {activePrice.toFixed(2)}
          {hasDiscount && (
            <span className="ml-1 text-[11px] line-through">
              {price.toFixed(2)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
