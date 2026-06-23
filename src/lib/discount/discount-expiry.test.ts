import { describe, expect, it } from 'vitest';
import {
  activeDiscountPercent,
  isDiscountExpired,
  parseDiscountMap,
  serializeDiscountMap,
} from './discount-expiry';

describe('discount-expiry', () => {
  it('parses legacy numeric map entries', () => {
    expect(parseDiscountMap({ cat1: 15, cat2: 0 })).toEqual({
      cat1: { percent: 15, expiresAt: null },
    });
  });

  it('parses structured map entries', () => {
    expect(
      parseDiscountMap({
        cat1: { percent: 20, expiresAt: '2026-12-31T20:00:00.000Z' },
      }),
    ).toEqual({
      cat1: { percent: 20, expiresAt: '2026-12-31T20:00:00.000Z' },
    });
  });

  it('treats expired discounts as inactive', () => {
    const now = new Date('2026-06-24T12:00:00.000Z');
    expect(
      activeDiscountPercent(25, '2026-06-23T12:00:00.000Z', now),
    ).toBe(0);
    expect(
      activeDiscountPercent(25, '2026-06-25T12:00:00.000Z', now),
    ).toBe(25);
  });

  it('serializes only positive discounts', () => {
    expect(
      serializeDiscountMap({
        a: { percent: 10, expiresAt: null },
        b: { percent: 0, expiresAt: null },
      }),
    ).toEqual({
      a: { percent: 10, expiresAt: null },
    });
  });

  it('does not expire when expiresAt is null', () => {
    expect(isDiscountExpired(null)).toBe(false);
  });
});
