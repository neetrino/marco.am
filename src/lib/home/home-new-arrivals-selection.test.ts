import { describe, expect, it } from 'vitest';

import {
  HOME_NEW_ARRIVALS_ROTATION_PERIOD_MS,
  getHomeNewArrivalsRotationBucket,
  selectHomeNewArrivalsProducts,
} from './home-new-arrivals-selection';

const sampleProducts = Array.from({ length: 20 }, (_, index) => ({
  id: `product-${index}`,
}));

describe('getHomeNewArrivalsRotationBucket', () => {
  it('increments every 7 days', () => {
    const weekZero = new Date(0);
    const weekOne = new Date(HOME_NEW_ARRIVALS_ROTATION_PERIOD_MS);
    expect(getHomeNewArrivalsRotationBucket(weekZero)).toBe(0);
    expect(getHomeNewArrivalsRotationBucket(weekOne)).toBe(1);
  });
});

describe('selectHomeNewArrivalsProducts', () => {
  it('returns at most eight products', () => {
    const selected = selectHomeNewArrivalsProducts(sampleProducts, 3, 8);
    expect(selected).toHaveLength(8);
  });

  it('is stable within the same bucket', () => {
    const first = selectHomeNewArrivalsProducts(sampleProducts, 5);
    const second = selectHomeNewArrivalsProducts(sampleProducts, 5);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
  });

  it('changes order across buckets', () => {
    const weekA = selectHomeNewArrivalsProducts(sampleProducts, 1);
    const weekB = selectHomeNewArrivalsProducts(sampleProducts, 2);
    expect(weekA.map((item) => item.id)).not.toEqual(weekB.map((item) => item.id));
  });

  it('returns all products when pool is smaller than the cap', () => {
    const smallPool = sampleProducts.slice(0, 5);
    expect(selectHomeNewArrivalsProducts(smallPool, 0)).toEqual(smallPool);
  });
});
