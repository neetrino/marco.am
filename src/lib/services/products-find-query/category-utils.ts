import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";

const CATEGORY_LOOKUP_CACHE_TTL_MS = 5 * 60 * 1000;
const CATEGORY_DESCENDANTS_CACHE_TTL_MS = 5 * 60 * 1000;

type CategoryLookupCacheEntry = {
  categoryId: string | null;
  expiresAt: number;
};

type CategoryDescendantsCacheEntry = {
  childIds: string[];
  expiresAt: number;
};

const categoryLookupCache = new Map<string, CategoryLookupCacheEntry>();
const categoryDescendantsCache = new Map<string, CategoryDescendantsCacheEntry>();

function nowMs(): number {
  return Date.now();
}

function getLookupCacheKey(categorySlug: string, lang: string): string {
  return `${categorySlug.trim().toLowerCase()}|${lang.trim().toLowerCase()}`;
}

function readCategoryLookupCache(cacheKey: string): string | null | undefined {
  const hit = categoryLookupCache.get(cacheKey);
  if (!hit) {
    return undefined;
  }
  if (hit.expiresAt <= nowMs()) {
    categoryLookupCache.delete(cacheKey);
    return undefined;
  }
  return hit.categoryId;
}

function writeCategoryLookupCache(cacheKey: string, categoryId: string | null): void {
  categoryLookupCache.set(cacheKey, {
    categoryId,
    expiresAt: nowMs() + CATEGORY_LOOKUP_CACHE_TTL_MS,
  });
}

function readDescendantsCache(parentId: string): string[] | undefined {
  const hit = categoryDescendantsCache.get(parentId);
  if (!hit) {
    return undefined;
  }
  if (hit.expiresAt <= nowMs()) {
    categoryDescendantsCache.delete(parentId);
    return undefined;
  }
  return hit.childIds;
}

function writeDescendantsCache(parentId: string, childIds: string[]): void {
  categoryDescendantsCache.set(parentId, {
    childIds,
    expiresAt: nowMs() + CATEGORY_DESCENDANTS_CACHE_TTL_MS,
  });
}

/**
 * Get all child category IDs recursively
 */
export async function getAllChildCategoryIds(parentId: string): Promise<string[]> {
  const cached = readDescendantsCache(parentId);
  if (cached) {
    return cached;
  }

  const allChildIds: string[] = [];
  let frontier = [parentId];
  let guard = 0;

  while (frontier.length > 0 && guard < 40) {
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

/**
 * Find category by slug with fallback to other languages
 */
export async function findCategoryBySlug(
  categorySlug: string,
  lang: string
): Promise<{ id: string } | null> {
  const cacheKey = getLookupCacheKey(categorySlug, lang);
  const cachedId = readCategoryLookupCache(cacheKey);
  if (cachedId !== undefined) {
    return cachedId ? { id: cachedId } : null;
  }

  logger.debug('Looking for category', { category: categorySlug, lang });
  let categoryDoc = await db.category.findFirst({
    where: {
      id: categorySlug,
      published: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (categoryDoc) {
    logger.info("Category resolved by id", { id: categoryDoc.id });
    writeCategoryLookupCache(cacheKey, categoryDoc.id);
    return categoryDoc;
  }

  categoryDoc = await db.category.findFirst({
    where: {
      translations: {
        some: {
          slug: categorySlug,
          locale: lang,
        },
      },
      published: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  // If category not found in current language, try to find it in other languages (fallback)
  if (!categoryDoc) {
    logger.warn('Category not found in language, trying other languages', { category: categorySlug, lang });
    categoryDoc = await db.category.findFirst({
      where: {
        translations: {
          some: {
            slug: categorySlug,
          },
        },
        published: true,
        deletedAt: null,
      },
      select: {
        id: true,
        translations: {
          where: { slug: categorySlug },
          select: { locale: true, slug: true },
        },
      },
    });
    
    if (categoryDoc) {
      const foundIn = (categoryDoc as { translations?: Array<{ slug: string; locale: string }> }).translations?.find((t: { slug: string; locale: string }) => t.slug === categorySlug)?.locale || 'unknown';
      logger.info('Category found in different language', { 
        id: categoryDoc.id, 
        slug: categorySlug,
        foundIn
      });
    }
  }

  if (categoryDoc) {
    logger.info('Category found', { id: categoryDoc.id, slug: categorySlug });
    writeCategoryLookupCache(cacheKey, categoryDoc.id);
  } else {
    logger.warn('Category not found in any language', { category: categorySlug, lang });
    writeCategoryLookupCache(cacheKey, null);
  }

  return categoryDoc;
}




