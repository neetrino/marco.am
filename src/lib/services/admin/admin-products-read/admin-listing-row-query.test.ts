import { describe, expect, it } from 'vitest';
import {
  buildAdminListingRowWhere,
  splitAdminSearchTokens,
} from './admin-listing-row-query';

describe('splitAdminSearchTokens', () => {
  it('splits on whitespace and drops empty parts', () => {
    expect(splitAdminSearchTokens('  Vestel  65U9700T  17MBI  185  ')).toEqual([
      'Vestel',
      '65U9700T',
      '17MBI',
      '185',
    ]);
  });
});

describe('buildAdminListingRowWhere search', () => {
  it('requires every token to match text fields', () => {
    const where = buildAdminListingRowWhere(
      { search: 'Vestel 65U9700T 17MBI 185' },
      'en',
    );

    expect(where.AND).toEqual([
      {
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
              {
                OR: [
                  { title: { contains: '17MBI', mode: 'insensitive' } },
                  { slug: { contains: '17MBI', mode: 'insensitive' } },
                  { searchText: { contains: '17MBI', mode: 'insensitive' } },
                ],
              },
              {
                OR: [
                  { title: { contains: '185', mode: 'insensitive' } },
                  { slug: { contains: '185', mode: 'insensitive' } },
                  { searchText: { contains: '185', mode: 'insensitive' } },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('includes SKU product ids as an alternate match path', () => {
    const where = buildAdminListingRowWhere(
      { search: '07521' },
      'en',
      ['product-1'],
    );

    expect(where.AND).toEqual([
      {
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
      },
    ]);
  });
});
