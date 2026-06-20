import { describe, expect, it } from 'vitest';
import { buildProductFacetCountRows } from '@/lib/read-model/product-facet-count-builder';

describe('buildProductFacetCountRows', () => {
  it('builds default and category-scoped brand/color/category/price facets', () => {
    const rows = buildProductFacetCountRows({
      rebuiltAt: new Date('2026-01-01T00:00:00.000Z'),
      categoryLabels: [
        { id: 'root', parentId: null, locale: 'en', slug: 'electronics', title: 'Electronics', position: 0 },
        { id: 'cat1', parentId: 'root', locale: 'en', slug: 'phones', title: 'Phones', position: 2 },
        { id: 'cat2', parentId: null, locale: 'en', slug: 'sale', title: 'Sale', position: 1 },
      ],
      rows: [
        {
          productId: 'p1',
          locale: 'en',
          brandId: 'b1',
          brandSlug: 'acme',
          brandName: 'Acme',
          brandLogoUrl: null,
          categoryIds: ['cat1', 'cat2'],
          colors: [{ value: 'Black', colors: ['#000'] }],
          sizeTokens: ['XL'],
          technicalSpecs: [
            {
              key: 'material',
              label: 'Material',
              type: 'select',
              value: 'metal',
              valueLabel: 'Metal',
            },
          ],
          priceSort: 100,
        },
        {
          productId: 'p2',
          locale: 'en',
          brandId: 'b1',
          brandSlug: 'acme',
          brandName: 'Acme',
          brandLogoUrl: null,
          categoryIds: ['cat1'],
          colors: [{ value: 'Black', colors: ['#000'] }, { value: 'White' }],
          sizeTokens: ['L'],
          technicalSpecs: [
            {
              key: 'material',
              label: 'Material',
              type: 'select',
              value: 'plastic',
              valueLabel: 'Plastic',
            },
          ],
          priceSort: 250,
        },
      ],
    });

    expect(
      rows.find(
        (row) =>
          row.scopeType === 'catalog' &&
          row.scopeKey === 'default' &&
          row.facetType === 'brand' &&
          row.value === 'acme',
      ),
    ).toMatchObject({ count: 2, label: 'Acme' });
    expect(
      rows.find(
        (row) =>
          row.scopeType === 'catalog' &&
          row.scopeKey === 'default' &&
          row.facetType === 'category' &&
          row.value === 'phones',
      ),
    ).toMatchObject({ count: 2, label: 'Phones', position: 2, meta: { categoryId: 'cat1' } });
    expect(
      rows.find(
        (row) =>
          row.scopeType === 'catalog' &&
          row.scopeKey === 'default' &&
          row.facetType === 'category' &&
          row.value === 'electronics',
      ),
    ).toMatchObject({ count: 2, label: 'Electronics', meta: { categoryId: 'root' } });
    expect(
      rows.find(
        (row) =>
          row.scopeType === 'catalog' &&
          row.scopeKey === 'default' &&
          row.facetType === 'color' &&
          row.value === 'black',
      ),
    ).toMatchObject({ count: 2, label: 'Black' });
    expect(
      rows.find(
        (row) =>
          row.scopeType === 'catalog' &&
          row.scopeKey === 'default' &&
          row.facetType === 'size' &&
          row.value === 'XL',
      ),
    ).toMatchObject({ count: 1, label: 'XL' });
    expect(
      rows.find(
        (row) =>
          row.scopeType === 'catalog' &&
          row.scopeKey === 'default' &&
          row.facetType === 'attribute' &&
          row.facetKey === 'material' &&
          row.value === 'metal',
      ),
    ).toMatchObject({
      count: 1,
      label: 'Metal',
      meta: { attributeLabel: 'Material', attributeType: 'select' },
    });
    expect(
      rows.find(
        (row) =>
          row.scopeType === 'category' &&
          row.scopeKey === 'electronics' &&
          row.facetType === 'brand' &&
          row.value === 'acme',
      ),
    ).toMatchObject({ count: 2 });
    expect(
      rows.find(
        (row) =>
          row.scopeType === 'catalog' &&
          row.scopeKey === 'default' &&
          row.facetType === 'price',
      )?.meta,
    ).toEqual({ min: 100, max: 250 });
  });

  it('can limit output to catalog and selected category scopes', () => {
    const rows = buildProductFacetCountRows({
      rebuiltAt: new Date('2026-01-01T00:00:00.000Z'),
      scopeFilter: {
        includeCatalog: true,
        categoryScopeKeys: ['phones'],
      },
      categoryLabels: [
        { id: 'root', parentId: null, locale: 'en', slug: 'electronics', title: 'Electronics', position: 0 },
        { id: 'cat1', parentId: 'root', locale: 'en', slug: 'phones', title: 'Phones', position: 2 },
        { id: 'cat2', parentId: null, locale: 'en', slug: 'sale', title: 'Sale', position: 1 },
      ],
      rows: [
        {
          productId: 'p1',
          locale: 'en',
          brandId: 'b1',
          brandSlug: 'acme',
          brandName: 'Acme',
          brandLogoUrl: null,
          categoryIds: ['cat1', 'cat2'],
          colors: [],
          sizeTokens: [],
          technicalSpecs: [],
          priceSort: 100,
        },
      ],
    });

    const scopes = [...new Set(rows.map((row) => `${row.scopeType}:${row.scopeKey}`))].sort();
    expect(scopes).toEqual(['catalog:default', 'category:phones']);
    expect(rows.some((row) => row.scopeType === 'category' && row.scopeKey === 'electronics')).toBe(false);
    expect(rows.some((row) => row.scopeType === 'category' && row.scopeKey === 'sale')).toBe(false);
  });
});
