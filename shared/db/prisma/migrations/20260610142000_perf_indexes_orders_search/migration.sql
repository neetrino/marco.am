-- Orders analytics / dashboard: paid status + date range filters
CREATE INDEX IF NOT EXISTS "orders_paymentStatus_createdAt_idx"
ON "orders"("paymentStatus", "createdAt" DESC);

-- Category traversal / tree filters
CREATE INDEX IF NOT EXISTS "categories_parent_published_deleted_position_idx"
ON "categories"("parentId", "published", "deletedAt", "position");

CREATE INDEX IF NOT EXISTS "categories_published_deleted_showinheader_position_idx"
ON "categories"("published", "deletedAt", "showInHeader", "position");

-- Category-to-product relation reverse lookup
CREATE INDEX IF NOT EXISTS "_ProductCategories_A_index"
ON "_ProductCategories"("A");

-- User list in admin sorted by createdAt with deletedAt filter
CREATE INDEX IF NOT EXISTS "users_deletedAt_createdAt_idx"
ON "users"("deletedAt", "createdAt" DESC);

-- Trigram text search indexes (requires pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "product_translations_title_trgm_idx"
ON "product_translations" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "product_translations_subtitle_trgm_idx"
ON "product_translations" USING GIN ("subtitle" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "category_translations_title_trgm_idx"
ON "category_translations" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "category_translations_slug_trgm_idx"
ON "category_translations" USING GIN ("slug" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "category_translations_fullPath_trgm_idx"
ON "category_translations" USING GIN ("fullPath" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "product_variants_sku_trgm_idx"
ON "product_variants" USING GIN ("sku" gin_trgm_ops);
