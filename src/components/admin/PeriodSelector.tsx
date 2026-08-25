"use client";

import React from "react";
import { useRouter } from "next/navigation";

const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
];

// Updates the ?period= query param for the dashboard (server re-renders).
export default function PeriodSelector({ current }: { current: string }) {
  const router = useRouter();
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => router.replace(`/admin?period=${p.value}`)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
            current === p.value ? "bg-amber-600 text-white shadow" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
