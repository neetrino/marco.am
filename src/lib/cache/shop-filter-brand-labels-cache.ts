import { db } from '@white-shop/db';
import type { BrandOption } from '@/lib/shop-products-filters-types';
import { getCachedJson } from '@/lib/services/read-through-json-cache';

const SHOP_FILTER_BRAND_LABELS_TTL_SEC = 600;

function buildPreferredLocales(lang: string): string[] {
  const normalized = lang.trim().toLowerCase();
  return normalized === 'en' ? ['en'] : [normalized, 'en'];
}

function buildShopFilterBrandLabelsCacheKey(lang: string): string {
  return `brands:shop-filter-labels:v1:${lang}`;
}

/** Published brand labels for instant PLP filter shell (counts patched when core facets load). */
export async function getShopFilterBrandLabelsCached(lang: string): Promise<BrandOption[]> {
  const cacheKey = buildShopFilterBrandLabelsCacheKey(lang);
  return getCachedJson<BrandOption[]>(cacheKey, SHOP_FILTER_BRAND_LABELS_TTL_SEC, async () => {
    const preferredLocales = buildPreferredLocales(lang);
    const rows = await db.brand.findMany({
      where: {
        products: {
          some: {
            published: true,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        slug: true,
        translations: {
          where: { locale: { in: preferredLocales } },
          select: { locale: true, name: true },
        },
      },
      orderBy: { slug: 'asc' },
    });

    return rows
      .map((brand) => {
        const translation =
          brand.translations.find((row) => row.locale === lang) ?? brand.translations[0];
        const name = (translation?.name?.trim() || brand.slug || '').trim();
        if (!name) {
          return null;
        }
        return {
          id: brand.id,
          slug: brand.slug,
          name,
          count: 0,
        };
      })
      .filter((row): row is BrandOption => row !== null);
  });
}

export async function invalidateShopFilterBrandLabelsCache(): Promise<void> {
  const { cacheService } = await import('@/lib/services/cache.service');
  await cacheService.deletePattern('brands:shop-filter-labels:v1:*');
}
