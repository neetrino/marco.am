import { describe, expect, it } from 'vitest';
import {
  PLP_ATTRIBUTE_FACET_MAX_GROUPS,
  PLP_ATTRIBUTE_FACET_MIN_PRODUCTS,
  filterVisibleAttributeFacets,
} from '@/lib/read-model/product-facet-visibility';
import type { TechnicalSpecFacet } from '@/lib/services/products-technical-filters';

function facet(key: string, label: string, counts: number[]): TechnicalSpecFacet {
  return {
    key,
    label,
    type: 'select',
    values: counts.map((count, index) => ({
      value: `${key}-${index}`,
      label: `${key}-${index}`,
      count,
    })),
  };
}

describe('filterVisibleAttributeFacets', () => {
  it('drops sparse facets and caps group count', () => {
    const input = [
      facet('a', 'A', [10, 5]),
      facet('b', 'B', [2]),
      facet('c', 'C', [8]),
      facet('d', 'D', [PLP_ATTRIBUTE_FACET_MIN_PRODUCTS]),
    ];

    const visible = filterVisibleAttributeFacets(input, { categorySlugTokens: ['tekhnika-ev-elektronika'] });
    expect(visible.some((row) => row.key === 'b')).toBe(false);
    expect(visible.length).toBeLessThanOrEqual(PLP_ATTRIBUTE_FACET_MAX_GROUPS);
    expect(visible[0]?.key).toBe('a');
  });

  it('hides facets without category scope', () => {
    const visible = filterVisibleAttributeFacets([facet('a', 'A', [10])], { categorySlugTokens: [] });
    expect(visible).toEqual([]);
  });

  it('hides facets for blocklisted furniture categories', () => {
    const visible = filterVisibleAttributeFacets([facet('a', 'A', [10])], {
      categorySlugTokens: ['papovk-kahovyq'],
    });
    expect(visible).toEqual([]);
  });
});
