import { db } from "@white-shop/db";

/**
 * Invalidates all existing JWTs for the user (logout, password change, role/block updates).
 * Lives in a Node-only module (imports the Prisma client) so Edge code can keep using the
 * pure helpers in `auth-epoch.ts` without bundling the query engine.
 */
export async function bumpAuthEpoch(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { authEpoch: { increment: 1 } },
    select: { id: true },
  });
}
