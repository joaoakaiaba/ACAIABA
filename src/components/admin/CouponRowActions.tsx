"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Trash2 } from "lucide-react";

interface CouponRowActionsProps {
  couponId: string;
  active: boolean;
}

export default function CouponRowActions({ couponId, active }: CouponRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async () => {
    setLoading(true);
    try {
      await fetch(`/api/admin/coupons/${couponId}`, { method: "DELETE" });
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
        onClick={toggle}
        disabled={loading}
        title={active ? "Desativar" : "Ativar"}
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
      >
        <Power className="h-4 w-4" />
      </button>
      <button
        onClick={deactivate}
        disabled={loading}
        title="Desativar (soft delete)"
        className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-red-100 bg-white dark:bg-slate-900 hover:bg-red-50 text-red-500 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
