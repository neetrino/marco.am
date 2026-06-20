-- Add indexed filter tokens to the PLP read model so color/size/spec filters
-- can stay on the projection table instead of joining operational variant tables.
ALTER TABLE "product_listing_rows"
  ADD COLUMN IF NOT EXISTS "colorTokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "sizeTokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "technicalSpecTokens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "technicalSpecs" JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS "product_listing_rows_colorTokens_idx"
  ON "product_listing_rows" USING GIN ("colorTokens");

CREATE INDEX IF NOT EXISTS "product_listing_rows_sizeTokens_idx"
  ON "product_listing_rows" USING GIN ("sizeTokens");

CREATE INDEX IF NOT EXISTS "product_listing_rows_technicalSpecTokens_idx"
  ON "product_listing_rows" USING GIN ("technicalSpecTokens");
