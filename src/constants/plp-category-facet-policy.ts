/**
 * PLP attribute facet visibility policy.
 * Attribute facets are noisy without a category scope (wide Excel import).
 */

/** Hide technical-spec facets on `/products` until a category is selected. */
export const PLP_REQUIRE_CATEGORY_FOR_ATTRIBUTE_FACETS = true;

/**
 * Category slugs where published products never carry technical specs.
 * Explicit blocklist avoids pointless facet queries on furniture / hardware-only trees.
 */
export const PLP_ATTRIBUTE_FACETS_DISABLED_CATEGORY_SLUGS: ReadonlySet<string> = new Set([
  'aqsesovar-2',
  'ardovkner-2',
  'blenderner',
  'darakneri-hamakarg-2',
  'dzerqi-blender-2',
  'elektrakan-teynikner',
  'furniture-soft-seating',
  'hagovsti-mekhanizm-2',
  'harichner',
  'inqnakpchovn-2',
  'jri-dispenserner-2',
  'kahovyq',
  'kahovyqi-brnak-2',
  'kahovyqi-otq-2',
  'kahovyqi-tskhni-2',
  'movlti-epichner',
  'msaghatsner',
  'papovk-kahovyq',
  'papovk-kahovyq-2',
  'poshekovlner-2',
  'qarits-lvatsaranner-2',
  'sendvich-ev-vafli-patrastogh-sarqer-2',
  'spasqi-mekhanizm-2',
  'srchepner',
  'tandem-2',
  'tosterner',
  'tsorak-2',
]);

/** Returns false when attribute facets must not render for the active PLP category scope. */
export function isAttributeFacetScopeAllowed(categorySlugTokens: readonly string[]): boolean {
  if (PLP_REQUIRE_CATEGORY_FOR_ATTRIBUTE_FACETS && categorySlugTokens.length === 0) {
    return false;
  }
  if (categorySlugTokens.length === 0) {
    return true;
  }
  return !categorySlugTokens.some((slug) => PLP_ATTRIBUTE_FACETS_DISABLED_CATEGORY_SLUGS.has(slug));
}
