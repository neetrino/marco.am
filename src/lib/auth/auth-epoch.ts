type AuthEpochPayload = {
  authEpoch?: unknown;
};

/**
 * Pure, Edge-safe auth-epoch helpers. Must NOT import the Prisma client, so the
 * Edge middleware can read the JWT epoch without pulling the Node query engine
 * into the Edge Runtime bundle. DB mutations live in `auth-epoch-mutations.ts`.
 */

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
