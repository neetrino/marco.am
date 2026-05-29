-- Product listing / filtering performance indexes (safe additive migration)
CREATE INDEX IF NOT EXISTS "products_primaryCategoryId_idx"
  ON "products" ("primaryCategoryId");

CREATE INDEX IF NOT EXISTS "products_published_deletedAt_createdAt_idx"
  ON "products" ("published", "deletedAt", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "product_translations_locale_title_idx"
  ON "product_translations" ("locale", "title");

CREATE INDEX IF NOT EXISTS "product_variants_published_price_idx"
  ON "product_variants" ("published", "price");

CREATE INDEX IF NOT EXISTS "product_variants_productId_published_price_idx"
  ON "product_variants" ("productId", "published", "price");

CREATE INDEX IF NOT EXISTS "product_variant_options_attributeKey_value_idx"
  ON "product_variant_options" ("attributeKey", "value");
