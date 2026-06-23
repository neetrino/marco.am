-- Optional UTC expiry for product-level discounts (auto-ignored after this moment).
ALTER TABLE "products" ADD COLUMN "discountExpiresAt" TIMESTAMP(3);

-- Denormalized on listing read-model rows for admin discount UI.
ALTER TABLE "product_listing_rows" ADD COLUMN "discountExpiresAt" TIMESTAMP(3);
