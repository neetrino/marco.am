import { FEATURED_PRODUCTS_VISIBLE_COUNT } from '@/components/featured-products-tabs.constants';

/** Candidate pool — weekly shuffle picks {@link FEATURED_PRODUCTS_VISIBLE_COUNT} cards from this set. */
export const HOME_NEW_ARRIVALS_SELECTION_POOL_SIZE = 48;

/** Stable selection window — same cards for all visitors until the next bucket. */
export const HOME_NEW_ARRIVALS_ROTATION_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

type IdentifiableProduct = { readonly id: string };

/** UTC epoch week index used as the shuffle seed (changes every 7 days). */
export function getHomeNewArrivalsRotationBucket(now: Date = new Date()): number {
  return Math.floor(now.getTime() / HOME_NEW_ARRIVALS_ROTATION_PERIOD_MS);
}

function hashStringToUint32(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 1_677_7619);
  }
  return hash >>> 0;
}

function compareForWeeklyShuffle(
  left: IdentifiableProduct,
  right: IdentifiableProduct,
  bucket: number,
): number {
  const leftHash = hashStringToUint32(`${bucket}:${left.id}`);
  const rightHash = hashStringToUint32(`${bucket}:${right.id}`);
  return leftHash - rightHash;
}

/**
 * Picks a deterministic subset of new-arrival cards for the current week bucket.
 * Same pool + bucket always yields the same order and count (max 8).
 */
export function selectHomeNewArrivalsProducts<T extends IdentifiableProduct>(
  products: readonly T[],
  bucket: number = getHomeNewArrivalsRotationBucket(),
  count: number = FEATURED_PRODUCTS_VISIBLE_COUNT,
): T[] {
  if (products.length <= count) {
    return [...products];
  }
  return [...products]
    .sort((left, right) => compareForWeeklyShuffle(left, right, bucket))
    .slice(0, count);
}
