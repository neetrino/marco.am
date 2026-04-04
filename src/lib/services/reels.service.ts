import { db } from "@white-shop/db";

/**
 * Get active reels for feed, ordered by position.
 */
export async function getReels(userId?: string) {
  const reels = await db.reel.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });

  if (!userId) {
    return reels.map((r) => ({
      ...r,
      userLiked: false,
    }));
  }

  const liked = await db.reelLike.findMany({
    where: { userId, reelId: { in: reels.map((r) => r.id) } },
    select: { reelId: true },
  });
  const likedSet = new Set(liked.map((l) => l.reelId));

  return reels.map((r) => ({
    ...r,
    userLiked: likedSet.has(r.id),
  }));
}

/**
 * Toggle like for a reel by user.
 * Returns updated likesCount and userLiked.
 */
export async function toggleReelLike(reelId: string, userId: string) {
  const reel = await db.reel.findUnique({
    where: { id: reelId },
    select: { id: true, likesCount: true },
  });

  if (!reel) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Reel not found",
      detail: "Reel not found",
    };
  }

  const existing = await db.reelLike.findUnique({
    where: { reelId_userId: { reelId, userId } },
  });

  if (existing) {
    await db.$transaction([
      db.reelLike.delete({ where: { id: existing.id } }),
      db.reel.update({
        where: { id: reelId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);
    return { likesCount: reel.likesCount - 1, userLiked: false };
  } else {
    await db.$transaction([
      db.reelLike.create({
        data: { reelId, userId },
      }),
      db.reel.update({
        where: { id: reelId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);
    return { likesCount: reel.likesCount + 1, userLiked: true };
  }
}
