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
          // Migrate guest favorites (localStorage) to the server before loading,
          // so items favorited while logged out are not lost on login.
          const saved = localStorage.getItem("acaiaba_favorites");
          if (saved) {
            let local: string[] = [];
            try {
              local = JSON.parse(saved);
            } catch (e) {
              console.error("Failed to parse local favorites", e);
            }
            for (const id of Array.isArray(local) ? local : []) {
              if (typeof id !== "string" || !id) continue;
              const sync = await fetch(`/api/favorites/${id}`, { method: "POST" });
              if (!sync.ok) {
                console.error(`Failed to sync guest favorite ${id}: HTTP ${sync.status}`);
              }
            }
            localStorage.removeItem("acaiaba_favorites");
          }

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
          const res = isFav
            ? await fetch(`/api/favorites/${productId}`, { method: "DELETE" })
            : await fetch(`/api/favorites/${productId}`, { method: "POST" });
          if (!res.ok) {
            // Non-OK HTTP responses do not throw: revert the optimistic update
            // so the UI never shows a favorite the server did not persist.
            setFavorites(favorites);
            console.error(`Failed to toggle favorite ${productId}: HTTP ${res.status}`);
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
