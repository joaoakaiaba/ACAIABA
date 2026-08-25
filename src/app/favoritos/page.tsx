"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import ProductCard from "@/components/ui/ProductCard";

interface FavoriteProduct {
  productId: string;
  name: string;
  slug: string;
  brandName: string;
  price: number;
  promotionalPrice: number | null;
  imageUrl: string | null;
  stock: number;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const { loading: authLoading } = useRequireAuth();
  const { favorites } = useFavorites();
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/favorites", { method: "GET" });
        const data = await res.json();
        if (res.ok) {
          setProducts(data.favorites ?? []);
        } else {
          setError(data?.error?.message || data?.error || "Falha ao carregar favoritos.");
        }
      } catch (e) {
        setError("Erro de conexão ao carregar favoritos.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, user, favorites.length]);

  if (authLoading || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-gray-500 dark:text-gray-400">Carregando favoritos...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-8">Seus Favoritos</h1>

      {loading ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">Carregando seus favoritos...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 py-16 text-center px-4 max-w-2xl mx-auto text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((prod) => (
            <ProductCard
              key={prod.productId}
              id={prod.productId}
              name={prod.name}
              slug={prod.slug}
              brandName={prod.brandName}
              price={prod.price}
              promotionalPrice={prod.promotionalPrice}
              imageUrl={prod.imageUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"}
              stock={prod.stock}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 py-24 text-center px-4 max-w-2xl mx-auto">
          <Heart className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">Sua lista está vazia</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Favorito os melhores tênis, roupas fitness, de cama ou maquiagem para salvar seus itens desejados.
          </p>
          <div className="mt-6">
            <Link
              href="/loja"
              className="inline-flex items-center rounded-lg bg-amber-600 px-6 py-2.5 text-xs font-bold text-white uppercase tracking-wider shadow"
            >
              Explorar Loja
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
