import { db } from "@white-shop/db";

type AuthEpochPayload = {
  authEpoch?: unknown;
};

/**
 * Reads `authEpoch` from a JWT payload. Missing/invalid values map to `0` for backward compatibility.
 */
export function readTokenAuthEpoch(payload: AuthEpochPayload): number {
  const raw = payload.authEpoch;
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 0) {
    return raw;
  }
  return 0;
}

export function isAuthEpochValid(tokenEpoch: number, userEpoch: number): boolean {
  return tokenEpoch === userEpoch;
}

/**
 * Invalidates all existing JWTs for the user (logout, password change, role/block updates).
 */
export async function bumpAuthEpoch(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { authEpoch: { increment: 1 } },
    select: { id: true },
  });
}
