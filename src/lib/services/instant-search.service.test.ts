import { describe, expect, it, vi } from 'vitest';
import {
  parseInstantSearchRequest,
  searchInstant,
  type InstantSearchDbClient,
} from './instant-search.service';

describe('instant-search.service', () => {
  it('parses limits and locale with backward-compatible limit alias', () => {
    const params = new URLSearchParams({
      q: 'iph',
      lang: 'RU',
      limit: '6',
      categoryLimit: '3',
    });

    const parsed = parseInstantSearchRequest({ searchParams: params });
    expect(parsed).toEqual({
      query: 'iph',
      locale: 'ru',
      productLimit: 6,
      categoryLimit: 3,
    });
  });

  it('uses Accept-Language and hy primary fallback', () => {
    const parsedFromHeader = parseInstantSearchRequest({
      searchParams: new URLSearchParams({ q: 'tv' }),
      acceptLanguageRaw: 'ru-RU,ru;q=0.9,en-US;q=0.8',
    });
    expect(parsedFromHeader.locale).toBe('ru');

    const parsedDefault = parseInstantSearchRequest({
      searchParams: new URLSearchParams({ q: 'tv' }),
      acceptLanguageRaw: 'de-DE,de;q=0.9',
    });
    expect(parsedDefault.locale).toBe('hy');
  });

  it('returns normalized empty response when query is blank', async () => {
    const dbClient: InstantSearchDbClient = {
      product: { findMany: vi.fn().mockResolvedValue([]) },
      category: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const response = await searchInstant(
      {
        query: '',
        locale: 'en',
        productLimit: 8,
        categoryLimit: 4,
      },
      dbClient
    );

    expect(response.results).toEqual([]);
    expect(response.categories).toEqual([]);
    expect(response.suggestions).toEqual([]);
    expect(dbClient.product.findMany).not.toHaveBeenCalled();
    expect(dbClient.category.findMany).not.toHaveBeenCalled();
  });

  it('returns products, categories, and merged suggestions', async () => {
    const dbClient: InstantSearchDbClient = {
      product: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'prod-1',
            primaryCategoryId: 'cat-1',
            media: [],
            translations: [
              { locale: 'en', slug: 'iphone-15', title: 'iPhone 15' },
              { locale: 'hy', slug: 'iphone-15-hy', title: 'iPhone 15 HY' },
            ],
            variants: [
              {
                price: 529000,
                discountType: 'AMOUNT',
                discountValue: 499000,
                discountExpiresAt: null,
                imageUrl: null,
              },
            ],
            categories: [
              {
                id: 'cat-1',
                translations: [{ locale: 'en', title: 'Smartphones' }],
              },
            ],
          },
        ]),
      },
      category: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'cat-1',
            translations: [
              {
                locale: 'en',
                slug: 'smartphones',
                title: 'Smartphones',
                fullPath: 'Electronics / Smartphones',
              },
            ],
          },
        ]),
      },
    };

    const response = await searchInstant(
      {
        query: 'iph',
        locale: 'en',
        productLimit: 6,
        categoryLimit: 4,
      },
      dbClient
    );

    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({
      id: 'prod-1',
      slug: 'iphone-15',
      title: 'iPhone 15',
      price: 499000,
      compareAtPrice: 529000,
      category: 'Smartphones',
      href: '/products/iphone-15',
    });

    expect(response.categories).toHaveLength(1);
    expect(response.categories[0]).toEqual({
      id: 'cat-1',
      slug: 'smartphones',
      title: 'Smartphones',
      fullPath: 'Electronics / Smartphones',
      href: '/products?category=smartphones',
    });

    expect(response.suggestions).toEqual([
      {
        id: 'prod-1',
        type: 'product',
        title: 'iPhone 15',
        subtitle: 'Smartphones',
        href: '/products/iphone-15',
      },
      {
        id: 'cat-1',
        type: 'category',
        title: 'Smartphones',
        subtitle: 'Electronics / Smartphones',
        href: '/products?category=smartphones',
      },
    ]);
  });
});
