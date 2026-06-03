import { cache } from 'react';
import { cookies } from 'next/headers';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import {
  SHOP_PLP_DEFAULT_PAGE_SIZE,
  SHOP_PLP_MAX_PAGE_SIZE,
} from '@/lib/constants/shop-plp-pagination';
import { searchParamsRecordToUrlSearchParams } from '@/lib/cache/products-filters-redis';
import type { ProductsPageSearchParams } from '@/app/products/products-page-search-params';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function parsePricePresence(
  value: string | undefined,
): ProductsShopListingServerContext['pricePresence'] {
  return value === 'with' || value === 'without' ? value : undefined;
}

function parseUrlPriceBounds(minPrice?: string, maxPrice?: string) {
  const parsedMin = minPrice ? Number(minPrice) : undefined;
  const parsedMax = maxPrice ? Number(maxPrice) : undefined;
  const validMin =
    parsedMin !== undefined && Number.isFinite(parsedMin) && parsedMin >= 0 ? parsedMin : undefined;
  const validMax =
    parsedMax !== undefined && Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : undefined;
  return { min: validMin, max: validMax };
}

export type ProductsShopListingServerContext = {
  raw: ProductsPageSearchParams;
  language: LanguageCode;
  params: {
    page?: string;
    limit?: string;
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    colors?: string;
    sizes?: string;
    brand?: string;
    filter?: string;
    sort?: string;
    pricePresence?: string;
  };
  pricePresence?: 'with' | 'without';
  page: number;
  perPage: number;
  filtersMinPrice: number | undefined;
  filtersMaxPrice: number | undefined;
  initialQueryString: string;
};

function buildInitialQueryString(raw: ProductsPageSearchParams): string {
  return searchParamsRecordToUrlSearchParams(raw).toString();
}

/** Deduped PLP search-param parsing for parallel server sections. */
export const resolveProductsShopListingServerContext = cache(
  async (raw: ProductsPageSearchParams): Promise<ProductsShopListingServerContext> => {
    const cookieStore = await cookies();
    const language: LanguageCode =
      parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
    const params = {
      page: firstParam(raw.page),
      limit: firstParam(raw.limit),
      search: firstParam(raw.search),
      category: firstParam(raw.category),
      minPrice: firstParam(raw.minPrice),
      maxPrice: firstParam(raw.maxPrice),
      colors: firstParam(raw.colors),
      sizes: firstParam(raw.sizes),
      brand: firstParam(raw.brand),
      filter: firstParam(raw.filter),
      sort: firstParam(raw.sort),
      pricePresence: firstParam(raw.pricePresence),
    };

    const pricePresence = parsePricePresence(params.pricePresence);

    const page = parseInt(params.page || '1', 10);
    const limitParam = params.limit?.trim();
    const parsedLimit =
      limitParam && !Number.isNaN(parseInt(limitParam, 10)) ? parseInt(limitParam, 10) : null;
    const perPage = parsedLimit
      ? Math.min(parsedLimit, SHOP_PLP_MAX_PAGE_SIZE)
      : SHOP_PLP_DEFAULT_PAGE_SIZE;

    const { min: filtersMinPrice, max: filtersMaxPrice } = parseUrlPriceBounds(
      params.minPrice,
      params.maxPrice,
    );

    return {
      raw,
      language,
      params,
      pricePresence,
      page,
      perPage,
      filtersMinPrice,
      filtersMaxPrice,
      initialQueryString: buildInitialQueryString(raw),
    };
  },
);
