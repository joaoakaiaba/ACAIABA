import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";

export async function GET() {
  try {
    // Perform a fast query to verify database liveness
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
