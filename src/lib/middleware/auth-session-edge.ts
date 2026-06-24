import { db } from "@white-shop/db";
import { isAuthEpochValid, readTokenAuthEpoch } from "@/lib/auth/auth-epoch";
import { normalizeUserRoles } from "@/lib/constants/user-roles";
import type { JwtPayload } from "@/lib/middleware/auth-edge";

export type ValidatedEdgeSession = {
  userId: string;
  roles: string[];
};

/**
 * Confirms JWT session against live user state (blocked, deleted, authEpoch).
 * Used by the Node.js proxy — not imported from Edge-only bundles.
 */
export async function validateSessionAtEdge(
  decoded: JwtPayload
): Promise<ValidatedEdgeSession | null> {
  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      roles: true,
      blocked: true,
      deletedAt: true,
      authEpoch: true,
    },
  });

  if (!user || user.blocked || user.deletedAt) {
    return null;
  }

  if (!isAuthEpochValid(readTokenAuthEpoch(decoded), user.authEpoch)) {
    return null;
  }

  return {
    userId: user.id,
    roles: normalizeUserRoles(user.roles),
  };
}

export function sessionHasAdminRole(session: ValidatedEdgeSession): boolean {
  return session.roles.includes("admin");
}
