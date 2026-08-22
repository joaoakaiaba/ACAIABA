import { NextResponse } from "next/server";
import { getActiveSession } from "@/server/auth/session";

// Returns the currently authenticated user (without exposing the JWT / password).
// The session is verified against the database (user exists + status ACTIVE),
// so suspended/inactive accounts are treated as unauthenticated.
export async function GET() {
  const session = await getActiveSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  });
}
