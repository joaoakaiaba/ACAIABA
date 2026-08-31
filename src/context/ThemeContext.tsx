"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = "acaiaba_theme";
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Resolves a mode + system preference into an actual light/dark.
function resolveMode(mode: ThemeMode, systemDark: boolean): "light" | "dark" {
  if (mode === "system") return systemDark ? "dark" : "light";
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe: the first render (server AND client hydration pass) always uses
  // "system", so the initial HTML is deterministic and identical on both sides.
  // The persisted preference is applied after mount, avoiding hydration
  // mismatches on the toggle icon. The no-flash inline script in the layout
  // still paints the correct theme class before hydration (no visual flash).
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Hydrate the persisted mode after mount (client-only).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setModeState(stored);
    }
  }, []);

  const [systemDark, setSystemDark] = useState(false);

  // Track the OS color scheme.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolved = resolveMode(mode, systemDark);

  // Apply the `dark` class to <html> (Tailwind darkMode: class).
  useEffect(() => {
    const root = document.documentElement;
    if (resolved === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [resolved]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch (e) {
      /* ignore storage errors */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
