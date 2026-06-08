/**
 * Facet sample size for color/size/attribute aggregation in `getFilters`.
 * Lower than the legacy 240 cap — keeps PLP sidebar responsive on cold cache.
 */
export const PRODUCT_FILTERS_SAMPLE_PRODUCT_LIMIT = 100;

/** Published variants scanned per product in the facet sample. */
export const PRODUCT_FILTERS_VARIANTS_PER_PRODUCT_LIMIT = 8;

/** Max brands returned from SQL `groupBy` facet aggregation. */
export const PRODUCT_FILTERS_BRANDS_GROUP_LIMIT = 80;

/** Skip descendant category enrichment when the facet tree already exceeds this size. */
export const PRODUCT_FILTERS_CATEGORY_DESCENDANT_ENRICHMENT_MAX_ROWS = 80;

/** Unscoped catalog: cap product IDs used for SQL color/size facet aggregation. */
export const PRODUCT_FILTERS_SQL_PRODUCT_ID_CAP = 2000;

/** Cap option rows scanned when aggregating color/size facets. */
export const PRODUCT_FILTERS_SQL_OPTION_ROWS_CAP = 4000;

/** Small variant sample for technical attribute facets on the SQL fast path. */
export const PRODUCT_FILTERS_ATTRIBUTE_FACET_SAMPLE_LIMIT = 50;

export const PRODUCT_FILTERS_ATTRIBUTE_FACET_VARIANTS_LIMIT = 4;
