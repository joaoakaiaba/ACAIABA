"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isAdminRole } from "@/lib/auth/roles";

// The user object exposed to the client. Never includes the JWT token or password.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  document?: string;
  newsletter?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the HttpOnly cookie on first load.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { method: "GET" });
      const data = await res.json();
      setUser(data?.user ?? null);
    } catch (err) {
      console.error("Failed to restore session:", err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data?.error || "Falha ao entrar." };
        }

        setUser(data?.user ?? null);
        return { success: true };
      } catch (err) {
        console.error("Login error:", err);
        return { success: false, error: "Erro de conexão. Tente novamente." };
      }
    },
    []
  );

  const register = useCallback(async (input: RegisterInput): Promise<AuthResult> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.error || "Falha ao criar conta." };
      }

      setUser(data?.user ?? null);
      return { success: true };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, error: "Erro de conexão. Tente novamente." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin: isAdminRole(user?.role ?? null),
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
