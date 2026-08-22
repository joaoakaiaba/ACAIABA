import { redirect } from "next/navigation";
import { getActiveSession, type ActiveSession } from "./session";
import { canAccessAdmin } from "@/lib/auth/authorize";

// Server-side guards for protected server components (e.g. admin area).
// They verify the session against the database (user exists + status ACTIVE)
// and authorize based on the CURRENT database role, not a stale token role.

export async function requireAuthenticated(): Promise<ActiveSession> {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin(): Promise<ActiveSession> {
  const session = await getActiveSession();
  if (!session) {
    redirect("/login");
  }
  if (!canAccessAdmin(session.role, session.status)) {
    redirect("/");
  }
  return session;
}
