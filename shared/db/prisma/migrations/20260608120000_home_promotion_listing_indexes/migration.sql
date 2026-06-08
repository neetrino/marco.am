-- Home promotion strip: faster product-level discount sort + variant compare-at lookup
CREATE INDEX IF NOT EXISTS "products_published_deletedAt_discountPercent_createdAt_idx"
  ON "products" ("published", "deletedAt", "discountPercent" DESC, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "product_variants_published_compareAtPrice_productId_idx"
  ON "product_variants" ("published", "compareAtPrice", "productId");
