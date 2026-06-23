import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from '@white-shop/db';
import {
  activeDiscountPercent,
  parseDiscountMap,
  parseIsoDate,
  toActiveDiscountMap,
  type DiscountMap,
} from '@/lib/discount/discount-expiry';

const DISCOUNT_KEYS = [
  'globalDiscount',
  'globalDiscountExpiresAt',
  'categoryDiscounts',
  'brandDiscounts',
] as const;

async function fetchDiscountSettingRows() {
  return db.settings.findMany({
    where: {
      key: { in: [...DISCOUNT_KEYS] },
    },
  });
}

const getDiscountRowsData = unstable_cache(fetchDiscountSettingRows, ['listing-discount-settings-v2'], {
  revalidate: 120,
  tags: ['listing-discount-settings'],
});

export type ListingDiscountSettings = {
  globalDiscount: number;
  globalDiscountExpiresAt: string | null;
  categoryDiscounts: DiscountMap;
  brandDiscounts: DiscountMap;
};

export type ActiveListingDiscountSettings = {
  globalDiscount: number;
  categoryDiscounts: Record<string, number>;
  brandDiscounts: Record<string, number>;
};

function parseDiscountRows(
  rows: Awaited<ReturnType<typeof fetchDiscountSettingRows>>,
): ListingDiscountSettings {
  const globalDiscount =
    Number(rows.find((s) => s.key === 'globalDiscount')?.value) || 0;
  const globalDiscountExpiresAt = parseIsoDate(
    rows.find((s) => s.key === 'globalDiscountExpiresAt')?.value,
  );
  const categoryRow = rows.find((s) => s.key === 'categoryDiscounts');
  const brandRow = rows.find((s) => s.key === 'brandDiscounts');

  return {
    globalDiscount,
    globalDiscountExpiresAt,
    categoryDiscounts: parseDiscountMap(categoryRow?.value),
    brandDiscounts: parseDiscountMap(brandRow?.value),
  };
}

export function toActiveListingDiscountSettings(
  settings: ListingDiscountSettings,
  now: Date = new Date(),
): ActiveListingDiscountSettings {
  return {
    globalDiscount: activeDiscountPercent(
      settings.globalDiscount,
      settings.globalDiscountExpiresAt,
      now,
    ),
    categoryDiscounts: toActiveDiscountMap(settings.categoryDiscounts, now),
    brandDiscounts: toActiveDiscountMap(settings.brandDiscounts, now),
  };
}

/**
 * Discount rows used by PLP/card transforms — cached across requests (120s) and
 * deduped within a single request via `cache()`.
 */
export const getListingDiscountSettings = cache(async (): Promise<ListingDiscountSettings> => {
  const rows = await getDiscountRowsData();
  return parseDiscountRows(rows);
});

/**
 * Same parsed settings without `unstable_cache` — safe outside a request context
 * (CLI read-model rebuilds). Identical parse, so produces identical pricing.
 */
export async function loadListingDiscountSettingsUncached(): Promise<ListingDiscountSettings> {
  const rows = await fetchDiscountSettingRows();
  return parseDiscountRows(rows);
}

/** Active percents after expiry filtering — used by pricing transforms. */
export async function getActiveListingDiscountSettings(): Promise<ActiveListingDiscountSettings> {
  const settings = await getListingDiscountSettings();
  return toActiveListingDiscountSettings(settings);
}
