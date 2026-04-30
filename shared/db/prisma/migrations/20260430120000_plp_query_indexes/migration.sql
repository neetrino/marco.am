-- Faster storefront listing filters (published + not deleted)
CREATE INDEX IF NOT EXISTS "products_published_deletedAt_idx" ON "products" ("published", "deletedAt");

-- Faster category facet / PLP filters using `categoryIds` array contains
CREATE INDEX IF NOT EXISTS "products_categoryIds_idx" ON "products" USING GIN ("categoryIds");

-- Faster variant option loads (filters, PDP includes)
CREATE INDEX IF NOT EXISTS "product_variant_options_variantId_idx" ON "product_variant_options" ("variantId");
