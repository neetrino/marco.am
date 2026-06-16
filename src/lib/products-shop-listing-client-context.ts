import { resolveShopPlpPricePresence } from '@/lib/constants/shop-plp-price-presence';
import {
  SHOP_PLP_DEFAULT_PAGE_SIZE,
  SHOP_PLP_MAX_PAGE_SIZE,
} from '@/lib/constants/shop-plp-pagination';
import type { LanguageCode } from '@/lib/language';

function parseUrlPriceBounds(minPrice?: string, maxPrice?: string) {
  const parsedMin = minPrice ? Number(minPrice) : undefined;
  const parsedMax = maxPrice ? Number(maxPrice) : undefined;
  const validMin =
    parsedMin !== undefined && Number.isFinite(parsedMin) && parsedMin >= 0 ? parsedMin : undefined;
  const validMax =
    parsedMax !== undefined && Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : undefined;
  return { min: validMin, max: validMax };
}

export type ProductsShopListingClientContext = {
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
  pricePresence: 'with' | 'without';
  page: number;
  perPage: number;
  filtersMinPrice: number | undefined;
  filtersMaxPrice: number | undefined;
  initialQueryString: string;
};

/** Sync PLP URL parsing for client navigation — no cookies() / RSC round-trip. */
export function resolveProductsShopListingClientContext(
  searchParams: URLSearchParams,
  language: LanguageCode,
): ProductsShopListingClientContext {
  const params = {
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    minPrice: searchParams.get('minPrice') ?? undefined,
    maxPrice: searchParams.get('maxPrice') ?? undefined,
    colors: searchParams.get('colors') ?? undefined,
    sizes: searchParams.get('sizes') ?? undefined,
    brand: searchParams.get('brand') ?? undefined,
    filter: searchParams.get('filter') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    pricePresence: searchParams.get('pricePresence') ?? undefined,
  };

  const pricePresence = resolveShopPlpPricePresence(params.pricePresence);
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
    language,
    params,
    pricePresence,
    page,
    perPage,
    filtersMinPrice,
    filtersMaxPrice,
    initialQueryString: searchParams.toString(),
  };
}
