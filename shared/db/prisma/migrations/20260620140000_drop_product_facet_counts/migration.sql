-- Storefront PLP facets are now computed live from "product_listing_rows" (drill-down
-- aggregation), so the precomputed facet-count projection is no longer read or written.
DROP TABLE IF EXISTS "product_facet_counts";
