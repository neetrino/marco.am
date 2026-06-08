import type { PublicReelItem } from '@/lib/schemas/reels-management.schema';

const REELS_PAGE_CACHE_TTL_MS = 120_000;

type ReelsPageCacheEntry = {
  items: PublicReelItem[];
  watchCtaLabel: string;
  storedAt: number;
};

const reelsPageCache = new Map<string, ReelsPageCacheEntry>();

export function readReelsPageCache(locale: string): ReelsPageCacheEntry | null {
  const entry = reelsPageCache.get(locale);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.storedAt > REELS_PAGE_CACHE_TTL_MS) {
    reelsPageCache.delete(locale);
    return null;
  }
  return entry;
}

export function writeReelsPageCache(
  locale: string,
  items: PublicReelItem[],
  watchCtaLabel: string,
): void {
  reelsPageCache.set(locale, { items, watchCtaLabel, storedAt: Date.now() });
}
