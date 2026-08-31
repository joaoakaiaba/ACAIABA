"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type AuthUser } from "@/context/AuthContext";

interface UseRequireAuthResult {
  user: AuthUser | null;
  loading: boolean;
}

// Client-side guard for protected client components.
// Redirects to /login when the session finishes loading and no user is authenticated.
export function useRequireAuth(): UseRequireAuthResult {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return { user, loading };
}
