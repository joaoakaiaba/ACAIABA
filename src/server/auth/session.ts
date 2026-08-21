import { cookies } from "next/headers";
import { verifyToken, UserSessionPayload } from "./jwt";
import { AppError } from "@/lib/config/errors";
import { Role } from "@prisma/client";

const SESSION_COOKIE_NAME = "acaiaba_session";

export function getSessionFromCookies(): UserSessionPayload | null {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  return verifyToken(sessionCookie.value);
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function requireAuth(): UserSessionPayload {
  const session = getSessionFromCookies();
  if (!session) {
    throw new AppError("AUTHENTICATION", "Sessão expirada ou não autenticada. Por favor, faça login.", 410);
  }
  return session;
}

export function requireRole(allowedRoles: Role[]): UserSessionPayload {
  const session = requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AppError(
      "AUTHORIZATION",
      "Acesso negado. Você não tem permissão para realizar esta ação.",
      403
    );
  }
  return session;
}
