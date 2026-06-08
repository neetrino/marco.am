-- Step 1: add structured description column (data migration via src/scripts/migrate-product-descriptions-to-json.ts).
ALTER TABLE "product_translations" ADD COLUMN IF NOT EXISTS "description" JSONB;
