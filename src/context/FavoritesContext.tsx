"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface FavoritesContextType {
  favorites: string[]; // Product IDs
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!user;

  useEffect(() => {
    if (authLoading) return;

    if (isAuthed) {
      (async () => {
        try {
          const res = await fetch("/api/favorites", { method: "GET" });
          const data = await res.json();
          if (res.ok && data?.favorites) {
            setFavorites(data.favorites.map((f: any) => f.productId));
          }
        } catch (e) {
          console.error("Failed to load favorites", e);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      const saved = localStorage.getItem("acaiaba_favorites");
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
  }, [isAuthed, authLoading]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      const isFav = favorites.includes(productId);

      // Optimistic UI update.
      const next = isFav ? favorites.filter((id) => id !== productId) : [...favorites, productId];
      setFavorites(next);

      if (isAuthed) {
        try {
          if (isFav) {
            await fetch(`/api/favorites/${productId}`, { method: "DELETE" });
          } else {
            await fetch(`/api/favorites/${productId}`, { method: "POST" });
          }
        } catch (e) {
          // Revert on failure.
          setFavorites(favorites);
          console.error("Failed to toggle favorite", e);
        }
      } else {
        localStorage.setItem("acaiaba_favorites", JSON.stringify(next));
      }
    },
    [favorites, isAuthed]
  );

  const isFavorite = (productId: string) => favorites.includes(productId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within FavoritesProvider");
  return context;
}
