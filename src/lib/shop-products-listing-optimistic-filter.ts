import type { ShopGridProduct } from '@/app/products/shop-grid-product';

function parseCsvParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parsePriceParam(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (!raw) {
    return undefined;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

function hadClientSideListingFilters(queryString: string): boolean {
  const params = new URLSearchParams(queryString);
  return (
    Boolean(params.get('brand')) ||
    Boolean(params.get('colors')) ||
    Boolean(params.get('minPrice')) ||
    Boolean(params.get('maxPrice'))
  );
}

/**
 * Narrows the current PLP page client-side while the listing API request is in flight.
 * Returns `null` when the query change cannot be approximated locally (category, search, sort, …).
 */
export function applyOptimisticShopListingFilter(
  products: readonly ShopGridProduct[],
  queryString: string,
  previousQueryString: string,
): ShopGridProduct[] | null {
  const params = new URLSearchParams(queryString);

  if (
    params.get('category') ||
    params.get('search') ||
    params.get('filter') ||
    params.get('sort') ||
    (params.has('page') && params.get('page') !== '1')
  ) {
    return null;
  }

  for (const key of params.keys()) {
    if (key.startsWith('spec.') || key === 'specs') {
      return null;
    }
  }

  const brandSlugs = parseCsvParam(params, 'brand');
  const colorValues = parseCsvParam(params, 'colors').map((value) => value.toLowerCase());
  const minPrice = parsePriceParam(params, 'minPrice');
  const maxPrice = parsePriceParam(params, 'maxPrice');

  const hasClientSideFilter =
    brandSlugs.length > 0 ||
    colorValues.length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  if (!hasClientSideFilter) {
    if (hadClientSideListingFilters(previousQueryString)) {
      return [...products];
    }
    return null;
  }

  return products.filter((product) => {
    if (brandSlugs.length > 0) {
      const slug = product.brand?.slug ?? '';
      const id = product.brand?.id ?? '';
      const matchesBrand = brandSlugs.some(
        (brand) => brand === slug || brand === id,
      );
      if (!matchesBrand) {
        return false;
      }
    }

    if (colorValues.length > 0) {
      const productColors = product.colors.map((color) => color.value.toLowerCase());
      const matchesColor = colorValues.some((color) => productColors.includes(color));
      if (!matchesColor) {
        return false;
      }
    }

    if (minPrice !== undefined && product.price < minPrice) {
      return false;
    }

    if (maxPrice !== undefined && product.price > maxPrice) {
      return false;
    }

    return true;
  });
}
