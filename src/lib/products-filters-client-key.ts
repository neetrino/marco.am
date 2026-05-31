import type { LanguageCode } from '@/lib/language';

/** Stable facet scope key — aligned with `buildProductsShopFiltersInitialKey` (server). */
export function buildProductsFiltersClientKey(args: {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  filter?: string;
  language: LanguageCode;
  technicalFilterSignature: string;
}): string {
  const { category, search, minPrice, maxPrice, filter, language, technicalFilterSignature } = args;
  return `${category ?? ''}|${search ?? ''}|${minPrice ?? ''}|${maxPrice ?? ''}|${language}|${technicalFilterSignature}|${filter ?? ''}`;
}
