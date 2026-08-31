import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const TOKEN_EXPIRY = "7d"; // Session valid for 7 days

// In production a strong JWT_SECRET is mandatory. The hardcoded fallback exists
// only to keep local development convenient and must never be used in production.
const FALLBACK_SECRET = "acaiaba_fallback_secret_key_2026";

const configuredSecret = process.env.JWT_SECRET;

if (!configuredSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be defined in environment variables for production.");
  }
}

const JWT_SECRET = configuredSecret || FALLBACK_SECRET;

export interface UserSessionPayload {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export function signToken(payload: UserSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSessionPayload;
  } catch (error) {
    return null;
  }
}
