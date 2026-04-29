import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from '@white-shop/db';

const DISCOUNT_KEYS = ['globalDiscount', 'categoryDiscounts', 'brandDiscounts'] as const;

async function fetchDiscountSettingRows() {
  return db.settings.findMany({
    where: {
      key: { in: [...DISCOUNT_KEYS] },
    },
  });
}

const getDiscountRowsData = unstable_cache(fetchDiscountSettingRows, ['listing-discount-settings-v1'], {
  revalidate: 120,
  tags: ['listing-discount-settings'],
});

export type ListingDiscountSettings = {
  globalDiscount: number;
  categoryDiscounts: Record<string, number>;
  brandDiscounts: Record<string, number>;
};

function parseDiscountRows(
  rows: Awaited<ReturnType<typeof fetchDiscountSettingRows>>,
): ListingDiscountSettings {
  const globalDiscount =
    Number(rows.find((s) => s.key === 'globalDiscount')?.value) || 0;
  const categoryRow = rows.find((s) => s.key === 'categoryDiscounts');
  const brandRow = rows.find((s) => s.key === 'brandDiscounts');
  const categoryDiscounts = categoryRow
    ? ((categoryRow.value as Record<string, number>) || {})
    : {};
  const brandDiscounts = brandRow ? ((brandRow.value as Record<string, number>) || {}) : {};
  return { globalDiscount, categoryDiscounts, brandDiscounts };
}

/**
 * Discount rows used by PLP/card transforms — cached across requests (120s) and
 * deduped within a single request via `cache()`.
 */
export const getListingDiscountSettings = cache(async (): Promise<ListingDiscountSettings> => {
  const rows = await getDiscountRowsData();
  return parseDiscountRows(rows);
});
