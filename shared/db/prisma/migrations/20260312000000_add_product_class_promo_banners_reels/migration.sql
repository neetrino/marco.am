-- AlterTable: add productClass to products (default retail)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "productClass" TEXT NOT NULL DEFAULT 'retail';

-- AlterTable: add couponCode to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;

-- CreateTable: promo_codes
CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "minOrderAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_key" ON "promo_codes"("code");
CREATE INDEX IF NOT EXISTS "promo_codes_code_idx" ON "promo_codes"("code");
CREATE INDEX IF NOT EXISTS "promo_codes_active_idx" ON "promo_codes"("active");

-- CreateTable: banners
CREATE TABLE IF NOT EXISTS "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "banners_active_position_idx" ON "banners"("active", "position");

-- CreateTable: reels
CREATE TABLE IF NOT EXISTS "reels" (
    "id" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reels_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "reels_active_position_idx" ON "reels"("active", "position");

-- CreateTable: reel_likes
CREATE TABLE IF NOT EXISTS "reel_likes" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reel_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "reel_likes_reelId_userId_key" ON "reel_likes"("reelId", "userId");
CREATE INDEX IF NOT EXISTS "reel_likes_reelId_idx" ON "reel_likes"("reelId");
CREATE INDEX IF NOT EXISTS "reel_likes_userId_idx" ON "reel_likes"("userId");

-- AddForeignKey: reel_likes -> reels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reel_likes_reelId_fkey'
  ) THEN
    ALTER TABLE "reel_likes" ADD CONSTRAINT "reel_likes_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "reels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: reel_likes -> users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reel_likes_userId_fkey'
  ) THEN
    ALTER TABLE "reel_likes" ADD CONSTRAINT "reel_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
