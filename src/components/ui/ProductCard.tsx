"use client";

import React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";

export interface ProductVariantSummary {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  stock: number;
}

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  price: number;
  promotionalPrice: number | null;
  imageUrl: string;
  stock: number;
  isFeatured?: boolean;
  tags?: string[];
  variants?: ProductVariantSummary[];
}

export default function ProductCard({
  id,
  name,
  slug,
  brandName,
  price,
  promotionalPrice,
  imageUrl,
  stock,
  isFeatured = false,
  tags = [],
  variants = [],
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const isFav = isFavorite(id);
  const activePrice = promotionalPrice ?? price;
  const hasDiscount = promotionalPrice !== null && promotionalPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - promotionalPrice!) / price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock > 0) {
      // Use a real product variant (with a real variant id) so the checkout
      // can create a genuine order against the database.
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

  // Stock indicator (subtle dot + text, premium not loud).
  let stockIndicator: React.ReactNode;
  if (stock === 0) {
    stockIndicator = (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-500">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
        Esgotado
      </span>
    );
  } else if (stock <= 5) {
    stockIndicator = (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-500">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        Últimas unidades
      </span>
    );
  } else {
    stockIndicator = (
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-400 dark:text-ink-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Em estoque
      </span>
    );
  }

  return (
    <div className="group relative flex flex-col">
      {/* Image — editorial 4:5, hairline frame, zoom contido */}
      <Link
        href={`/produto/${slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-card border border-ink-100 bg-ink-50 dark:border-white/10 dark:bg-ink-925"
      >
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className={`h-full w-full object-cover object-center transition-transform duration-700 ease-premium group-hover:scale-[1.04] ${
            stock === 0 ? "opacity-60 grayscale" : ""
          }`}
        />

        {/* Favorite — sempre visível e tocável */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={isFav}
          title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-all duration-300 active:scale-90 ${
            isFav
              ? "border-electric-500/40 bg-electric-600 text-white"
              : "border-white/10 bg-ink-950/40 text-white hover:bg-electric-600"
          }`}
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        </button>

        {/* Badges mínimos, canto superior esquerdo */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {hasDiscount && (
            <span className="rounded-sm bg-electric-600 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-label text-white">
              -{discountPercentage}%
            </span>
          )}
          {isFeatured && (
            <span className="rounded-sm bg-ink-950/70 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-label text-white backdrop-blur">
              Destaque
            </span>
          )}
          {tags.slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="rounded-sm bg-white/85 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-label text-ink-900 backdrop-blur dark:bg-ink-950/70 dark:text-white"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Quick-add no hover (desktop), sem roubar o clique do card */}
        {stock > 0 && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-2 rounded-md bg-white/95 py-2.5 font-display text-[11px] font-bold uppercase tracking-label text-ink-950 opacity-0 backdrop-blur transition-all duration-300 ease-premium hover:bg-electric-600 hover:text-white group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 lg:block"
          >
            Adicionar à sacola
          </button>
        )}
      </Link>

      {/* Meta */}
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="eyebrow !text-electric-600 dark:!text-electric-400">
            {brandName}
          </span>
          {stockIndicator}
        </div>

        <h3 className="mt-1.5 line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug text-ink-900 transition-colors group-hover:text-electric-600 dark:text-ink-100 dark:group-hover:text-electric-400">
          <Link href={`/produto/${slug}`}>{name}</Link>
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-base font-bold tabular-nums text-ink-950 dark:text-white">
            R$ {activePrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs tabular-nums text-ink-400 line-through dark:text-ink-500">
              R$ {price.toFixed(2)}
            </span>
          )}
        </div>

        {/* CTA principal (mobile / toque) */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={stock === 0}
          className={`mt-4 w-full rounded-md border py-2.5 font-display text-[11px] font-bold uppercase tracking-label transition-all duration-300 lg:hidden ${
            stock > 0
              ? "border-ink-950 bg-ink-950 text-white active:scale-[0.98] dark:border-white dark:bg-white dark:text-ink-950"
              : "cursor-not-allowed border-ink-200 text-ink-400 dark:border-white/10 dark:text-ink-500"
          }`}
        >
          {stock > 0 ? "Comprar agora" : "Esgotado"}
        </button>
      </div>
    </div>
  );
}
