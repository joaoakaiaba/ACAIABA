import { isAdminRole } from "./roles";

// Pure, DB-free authorization decisions so they can be unit-tested anywhere.
// Mirrors the UserStatus enum values used by Prisma without importing the client.

export type UserStatusValue = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

// Only active accounts are allowed to use protected areas / perform protected actions.
export function isActiveStatus(status: string | null | undefined): boolean {
  return status === "ACTIVE";
}

// A user may access authenticated areas (e.g. /conta, /pedidos, checkout)
// only while their account status is ACTIVE.
export function canAccessProtectedArea(
  status: string | null | undefined
): boolean {
  return isActiveStatus(status);
}

// A user may access the administrative area only when their account is ACTIVE
// AND their role is one of the administrative roles.
export function canAccessAdmin(
  role: string | null | undefined,
  status: string | null | undefined
): boolean {
  return isActiveStatus(status) && isAdminRole(role);
}
