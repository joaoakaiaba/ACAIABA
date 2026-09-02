import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const TOKEN_EXPIRY = "7d"; // Session valid for 7 days

// The signing secret comes ONLY from the environment. A default committed to the
// repository is a credential anyone can read, so there is deliberately no
// fallback here — in any environment. If it is missing the module throws at load
// time instead of silently signing sessions with a predictable key.
const configuredSecret = process.env.JWT_SECRET;

if (!configuredSecret) {
  throw new Error(
    "JWT_SECRET is not defined. Copy .env.example to .env and set a strong value " +
      "(generate one with: openssl rand -base64 48)."
  );
}

// Assigned after the guard so the declared type is a definite `string`; keeping it
// as `process.env.JWT_SECRET` would leave `string | undefined` and break the
// jsonwebtoken overloads inside the functions below.
const JWT_SECRET: string = configuredSecret;

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
