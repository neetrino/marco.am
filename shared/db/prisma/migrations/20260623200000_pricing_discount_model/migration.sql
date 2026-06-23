-- Unified pricing model: `price` is the standard (base) price; the final price is
-- derived from a typed discount (PERCENT off, or AMOUNT = fixed sale price) on the
-- product and/or variant. Replaces the legacy `products.discountPercent` and
-- `product_variants.compareAtPrice` columns.

-- 1. Discount type enum.
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENT', 'AMOUNT');

-- 2. Products: typed discount columns.
ALTER TABLE "products" ADD COLUMN "discountType" "DiscountType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "products" ADD COLUMN "discountValue" DOUBLE PRECISION;

-- Backfill product-level percent discounts into the new model.
UPDATE "products"
SET "discountType" = 'PERCENT', "discountValue" = "discountPercent"
WHERE "discountPercent" > 0;

-- 3. Variants: typed discount columns + own expiry.
ALTER TABLE "product_variants" ADD COLUMN "discountType" "DiscountType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "product_variants" ADD COLUMN "discountValue" DOUBLE PRECISION;
ALTER TABLE "product_variants" ADD COLUMN "discountExpiresAt" TIMESTAMP(3);

-- Backfill: where a manual "old price" existed (compareAtPrice > price), the stored
-- `price` was the sale price and `compareAtPrice` was the standard. Promote the standard
-- to `price` and keep the sale price as an AMOUNT discount so the displayed result is unchanged.
UPDATE "product_variants"
SET "discountType" = 'AMOUNT',
    "discountValue" = "price",
    "price" = "compareAtPrice"
WHERE "compareAtPrice" IS NOT NULL AND "compareAtPrice" > "price";

-- 4. Swap legacy sort/filter indexes for discount-type indexes.
DROP INDEX IF EXISTS "products_published_deletedAt_discountPercent_createdAt_idx";
CREATE INDEX "products_published_deletedAt_discountType_createdAt_idx"
  ON "products" ("published", "deletedAt", "discountType", "createdAt" DESC);

DROP INDEX IF EXISTS "product_variants_published_compareAtPrice_productId_idx";
CREATE INDEX "product_variants_published_discountType_productId_idx"
  ON "product_variants" ("published", "discountType", "productId");

-- 5. Drop legacy columns.
ALTER TABLE "products" DROP COLUMN "discountPercent";
ALTER TABLE "product_variants" DROP COLUMN "compareAtPrice";
