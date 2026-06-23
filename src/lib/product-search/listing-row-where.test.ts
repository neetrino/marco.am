import { describe, expect, it } from 'vitest';
import { buildListingRowSearchWhereInput } from './listing-row-where';

describe('buildListingRowSearchWhereInput', () => {
  it('requires every token to match text fields', () => {
    expect(buildListingRowSearchWhereInput('Vestel 65U9700T')).toEqual({
      OR: [
        {
          AND: [
            {
              OR: [
                { title: { contains: 'Vestel', mode: 'insensitive' } },
                { slug: { contains: 'Vestel', mode: 'insensitive' } },
                { searchText: { contains: 'Vestel', mode: 'insensitive' } },
              ],
            },
            {
              OR: [
                { title: { contains: '65U9700T', mode: 'insensitive' } },
                { slug: { contains: '65U9700T', mode: 'insensitive' } },
                { searchText: { contains: '65U9700T', mode: 'insensitive' } },
              ],
            },
          ],
        },
      ],
    });
  });

  it('includes SKU product ids as an alternate match path', () => {
    expect(buildListingRowSearchWhereInput('07521', ['product-1'])).toEqual({
      OR: [
        {
          AND: [
            {
              OR: [
                { title: { contains: '07521', mode: 'insensitive' } },
                { slug: { contains: '07521', mode: 'insensitive' } },
                { searchText: { contains: '07521', mode: 'insensitive' } },
              ],
            },
          ],
        },
        { productId: { in: ['product-1'] } },
      ],
    });
  });

  it('returns null for blank search', () => {
    expect(buildListingRowSearchWhereInput('   ')).toBeNull();
  });
});
