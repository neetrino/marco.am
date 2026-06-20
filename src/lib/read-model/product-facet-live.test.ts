import { describe, expect, it } from 'vitest';
import { buildFacetWhere, type PlpFacetFilterInput } from '@/lib/read-model/product-facet-live-where';
import { rollupCategoryCounts } from '@/lib/read-model/product-facet-live-aggregation';

function baseInput(overrides: Partial<PlpFacetFilterInput> = {}): PlpFacetFilterInput {
  return {
    locale: 'en',
    categorySlugTokens: ['sofas'],
    categoryIdTokens: [],
    brandTokens: ['acme'],
    colorTokens: ['black'],
    sizeTokens: [],
    technicalSpecGroups: [],
    search: null,
    minPrice: undefined,
    maxPrice: undefined,
    promotion: false,
    newOnly: false,
    ...overrides,
  };
}

function sqlText(input: PlpFacetFilterInput, except: Set<string>): string {
  return buildFacetWhere(input, except).strings.join(' ');
}

describe('buildFacetWhere drill-down', () => {
  it('applies every active filter when nothing is excluded', () => {
    const text = sqlText(baseInput(), new Set());
    expect(text).toContain('"locale"');
    expect(text).toContain('"brandId"');
    expect(text).toContain('"colorTokens"');
    expect(text).toContain('"categorySlugs"');
  });

  it('excludes the brand dimension so sibling brands stay countable', () => {
    const text = sqlText(baseInput(), new Set(['brand']));
    expect(text).not.toContain('"brandId"');
    expect(text).not.toContain('"brandSlug"');
    expect(text).toContain('"colorTokens"');
    expect(text).toContain('"categorySlugs"');
  });

  it('excludes the color dimension while keeping other filters', () => {
    const text = sqlText(baseInput(), new Set(['color']));
    expect(text).not.toContain('"colorTokens"');
    expect(text).toContain('"brandId"');
    expect(text).toContain('"categorySlugs"');
  });

  it('prefers locale-agnostic category IDs over slugs when resolved', () => {
    const text = sqlText(baseInput({ categoryIdTokens: ['cat-1'] }), new Set());
    expect(text).toContain('"categoryIds"');
    expect(text).not.toContain('"categorySlugs"');
  });

  it('keeps contextual filters (search, promotion) regardless of exclusions', () => {
    const text = sqlText(
      baseInput({ search: 'sofa', promotion: true }),
      new Set(['brand', 'color', 'category', 'price']),
    );
    expect(text).toContain('"searchText" ILIKE');
    expect(text).toContain('"discountPercent" > 0 OR "isSpecialPrice" = true');
  });
});

describe('rollupCategoryCounts', () => {
  it('counts distinct products for a category and rolls them up to ancestors', () => {
    const parentById = new Map<string, string | null>([
      ['child', 'root'],
      ['root', null],
      ['other', null],
    ]);
    const counts = rollupCategoryCounts(
      [
        { categoryId: 'child', productId: 'p1' },
        { categoryId: 'child', productId: 'p2' },
        { categoryId: 'other', productId: 'p3' },
      ],
      parentById,
    );
    expect(counts.get('child')).toBe(2);
    expect(counts.get('root')).toBe(2);
    expect(counts.get('other')).toBe(1);
  });

  it('does not double-count a product present in both a parent and its child', () => {
    const parentById = new Map<string, string | null>([
      ['child', 'root'],
      ['root', null],
    ]);
    const counts = rollupCategoryCounts(
      [
        { categoryId: 'child', productId: 'p1' },
        { categoryId: 'root', productId: 'p1' },
      ],
      parentById,
    );
    expect(counts.get('root')).toBe(1);
    expect(counts.get('child')).toBe(1);
  });
});
