import { coerceCurrencyCode, type CurrencyCode } from '../currency';

export type CartSummaryPayload = {
  itemsCount: number;
  totals: { total: number; currency: CurrencyCode };
};

export function coerceCartCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function coerceCartTotal(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeCartSummaryPayload(payload: {
  itemsCount?: unknown;
  totals?: { total?: unknown; currency?: unknown };
}): CartSummaryPayload {
  return {
    itemsCount: coerceCartCount(payload.itemsCount),
    totals: {
      total: coerceCartTotal(payload.totals?.total),
      currency: coerceCurrencyCode(payload.totals?.currency, 'AMD'),
    },
  };
}
