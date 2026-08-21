import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "../../src/server/auth/jwt";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

describe("Authentication & Security", () => {
  it("should hash a password and verify it correctly", () => {
    const password = "my_secure_password_2026";
    const hash = bcrypt.hashSync(password, 10);

    expect(bcrypt.compareSync(password, hash)).toBe(true);
    expect(bcrypt.compareSync("wrong_password", hash)).toBe(false);
  });

  it("should sign a JWT token and verify it correctly", () => {
    const payload = {
      userId: "user-123",
      name: "Fulano de Tal",
      email: "fulano@acaiaba.com",
      role: Role.CUSTOMER,
    };

    const token = signToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.role).toBe(payload.role);
    expect(decoded?.email).toBe(payload.email);
  });
});
