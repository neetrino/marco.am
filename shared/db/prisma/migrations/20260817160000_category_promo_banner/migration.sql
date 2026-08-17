-- Mega-menu promo strip per root category: star toggle (image URL added in follow-up migration).
ALTER TABLE "categories"
ADD COLUMN IF NOT EXISTS "promoBannerEnabled" BOOLEAN NOT NULL DEFAULT false;
