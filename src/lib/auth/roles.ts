// Central definition of administrative roles for the ACAIABA RBAC system.
// Any role other than CUSTOMER is considered able to access the admin area.
export const ADMIN_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
  "MANAGER",
  "STOCK_MANAGER",
  "SUPPORT",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return (ADMIN_ROLES as readonly string[]).includes(role);
}
