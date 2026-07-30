import { describe, expect, it, vi } from 'vitest';

import { loadHomeNewArrivalsPool } from './home-new-arrivals-pool';

describe('loadHomeNewArrivalsPool', () => {
  it('uses the new filter pool when it has products', async () => {
    const fetchListing = vi
      .fn()
      .mockResolvedValueOnce({ items: [{ id: 'new-1', title: 'A' }] })
      .mockResolvedValueOnce({ items: [{ id: 'old-1', title: 'B' }] });

    const products = await loadHomeNewArrivalsPool('hy', fetchListing);

    expect(fetchListing).toHaveBeenCalledTimes(1);
    expect(fetchListing.mock.calls[0]?.[0]?.filter).toBe('new');
    expect(products.map((item) => item.id)).toEqual(['new-1']);
  });

  it('falls back to latest catalog when the new window is empty', async () => {
    const fetchListing = vi
      .fn()
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: [{ id: 'old-1', title: 'B' }, { id: 'old-2', title: 'C' }] });

    const products = await loadHomeNewArrivalsPool('hy', fetchListing);

    expect(fetchListing).toHaveBeenCalledTimes(2);
    expect(fetchListing.mock.calls[1]?.[0]?.filter).toBeUndefined();
    expect(products.map((item) => item.id)).toEqual(['old-1', 'old-2']);
  });
});
