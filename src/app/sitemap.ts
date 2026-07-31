import type { MetadataRoute } from 'next';
import { getSitemapDynamicPayload } from '@/lib/sitemap/sitemap-dynamic-entries';
import { PUBLIC_STATIC_SITEMAP_PATHS } from '@/lib/sitemap/sitemap-constants';
import {
  buildSitemapAbsoluteUrl,
  buildSitemapCategoryUrl,
} from '@/lib/sitemap/sitemap-url';

/** Must be a literal for Next segment config (see SITEMAP_REVALIDATE_SECONDS). */
export const revalidate = 3600;

function buildStaticSitemapEntries(): MetadataRoute.Sitemap {
  return PUBLIC_STATIC_SITEMAP_PATHS.map((path) => ({
    url: buildSitemapAbsoluteUrl(path),
  }));
}

function buildProductSitemapEntries(
  products: ReadonlyArray<{ slug: string; lastModified: string }>,
): MetadataRoute.Sitemap {
  return products.map((product) => ({
    url: buildSitemapAbsoluteUrl(`/products/${product.slug}`),
    lastModified: product.lastModified,
  }));
}

function buildCategorySitemapEntries(
  categories: ReadonlyArray<{ slug: string; lastModified: string }>,
): MetadataRoute.Sitemap {
  return categories.map((category) => ({
    url: buildSitemapCategoryUrl(category.slug),
    lastModified: category.lastModified,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamic = await getSitemapDynamicPayload();

  return [
    ...buildStaticSitemapEntries(),
    ...buildProductSitemapEntries(dynamic.products),
    ...buildCategorySitemapEntries(dynamic.categories),
  ];
}
