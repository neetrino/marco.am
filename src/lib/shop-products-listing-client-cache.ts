type ListingMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ShopListingCachePayload = {
  data: unknown[];
  meta: ListingMeta;
};

const LISTING_CACHE_TTL_MS = 120_000;
const listingCache = new Map<string, { payload: ShopListingCachePayload; storedAt: number }>();

export function readShopListingCache(queryString: string): ShopListingCachePayload | null {
  const entry = listingCache.get(queryString);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.storedAt > LISTING_CACHE_TTL_MS) {
    listingCache.delete(queryString);
    return null;
  }
  return entry.payload;
}

export function writeShopListingCache(queryString: string, payload: ShopListingCachePayload): void {
  listingCache.set(queryString, { payload, storedAt: Date.now() });
}

type ListingFetchListener = (queryString: string) => void;

let listingFetchListener: ListingFetchListener | null = null;

/** Registers the active PLP listing consumer (one client grid per page). */
export function registerShopProductsListingFetchListener(
  listener: ListingFetchListener | null,
): void {
  listingFetchListener = listener;
}

/** Invoked synchronously from filter navigation — before React event dispatch. */
export function notifyShopProductsListingFetch(queryString: string): void {
  listingFetchListener?.(queryString);
}
