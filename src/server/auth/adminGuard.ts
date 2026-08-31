import { getActiveSession, type ActiveSession } from "./session";
import { canAccessAdmin } from "@/lib/auth/authorize";
import { AppError } from "@/lib/config/errors";

// Server-side admin authorization for API route handlers.
// Unlike the page guard (which redirects), this throws an AppError so the route
// can respond with a proper JSON error via handleServerException.
export async function requireAdminApi(): Promise<ActiveSession> {
  const session = await getActiveSession();
  if (!session) {
    throw new AppError("AUTHENTICATION", "Não autenticado. Faça login para continuar.", 401);
  }
  if (!canAccessAdmin(session.role, session.status)) {
    throw new AppError("AUTHORIZATION", "Acesso negado. Permissão administrativa necessária.", 403);
  }
  return session;
}
