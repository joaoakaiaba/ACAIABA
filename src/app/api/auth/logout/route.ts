import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { getSessionFromCookies } from "@/server/auth/session";
import { logger } from "@/lib/config/logging";

// Clears the HttpOnly session cookie to log the user out and records an audit
// entry (best-effort, non-blocking) for accountability.
export async function POST() {
  const session = getSessionFromCookies();

  const response = NextResponse.json({ success: true });

  response.cookies.set("acaiaba_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  // Best-effort audit logging; must not block the logout response.
  if (session) {
    prisma.auditLog
      .create({
        data: {
          userId: session.userId,
          action: "LOGOUT",
          entity: "User",
          entityId: session.userId,
          details: { email: session.email, role: session.role },
        },
      })
      .catch((err: unknown) => logger.warn("Failed to record logout audit log", { error: err }));
  }

  logger.info("User logged out");
  return response;
}
