-- Product-level attribute values for simple/filter-only product attributes.
-- This is additive: existing product_variants/product_variant_options stay intact.

CREATE TABLE IF NOT EXISTS "product_attribute_values" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "attributeId" TEXT NOT NULL,
  "attributeValueId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "product_attribute_values_productId_attributeValueId_key"
ON "product_attribute_values"("productId", "attributeValueId");

CREATE INDEX IF NOT EXISTS "product_attribute_values_productId_idx"
ON "product_attribute_values"("productId");

CREATE INDEX IF NOT EXISTS "product_attribute_values_attributeId_idx"
ON "product_attribute_values"("attributeId");

CREATE INDEX IF NOT EXISTS "product_attribute_values_attributeValueId_idx"
ON "product_attribute_values"("attributeValueId");

CREATE INDEX IF NOT EXISTS "product_attribute_values_productId_attributeId_idx"
ON "product_attribute_values"("productId", "attributeId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_attribute_values_productId_fkey'
  ) THEN
    ALTER TABLE "product_attribute_values"
    ADD CONSTRAINT "product_attribute_values_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_attribute_values_attributeId_fkey'
  ) THEN
    ALTER TABLE "product_attribute_values"
    ADD CONSTRAINT "product_attribute_values_attributeId_fkey"
    FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_attribute_values_attributeValueId_fkey'
  ) THEN
    ALTER TABLE "product_attribute_values"
    ADD CONSTRAINT "product_attribute_values_attributeValueId_fkey"
    FOREIGN KEY ("attributeValueId") REFERENCES "attribute_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
