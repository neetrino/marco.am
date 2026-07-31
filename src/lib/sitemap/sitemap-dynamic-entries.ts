import { db } from '@white-shop/db';
import { resolveCategoryTranslation } from '@/lib/i18n/category-translation';
import { DEFAULT_STOREFRONT_LANGUAGE } from '@/lib/language';
import { getCachedJson } from '@/lib/services/read-through-json-cache';
import { isRecoverableDbReadError } from '@/lib/utils/recoverable-db-read-error';
import {
  SITEMAP_CACHE_KEY,
  SITEMAP_CACHE_TTL_SECONDS,
} from '@/lib/sitemap/sitemap-constants';

export type SitemapDynamicPayload = {
  products: ReadonlyArray<{ slug: string; lastModified: string }>;
  categories: ReadonlyArray<{ slug: string; lastModified: string }>;
};

const EMPTY_DYNAMIC_PAYLOAD: SitemapDynamicPayload = {
  products: [],
  categories: [],
};

async function loadSitemapDynamicPayload(): Promise<SitemapDynamicPayload> {
  try {
    const locale = DEFAULT_STOREFRONT_LANGUAGE;
    const [productRows, categoryRows] = await Promise.all([
      db.productListingRow.findMany({
        where: {
          locale,
          isPublished: true,
          deletedAt: null,
        },
        select: {
          slug: true,
          productUpdatedAt: true,
        },
      }),
      db.category.findMany({
        where: {
          published: true,
          deletedAt: null,
        },
        select: {
          updatedAt: true,
          translations: {
            select: {
              locale: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    const products = productRows.map((row) => ({
      slug: row.slug,
      lastModified: row.productUpdatedAt.toISOString(),
    }));

    const categories: Array<{ slug: string; lastModified: string }> = [];
    for (const category of categoryRows) {
      const translation = resolveCategoryTranslation(category.translations, locale);
      const slug = translation?.slug.trim();
      if (!slug) {
        continue;
      }
      categories.push({
        slug,
        lastModified: category.updatedAt.toISOString(),
      });
    }

    return { products, categories };
  } catch (error) {
    if (isRecoverableDbReadError(error)) {
      return EMPTY_DYNAMIC_PAYLOAD;
    }
    throw error;
  }
}

/** Cached published product and category slugs for the sitemap. */
export async function getSitemapDynamicPayload(): Promise<SitemapDynamicPayload> {
  return getCachedJson(
    SITEMAP_CACHE_KEY,
    SITEMAP_CACHE_TTL_SECONDS,
    loadSitemapDynamicPayload,
  );
}
