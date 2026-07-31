import { SITE_BASE_URL } from '@/lib/constants/site-url';

/** Builds an absolute storefront URL from a site path. */
export function buildSitemapAbsoluteUrl(path: string): string {
  if (path === '/' || path === '') {
    return `${SITE_BASE_URL}/`;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_BASE_URL}${normalized}`;
}

/** PLP category filter URL for a category slug. */
export function buildSitemapCategoryUrl(slug: string): string {
  const params = new URLSearchParams({ category: slug });
  return `${SITE_BASE_URL}/products?${params.toString()}`;
}
