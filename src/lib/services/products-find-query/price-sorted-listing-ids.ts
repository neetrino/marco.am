import { Prisma } from '@white-shop/db/prisma';
import { db } from '@white-shop/db';
import type { ProductFilters } from './types';
import { hasTechnicalSpecFilters } from '../products-technical-filters';

export type PriceListingSortDirection = 'price-asc' | 'price-desc';

export function isPriceListingSortKey(sort: string | undefined): boolean {
  return sort === 'price-asc' || sort === 'price-desc' || sort === 'price';
}

export function resolvePriceListingSortDirection(sort: string | undefined): PriceListingSortDirection {
  if (sort === 'price-asc') {
    return 'price-asc';
  }
  return 'price-desc';
}

/**
 * PLP price sort via DB aggregate — matches listing card min positive published variant price.
 */
export function usesPriceDbSortPath(filters: ProductFilters): boolean {
  return (
    isPriceListingSortKey(filters.sort) &&
    Boolean(filters.plpLeanListing) &&
    Boolean(filters.listingOmitProductAttributes) &&
    filters.cursor === undefined &&
    !hasTechnicalSpecFilters(filters.technicalSpecs)
  );
}

/**
 * Resolves product IDs in card-price order using variant `MIN(price)` (published, price > 0).
 */
export async function fetchPriceSortedListingProductIds(
  where: Prisma.ProductWhereInput,
  direction: PriceListingSortDirection,
  limit: number,
  skip: number,
): Promise<string[]> {
  const rows = await db.productVariant.groupBy({
    by: ['productId'],
    where: {
      published: true,
      price: { gt: 0 },
      product: where,
    },
    _min: { price: true },
    orderBy: {
      _min: {
        price: direction === 'price-asc' ? 'asc' : 'desc',
      },
    },
    skip,
    take: limit,
  });

  return rows.map((row) => row.productId);
}
