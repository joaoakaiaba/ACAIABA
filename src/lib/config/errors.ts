export type ErrorType =
  | "VALIDATION"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS"
  | "INFRASTRUCTURE";

export class AppError extends Error {
  public type: ErrorType;
  public status: number;
  public details?: Record<string, any>;

  constructor(type: ErrorType, message: string, status: number = 400, details?: Record<string, any>) {
    super(message);
    this.type = type;
    this.status = status;
    this.details = details;
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public toJSON() {
    return {
      error: {
        type: this.type,
        message: this.message,
        status: this.status,
        details: this.details,
      },
    };
  }
}

export function handleServerException(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(error.toJSON(), { status: error.status });
  }

  // Generic/Internal errors are sanitized to avoid leaking sensitive stack traces
  console.error("Internal Server Error:", error);
  return Response.json(
    {
      error: {
        type: "INFRASTRUCTURE",
        message: "Ocorreu um erro interno de servidor. Por favor, tente novamente mais tarde.",
        status: 500,
      },
    },
    { status: 500 }
  );
}
