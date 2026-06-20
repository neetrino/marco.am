import { db } from "@white-shop/db";

const CATEGORY_DESCENDANTS_CACHE_TTL_MS = 5 * 60 * 1000;
const CATEGORY_DESCENDANTS_WALK_GUARD = 40;

type CategoryDescendantsCacheEntry = {
  childIds: string[];
  expiresAt: number;
};

const categoryDescendantsCache = new Map<string, CategoryDescendantsCacheEntry>();

function readDescendantsCache(parentId: string): string[] | undefined {
  const hit = categoryDescendantsCache.get(parentId);
  if (!hit) {
    return undefined;
  }
  if (hit.expiresAt <= Date.now()) {
    categoryDescendantsCache.delete(parentId);
    return undefined;
  }
  return hit.childIds;
}

function writeDescendantsCache(parentId: string, childIds: string[]): void {
  categoryDescendantsCache.set(parentId, {
    childIds,
    expiresAt: Date.now() + CATEGORY_DESCENDANTS_CACHE_TTL_MS,
  });
}

/**
 * Get all child category IDs recursively (published, non-deleted), cached in-memory.
 */
export async function getAllChildCategoryIds(parentId: string): Promise<string[]> {
  const cached = readDescendantsCache(parentId);
  if (cached) {
    return cached;
  }

  const allChildIds: string[] = [];
  let frontier = [parentId];
  let guard = 0;

  while (frontier.length > 0 && guard < CATEGORY_DESCENDANTS_WALK_GUARD) {
    guard += 1;
    const rows = await db.category.findMany({
      where: {
        parentId: { in: frontier },
        published: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (rows.length === 0) {
      break;
    }
    const nextLevel = rows.map((row) => row.id);
    allChildIds.push(...nextLevel);
    frontier = nextLevel;
  }

  writeDescendantsCache(parentId, allChildIds);
  return allChildIds;
}
