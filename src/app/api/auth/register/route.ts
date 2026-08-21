import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import * as bcrypt from "bcryptjs";
import { signToken } from "@/server/auth/jwt";
import { z } from "zod";
import { logger } from "@/lib/config/logging";
import { Role, UserStatus } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().min(2, "Nome inválido"),
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
  document: z.string().optional(),
  newsletter: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, phone, document, newsletter } = result.data;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este endereço de e-mail já está sendo utilizado." },
        { status: 409 }
      );
    }

    // Hash password and create in a PostgreSQL transaction
    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      // Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.CUSTOMER,
          status: UserStatus.ACTIVE,
        },
      });

      // Create Customer
      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          phone,
          document,
          newsletter,
        },
      });

      // Create initial Cart
      await tx.cart.create({
        data: {
          customerId: customer.id,
        },
      });

      // Log creation
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "CREATE",
          entity: "User",
          entityId: user.id,
          details: { email: user.email },
        },
      });

      return user;
    });

    // Sign session token
    const token = signToken({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

    // Set secure HttpOnly cookie
    response.cookies.set("acaiaba_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    logger.info(`User registered successfully: ${newUser.email}`, { userId: newUser.id });

    return response;
  } catch (error) {
    logger.error("Registration route handler failed", { error });
    return NextResponse.json(
      { error: "Erro interno no servidor ao criar conta." },
      { status: 500 }
    );
  }
}
