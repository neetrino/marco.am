const SHOP_PLP_DEFAULT_PRICE_PRESENCE = 'with' as const;

export type ShopPlpPricePresence = 'with' | 'without';

/** Matches PLP header default: «with price» when the query param is missing or invalid. */
export function resolveShopPlpPricePresence(
  value: string | null | undefined,
): ShopPlpPricePresence {
  return value === 'without' ? 'without' : SHOP_PLP_DEFAULT_PRICE_PRESENCE;
}
