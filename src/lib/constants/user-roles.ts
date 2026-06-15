export const DEFAULT_USER_ROLE = "customer" as const;

export const ALLOWED_USER_ROLES = ["customer", "admin"] as const;

export type AllowedUserRole = (typeof ALLOWED_USER_ROLES)[number];

const ALLOWED_ROLE_SET = new Set<string>(ALLOWED_USER_ROLES);

/**
 * Keeps only known roles; falls back to `customer` when the list is empty.
 */
export function normalizeUserRoles(roles: string[]): string[] {
  const deduped = [...new Set(roles.filter((role) => ALLOWED_ROLE_SET.has(role)))];
  return deduped.length > 0 ? deduped : [DEFAULT_USER_ROLE];
}

/**
 * Sanitizes admin-provided role updates. Unknown values are dropped.
 */
export function sanitizeUserRoles(roles: string[]): string[] {
  return normalizeUserRoles(roles);
}
