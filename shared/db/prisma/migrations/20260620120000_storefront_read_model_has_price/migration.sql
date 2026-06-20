-- Add a denormalized price-presence flag so the PLP listing can segment
-- (priced wall first, unpriced below) instead of hard-filtering by price presence.
ALTER TABLE "product_listing_rows"
  ADD COLUMN IF NOT EXISTS "hasPrice" BOOLEAN NOT NULL DEFAULT false;

UPDATE "product_listing_rows"
  SET "hasPrice" = ("priceSort" > 0)
  WHERE "hasPrice" <> ("priceSort" > 0);

CREATE INDEX IF NOT EXISTS "product_listing_rows_locale_hasPrice_created_idx"
  ON "product_listing_rows" ("locale", "hasPrice", "productCreatedAt" DESC);
