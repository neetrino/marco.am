import type { TechnicalSpecFacet } from '@/lib/services/products-technical-filters';
import { isAttributeFacetScopeAllowed } from '@/constants/plp-category-facet-policy';

export type AttributeFacetVisibilityContext = {
  categorySlugTokens?: readonly string[];
};

/** Minimum distinct products in scope that must carry a facet before it is shown. */
export const PLP_ATTRIBUTE_FACET_MIN_PRODUCTS = 3;

/** Cap sidebar technical facets so wide Excel imports do not overwhelm PLP. */
export const PLP_ATTRIBUTE_FACET_MAX_GROUPS = 12;

function facetProductCoverage(facet: TechnicalSpecFacet): number {
  return facet.values.reduce((max, option) => Math.max(max, option.count), 0);
}

/** Hide sparse/noisy imported facets; keep the most useful groups for the current PLP scope. */
export function filterVisibleAttributeFacets(
  facets: TechnicalSpecFacet[],
  context: AttributeFacetVisibilityContext = {},
): TechnicalSpecFacet[] {
  const categorySlugTokens = context.categorySlugTokens ?? [];
  if (!isAttributeFacetScopeAllowed(categorySlugTokens)) {
    return [];
  }

  return facets
    .filter((facet) => facetProductCoverage(facet) >= PLP_ATTRIBUTE_FACET_MIN_PRODUCTS)
    .sort(
      (left, right) =>
        facetProductCoverage(right) - facetProductCoverage(left) ||
        left.label.localeCompare(right.label),
    )
    .slice(0, PLP_ATTRIBUTE_FACET_MAX_GROUPS);
}
