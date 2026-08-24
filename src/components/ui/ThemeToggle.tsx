"use client";

import React, { useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";

const OPTIONS: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
  { value: "light", label: "Claro", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Escuro", icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "Sistema", icon: <Monitor className="h-4 w-4" /> },
];

// Theme toggle button that cycles light → dark → system with an accessible popover.
// Renders a clearly-visible icon (sun in light, moon in dark, monitor in system)
// with proper contrast in both themes and a tooltip for accessibility.
export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);

  const label = mode === "dark" ? "Modo escuro" : mode === "light" ? "Modo claro" : "Sistema";
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-yellow-300 dark:hover:bg-slate-700"
        title={`Tema: ${label} — clique para alterar`}
        aria-label="Alternar tema"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-lg"
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={mode === opt.value}
                onClick={() => {
                  setMode(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === opt.value
                    ? "bg-amber-600 text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
