-- CreateTable
CREATE TABLE "product_pdp_rows" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "slugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "payload" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "productUpdatedAt" TIMESTAMP(3) NOT NULL,
    "rebuiltAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pdp_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_pdp_rows_productId_locale_key" ON "product_pdp_rows"("productId", "locale");

-- CreateIndex
CREATE INDEX "product_pdp_rows_locale_slug_idx" ON "product_pdp_rows"("locale", "slug");

-- CreateIndex
CREATE INDEX "product_pdp_rows_slugs_idx" ON "product_pdp_rows" USING GIN ("slugs");
