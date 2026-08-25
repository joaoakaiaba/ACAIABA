"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Archive } from "lucide-react";

interface ProductRowActionsProps {
  productId: string;
  active: boolean;
}

// Toggle activate/deactivate and archive (soft) a product from the admin list.
// The actual authorization and persistence happen on the server.
export default function ProductRowActions({ productId, active }: ProductRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const setActive = async (value: boolean) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: value }),
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={() => setActive(!active)}
        disabled={loading}
        title={active ? "Desativar" : "Ativar"}
        className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
      >
        <Power className="h-4 w-4" />
      </button>
      <button
        onClick={() => setActive(false)}
        disabled={loading}
        title="Arquivar (desativar)"
        className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-100 bg-white dark:bg-slate-900 hover:bg-red-50 text-red-500 disabled:opacity-50"
      >
        <Archive className="h-4 w-4" />
      </button>
    </div>
  );
}
