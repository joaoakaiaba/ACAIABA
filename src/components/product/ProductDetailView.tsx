"use client";

import React, { useState } from "react";
import { Heart, ShoppingCart, Share2, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import ProductCard from "../ui/ProductCard";

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  sku: string;
  price: number | null;
  stock: number;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
}

interface ProductDetailViewProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    detailedDescription: string | null;
    price: number;
    promotionalPrice: number | null;
    brandName: string;
    categoryName: string;
    images: ProductImage[];
    variants: Variant[];
  };
  relatedProducts: Array<{
    id: string;
    name: string;
    slug: string;
    brandName: string;
    price: number;
    promotionalPrice: number | null;
    imageUrl: string;
    stock: number;
  }>;
}

export default function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const [selectedImage, setSelectedImage] = useState(product.images[0]?.url || "");
  const [selectedSize, setSelectedSize] = useState<string | null>(product.variants[0]?.size || null);
  const [selectedColor, setSelectedColor] = useState<string | null>(product.variants[0]?.color || null);
  const [quantity, setQuantity] = useState(1);
  const [isCopied, setIsCopied] = useState(false);

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const isFav = isFavorite(product.id);

  // Find the exact variant based on selected size and color
  const activeVariant = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  ) || product.variants[0];

  const activePrice = activeVariant?.price ? Number(activeVariant.price) : (product.promotionalPrice ?? product.price);
  const hasDiscount = product.promotionalPrice !== null && !activeVariant?.price;
  const originalPrice = product.price;

  const currentStock = activeVariant?.stock ?? 0;

  // Extract unique sizes and colors available
  const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[];

  const handleAddToCart = () => {
    if (currentStock > 0 && activeVariant) {
      addToCart({
        id: activeVariant.id,
        productId: product.id,
        name: product.name,
        sku: activeVariant.sku,
        price: product.price,
        promotionalPrice: product.promotionalPrice,
        size: selectedSize,
        color: selectedColor,
        imageUrl: product.images[0]?.url || "",
      }, quantity);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      
      {/* Product Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm relative">
            <img
              src={selectedImage}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`aspect-square rounded-lg overflow-hidden border bg-gray-50 transition-all ${
                    selectedImage === img.url ? "border-amber-500 ring-2 ring-amber-500/25" : "border-gray-200"
                  }`}
                >
                  <img src={img.url} alt={product.name} className="h-full w-full object-cover object-center" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Purchase options */}
        <div className="space-y-6">
          
          <div>
            <span className="text-sm font-bold text-amber-600 uppercase tracking-widest block">
              {product.brandName}
            </span>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mt-1 leading-tight dark:text-white">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 mt-2 font-mono uppercase">
              SKU: {activeVariant?.sku || "N/A"}
            </p>
          </div>

          {/* Pricing area */}
          <div className="flex items-baseline space-x-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
            <span className="text-3xl font-black text-slate-950 dark:text-white">
              R$ {activePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm font-medium text-gray-400 line-through">
                R$ {originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Variant Selector: Sizes */}
          {sizes.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Tamanho</h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                      selectedSize === sz
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Variant Selector: Colors */}
          {colors.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Cor</h4>
              <div className="flex flex-wrap gap-2">
                {colors.map((col) => (
                  <button
                    key={col}
                    onClick={() => setSelectedColor(col)}
                    className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                      selectedColor === col
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock & Availability badges */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">Disponibilidade:</span>
            {currentStock > 0 ? (
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Em estoque ({currentStock} un)
              </span>
            ) : (
              <span className="text-xs font-extrabold text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Esgotado
              </span>
            )}
          </div>

          {/* Quantity selector & Add to cart actions */}
          <div className="flex flex-col sm:flex-row gap-4 border-t border-b border-gray-100 dark:border-slate-800 py-6">
            {currentStock > 0 && (
              <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg h-12 bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 text-gray-500 dark:text-gray-400 hover:text-amber-600 font-bold"
                >
                  -
                </button>
                <span className="px-4 text-sm font-bold font-mono text-gray-800 dark:text-gray-100">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="px-4 text-gray-500 dark:text-gray-400 hover:text-amber-600 font-bold"
                >
                  +
                </button>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={currentStock === 0}
              className={`flex-grow h-12 flex items-center justify-center space-x-2 rounded-lg font-bold uppercase tracking-wider text-sm shadow transition-all ${
                currentStock > 0
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/10"
                  : "bg-gray-100 text-gray-400 border border-gray-100 cursor-not-allowed"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Adicionar ao carrinho</span>
            </button>

            <button
              onClick={() => toggleFavorite(product.id)}
              className={`h-12 w-12 flex items-center justify-center rounded-lg border shadow-sm transition-all ${
                isFav
                  ? "bg-red-50 border-red-100 text-red-500"
                  : "bg-white border-gray-200 text-gray-500 hover:text-red-500"
              }`}
              title={isFav ? "Favoritado" : "Favoritar"}
            >
              <Heart className={`h-5 w-5 ${isFav ? "fill-red-500" : ""}`} />
            </button>

            <button
              onClick={handleShare}
              className="h-12 w-12 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 hover:text-amber-600 shadow-sm transition-all"
              title="Copiar link"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {isCopied && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-2.5">
              Link copiado para a área de transferência!
            </div>
          )}

          {/* Safe Purchase assurances */}
          <div className="grid grid-cols-3 gap-4 border-b border-gray-100 dark:border-slate-800 pb-6">
            <div className="flex flex-col items-center text-center">
              <Truck className="h-5 w-5 text-amber-600 mb-1" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Entrega Garantida</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <ShieldCheck className="h-5 w-5 text-amber-600 mb-1" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Compra Criptografada</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <RefreshCw className="h-5 w-5 text-amber-600 mb-1" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">30 Dias de Devolução</span>
            </div>
          </div>

          {/* Product Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-slate-800 pb-2">
              Descrição do Produto
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {product.description}
            </p>
            {product.detailedDescription && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
                {product.detailedDescription}
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-gray-100 dark:border-slate-800 pt-16">
          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase sm:text-3xl">
              Produtos Relacionados
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Produtos que você também pode gostar baseados no segmento
            </p>
          </div>
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
