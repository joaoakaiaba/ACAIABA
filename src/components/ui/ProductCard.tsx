"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
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
  variants = []
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
      addToCart({
        id: inStockVariant?.id || `${id}-default`,
        productId: id,
        name,
        sku: inStockVariant?.sku || `${slug.toUpperCase()}-DEF`,
        price,
        promotionalPrice,
        size: inStockVariant?.size ?? null,
        color: inStockVariant?.color ?? null,
        imageUrl,
      }, 1);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  // Stock badge definition
  let stockBadge = (
    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
      Em estoque
    </span>
  );
  if (stock === 0) {
    stockBadge = (
      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
        Esgotado
      </span>
    );
  } else if (stock <= 5) {
    stockBadge = (
      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
        Últimas unidades
      </span>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700 bg-white shadow-sm hover:shadow-md transition-all dark:bg-slate-900 dark:hover:shadow-slate-900/40">
      
      {/* Product Image section */}
      <Link href={`/produto/${slug}`} className="relative block aspect-square bg-gray-50 dark:bg-slate-800 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Favorite toggle absolute button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow hover:scale-110 active:scale-95 transition-all text-gray-500 dark:text-gray-400 hover:text-red-500"
          title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Heart className={`h-4.5 w-4.5 transition-colors ${isFav ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Promotional and tags badges */}
        <div className="absolute left-3 top-3 flex flex-col space-y-1">
          {hasDiscount && (
            <span className="rounded bg-red-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-sm">
              -{discountPercentage}%
            </span>
          )}
          {isFeatured && (
            <span className="rounded bg-amber-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-sm">
              Destaque
            </span>
          )}
          {tags.slice(0, 2).map(tag => (
            <span key={tag} className="rounded bg-gray-900/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </Link>

      {/* Details section */}
      <div className="flex flex-col flex-1 p-4">
        <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">
          {brandName}
        </span>
        <h3 className="mt-1 text-sm font-semibold text-gray-800 hover:text-amber-600 line-clamp-2 min-h-[40px] dark:text-gray-100">
          <Link href={`/produto/${slug}`}>{name}</Link>
        </h3>

        {/* Stock details */}
        <div className="mt-2 flex items-center justify-between">
          {stockBadge}
        </div>

        {/* Price section */}
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-lg font-extrabold text-gray-950 dark:text-white">
            R$ {activePrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs font-medium text-gray-400 line-through">
              R$ {price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to cart quick button */}
        <button
          onClick={handleAddToCart}
          disabled={stock === 0}
          className={`mt-4 w-full flex items-center justify-center space-x-2 rounded-lg py-2.5 text-sm font-semibold transition-all border ${
            stock > 0
              ? "bg-amber-600 hover:bg-amber-500 text-white border-transparent"
              : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{stock > 0 ? "Comprar Agora" : "Esgotado"}</span>
        </button>
      </div>

    </div>
  );
}
