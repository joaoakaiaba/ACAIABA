import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import * as bcrypt from "bcryptjs";
import { signToken } from "@/server/auth/jwt";
import { setSessionCookie } from "@/server/auth/session";
import { z } from "zod";
import { logger } from "@/lib/config/logging";
import { isActiveStatus } from "@/lib/auth/authorize";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn(`Login failed: User not found for email ${email}`);
      return NextResponse.json(
        { error: "Credenciais inválidas. Verifique seu e-mail e senha." },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordCorrect = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordCorrect) {
      logger.warn(`Login failed: Incorrect password for email ${email}`);
      return NextResponse.json(
        { error: "Credenciais inválidas. Verifique seu e-mail e senha." },
        { status: 401 }
      );
    }

    // Reject accounts that are not ACTIVE (SUSPENDED / INACTIVE / PENDING).
    if (!isActiveStatus(user.status)) {
      logger.warn(`Login blocked: account not active for email ${email} (status=${user.status})`);
      return NextResponse.json(
        { error: "Seu acesso está bloqueado. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    // Sign session token
    const token = signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Set secure cookie - we must run it in a server context, NextResponse allows returning headers
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set the cookie securely
    response.cookies.set("acaiaba_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Record the login timestamp on the user
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        details: { email: user.email, role: user.role },
      },
    });

    logger.info(`User logged in successfully: ${user.email}`, { userId: user.id });

    return response;
  } catch (error) {
    logger.error("Authentication route handler failed", { error });
    return NextResponse.json(
      { error: "Erro interno no servidor de autenticação." },
      { status: 500 }
    );
  }
}
