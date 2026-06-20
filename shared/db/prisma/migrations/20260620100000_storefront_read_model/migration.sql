-- Storefront PLP read-model foundation.
-- Operational catalog tables remain the source of truth; these tables are rebuilt/projected
-- for fast storefront listing and facet reads.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS "product_listing_rows" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "brandId" TEXT,
    "brandSlug" TEXT,
    "brandName" TEXT,
    "brandLogoUrl" TEXT,
    "primaryCategoryId" TEXT,
    "categoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "categorySlugs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compareAtPrice" DOUBLE PRECISION,
    "originalPrice" DOUBLE PRECISION,
    "priceSort" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "isSpecialPrice" BOOLEAN NOT NULL DEFAULT false,
    "defaultVariantId" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "inStock" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "labels" JSONB NOT NULL DEFAULT '[]',
    "colors" JSONB NOT NULL DEFAULT '[]',
    "warrantyYears" INTEGER,
    "requiresAttributeSelection" BOOLEAN NOT NULL DEFAULT false,
    "searchText" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "productCreatedAt" TIMESTAMP(3) NOT NULL,
    "productUpdatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "rebuiltAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_listing_rows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "product_facet_counts" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "facetType" TEXT NOT NULL,
    "facetKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "rebuiltAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_facet_counts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_listing_rows_productId_locale_key"
    ON "product_listing_rows"("productId", "locale");

CREATE UNIQUE INDEX IF NOT EXISTS "product_listing_rows_locale_slug_key"
    ON "product_listing_rows"("locale", "slug");

CREATE INDEX IF NOT EXISTS "product_listing_rows_locale_published_created_idx"
    ON "product_listing_rows"("locale", "isPublished", "deletedAt", "productCreatedAt" DESC);

CREATE INDEX IF NOT EXISTS "product_listing_rows_locale_brandId_idx"
    ON "product_listing_rows"("locale", "brandId");

CREATE INDEX IF NOT EXISTS "product_listing_rows_locale_brandSlug_idx"
    ON "product_listing_rows"("locale", "brandSlug");

CREATE INDEX IF NOT EXISTS "product_listing_rows_locale_priceSort_idx"
    ON "product_listing_rows"("locale", "priceSort");

CREATE INDEX IF NOT EXISTS "product_listing_rows_locale_promotion_idx"
    ON "product_listing_rows"("locale", "discountPercent" DESC, "productCreatedAt" DESC);

CREATE INDEX IF NOT EXISTS "product_listing_rows_categoryIds_gin_idx"
    ON "product_listing_rows" USING GIN ("categoryIds");

CREATE INDEX IF NOT EXISTS "product_listing_rows_categorySlugs_gin_idx"
    ON "product_listing_rows" USING GIN ("categorySlugs");

CREATE INDEX IF NOT EXISTS "product_listing_rows_searchText_trgm_idx"
    ON "product_listing_rows" USING GIN ("searchText" gin_trgm_ops);

CREATE UNIQUE INDEX IF NOT EXISTS "product_facet_counts_scope_value_key"
    ON "product_facet_counts"("locale", "scopeType", "scopeKey", "facetType", "facetKey", "value");

CREATE INDEX IF NOT EXISTS "product_facet_counts_scope_idx"
    ON "product_facet_counts"("locale", "scopeType", "scopeKey");

CREATE INDEX IF NOT EXISTS "product_facet_counts_scope_facet_idx"
    ON "product_facet_counts"("locale", "scopeType", "scopeKey", "facetType");

CREATE INDEX IF NOT EXISTS "product_facet_counts_locale_facet_value_idx"
    ON "product_facet_counts"("locale", "facetType", "value");
