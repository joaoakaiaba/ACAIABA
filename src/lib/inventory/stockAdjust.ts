// Pure, DB-free helpers for the administrative stock adjustment feature.
// These mirror the validation rules enforced in the PATCH /api/admin/inventory/[sku]
// route so they can be unit-tested anywhere.

// A valid quantity for an inventory adjustment must be a non-negative integer.
export function isValidQuantity(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

// A valid minStock must be a non-negative integer.
export function isValidMinStock(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

// The available stock (quantity - reserved) must never become negative after an
// adjustment. Returns true when the new quantity is acceptable.
export function canAdjustQuantity(quantity: number, reserved: number): boolean {
  return quantity >= reserved;
}
