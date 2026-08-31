// Pure, DB-free helpers for checkout idempotency.
//
// The idempotency key is a stable token that identifies a single logical
// checkout. Repeating the same key MUST produce the same order (no duplicates),
// and the same key with a DIFFERENT payload is an error. Keys are generated
// client-side (per checkout session) and validated here.

// A valid idempotency key: 8-64 chars, alphanumeric + dash/underscore.
const KEY_RE = /^[a-zA-Z0-9_-]{8,64}$/;

export function isValidIdempotencyKey(key: string | null | undefined): boolean {
  return typeof key === "string" && KEY_RE.test(key);
}

export type IdempotencyCheck =
  | { kind: "new" } // no existing order for this key -> proceed to create
  | { kind: "replay"; orderNumber: string }; // existing order -> return it

// Given the existing order (or null) for a key, decide whether this is a new
// checkout or a replay. This drives the idempotent create-or-return behavior.
export function classifyIdempotency(
  existingOrderNumber: string | null,
  key: string | null | undefined
): IdempotencyCheck {
  if (!isValidIdempotencyKey(key)) {
    // No usable key -> cannot guarantee idempotency. Callers must decide to
    // reject or proceed (by default, reject to avoid duplicate orders).
    return { kind: "new" };
  }
  if (existingOrderNumber) {
    return { kind: "replay", orderNumber: existingOrderNumber };
  }
  return { kind: "new" };
}
