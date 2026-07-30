import { dedupeCardProductsByTitle } from '@/lib/dedupeCardProductsByTitle';
import type { LanguageCode } from '@/lib/language';
import type { PlpReadModelSearchParams } from '@/lib/read-model/products-plp-read-model-types';

import {
  HOME_NEW_ARRIVALS_SELECTION_POOL_SIZE,
  selectHomeNewArrivalsProducts,
} from './home-new-arrivals-selection';

type IdentifiableListingRow = { readonly id: string };

type HomeNewArrivalsListingPayload<T extends IdentifiableListingRow> = {
  readonly items?: readonly T[];
};

export type HomeNewArrivalsListingFetcher<T extends IdentifiableListingRow> = (
  params: PlpReadModelSearchParams,
) => Promise<HomeNewArrivalsListingPayload<T>>;

const HOME_NEW_ARRIVALS_POOL_BASE: Omit<PlpReadModelSearchParams, 'lang' | 'filter'> = {
  page: '1',
  limit: String(HOME_NEW_ARRIVALS_SELECTION_POOL_SIZE),
  sort: 'createdAt',
  includeFilters: '0',
};

function dedupePool<T extends IdentifiableListingRow>(items: readonly T[]): T[] {
  return dedupeCardProductsByTitle(items as Array<T & { title?: string }>);
}

/**
 * Home «Նորույթներ» pool — prefers products in the PLP `new` window (30 days),
 * then falls back to the latest published catalog when that window is empty.
 */
export async function loadHomeNewArrivalsPool<T extends IdentifiableListingRow>(
  lang: LanguageCode,
  fetchListing: HomeNewArrivalsListingFetcher<T>,
): Promise<T[]> {
  const newPayload = await fetchListing({ ...HOME_NEW_ARRIVALS_POOL_BASE, lang, filter: 'new' });
  const newPool = dedupePool(newPayload.items ?? []);
  if (newPool.length > 0) {
    return selectHomeNewArrivalsProducts(newPool);
  }

  const latestPayload = await fetchListing({ ...HOME_NEW_ARRIVALS_POOL_BASE, lang });
  const latestPool = dedupePool(latestPayload.items ?? []);
  return selectHomeNewArrivalsProducts(latestPool);
}
