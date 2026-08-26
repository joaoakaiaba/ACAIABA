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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
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
            className="absolute right-0 z-50 mt-2 w-44 rounded-md border border-ink-100 bg-white p-1.5 shadow-card dark:border-white/10 dark:bg-ink-925 dark:shadow-card-dark"
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
                className={`flex w-full items-center gap-2.5 rounded-sm px-3 py-2 font-display text-[11px] font-bold uppercase tracking-label transition-colors ${
                  mode === opt.value
                    ? "bg-ink-950 text-white dark:bg-electric-600"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white"
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
