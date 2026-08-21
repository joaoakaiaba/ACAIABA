export type LogLevel = "info" | "warn" | "error" | "audit";

export interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  userId?: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, any>;
}

export const logger = {
  log(level: LogLevel, message: string, details?: Record<string, any>, userId?: string) {
    // Prevent logging sensitive fields (passwords, tokens, keys)
    const sanitizedDetails = details ? this.sanitize(details) : undefined;

    const payload: LogPayload = {
      message,
      level,
      timestamp: new Date().toISOString(),
      userId,
      details: sanitizedDetails,
    };

    if (level === "error") {
      console.error(JSON.stringify(payload));
    } else if (level === "warn") {
      console.warn(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  },

  info(message: string, details?: Record<string, any>, userId?: string) {
    this.log("info", message, details, userId);
  },

  warn(message: string, details?: Record<string, any>, userId?: string) {
    this.log("warn", message, details, userId);
  },

  error(message: string, details?: Record<string, any>, userId?: string) {
    this.log("error", message, details, userId);
  },

  audit(message: string, action: string, entity: string, entityId?: string, userId?: string, details?: Record<string, any>) {
    const payload = {
      message,
      level: "audit" as LogLevel,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      userId,
      details: details ? this.sanitize(details) : undefined,
    };
    console.log(JSON.stringify(payload));
    
    // We will save audit logs asynchronously to the database when possible, but won't block execution
  },

  sanitize(obj: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ["password", "passwordHash", "token", "secret", "apiKey", "privateKey", "cvv", "cardBrand", "last4", "creditCard"];
    const clone = { ...obj };
    for (const key in clone) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        clone[key] = "[REDACTED]";
      } else if (typeof clone[key] === "object" && clone[key] !== null) {
        clone[key] = this.sanitize(clone[key]);
      }
    }
    return clone;
  }
};
