import { describe, expect, it } from 'vitest';
import {
  buildAllowedCategorySlugs,
  collectCategoryFilterExpandKeys,
  findDeepestSelectedCategorySlug,
  type ShopCategoryFilterTreeNode,
} from '@/lib/shop-category-filter-descendant-slugs';

const tree: ShopCategoryFilterTreeNode[] = [
  {
    slug: 'furniture',
    children: [
      {
        slug: 'sofas',
        children: [{ slug: 'corner-sofas', children: [] }],
      },
      { slug: 'tables', children: [] },
    ],
  },
  {
    slug: 'lighting',
    children: [{ slug: 'lamps', children: [] }],
  },
];

describe('collectCategoryFilterExpandKeys', () => {
  it('returns empty set when nothing is selected', () => {
    expect(collectCategoryFilterExpandKeys(tree, [])).toEqual(new Set());
  });

  it('expands ancestors of a selected subcategory', () => {
    expect(collectCategoryFilterExpandKeys(tree, ['corner-sofas'])).toEqual(
      new Set(['furniture', 'sofas']),
    );
  });

  it('does not expand unrelated branches', () => {
    expect(collectCategoryFilterExpandKeys(tree, ['lamps'])).toEqual(new Set(['lighting']));
  });

  it('expands ancestors for each selected slug', () => {
    expect(collectCategoryFilterExpandKeys(tree, ['tables', 'lamps'])).toEqual(
      new Set(['furniture', 'lighting']),
    );
  });

  it('does not expand the selected root category itself', () => {
    expect(collectCategoryFilterExpandKeys(tree, ['furniture'])).toEqual(new Set());
  });
});

describe('findDeepestSelectedCategorySlug', () => {
  it('returns null when nothing is selected', () => {
    expect(findDeepestSelectedCategorySlug(tree, [])).toBeNull();
  });

  it('returns the deepest selected slug', () => {
    expect(findDeepestSelectedCategorySlug(tree, ['furniture', 'corner-sofas'])).toBe(
      'corner-sofas',
    );
  });

  it('returns a root slug when only the root is selected', () => {
    expect(findDeepestSelectedCategorySlug(tree, ['lighting'])).toBe('lighting');
  });
});

describe('buildAllowedCategorySlugs', () => {
  it('includes descendants for a selected parent slug', () => {
    const allowed = buildAllowedCategorySlugs(tree, ['sofas']);
    expect(allowed.has('sofas')).toBe(true);
    expect(allowed.has('corner-sofas')).toBe(true);
    expect(allowed.has('tables')).toBe(false);
  });
});
