/**
 * Import products from Marco WooCommerce-style CSV into Neon (Prisma) and Cloudflare R2.
 *
 * Usage (from repo root):
 *   pnpm run import:products-csv -- "C:\path\Marco - Sheet1.csv"
 *
 * Requires: DATABASE_URL, R2_* vars (see .env.example). Optional: --dry-run
 */

import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { nanoid } from "nanoid";
import { db } from "@white-shop/db";
import { adminProductsCreateService } from "@/lib/services/admin/admin-products-create.service";
import { logger } from "@/lib/utils/logger";
import {
  DEFAULT_STOCK,
  LOCALE,
  buildR2Client,
  findOrCreateBrandId,
  parseCsvRows,
  parseImportArgs,
  parseMoney,
  productSlug,
  resolveCategoryIdsFromHyPath,
  splitImageUrls,
  uploadRowImagesToR2,
} from "@/scripts/marco-csv-import/lib";

function loadEnv(): void {
  loadEnvConfig(process.cwd());
}

async function main(): Promise<void> {
  loadEnv();
  const { csvPath, dryRun } = parseImportArgs(process.argv.slice(2));

  const raw = readFileSync(csvPath, "utf8");
  const rows = parseCsvRows(raw);

  const bucket = process.env.R2_BUCKET_NAME ?? "";
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  const r2 = dryRun ? null : buildR2Client();

  if (!dryRun) {
    if (!r2 || !bucket || !publicUrl) {
      throw new Error("R2 is not configured (R2_ACCOUNT_ID, keys, R2_BUCKET_NAME, R2_PUBLIC_URL).");
    }
  }

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const sku = (row["SKU"] ?? "").trim();
    const name = (row["Name"] ?? "").trim();
    if (!sku || !name) {
      skipped += 1;
      continue;
    }

    const existing = await db.productVariant.findUnique({ where: { sku } });
    if (existing) {
      skipped += 1;
      logger.alwaysInfo(`[skip] SKU already exists: ${sku}`);
      continue;
    }

    const listPrice = parseMoney(row["price"]);
    const salePrice = parseMoney(row["Sale price"]);
    if (listPrice === undefined) {
      skipped += 1;
      logger.warn(`[skip] No price for SKU ${sku}`);
      continue;
    }

    const variantPrice = salePrice !== undefined && salePrice > 0 ? salePrice : listPrice;
    const compareAt =
      salePrice !== undefined && salePrice > 0 && listPrice > salePrice ? listPrice : undefined;

    const legacyId = (row["ID"] ?? "").trim() || nanoid(8);
    const imagesCell = row["Images"] ?? "";
    const urls = splitImageUrls(imagesCell);

    if (dryRun) {
      logger.alwaysInfo(`[dry-run] ${sku} ${name} images=${urls.length}`);
      ok += 1;
      continue;
    }

    const media =
      r2 !== null ? await uploadRowImagesToR2(r2, bucket, publicUrl, legacyId, urls) : [];

    if (urls.length > 0 && media.length === 0) {
      logger.warn(`No images uploaded for ${sku}; continuing with empty media.`);
    }

    const brandName = (row["Brand"] ?? "").trim();
    const brandId = brandName ? await findOrCreateBrandId(brandName) : undefined;
    const categoryCell = row["Category"] ?? "";
    const { categoryIds, primaryCategoryId } = await resolveCategoryIdsFromHyPath(categoryCell);

    const slug = productSlug(name, sku);
    const shortDesc = (row["Short description"] ?? "").trim();
    const desc = (row["Description"] ?? "").trim();
    const color = (row["Color"] ?? "").trim();

    try {
      await adminProductsCreateService.createProduct({
        title: name,
        slug,
        subtitle: shortDesc || undefined,
        descriptionHtml: desc || undefined,
        brandId: brandId ?? undefined,
        primaryCategoryId,
        categoryIds,
        published: true,
        locale: LOCALE,
        media: media.length > 0 ? media : undefined,
        mainProductImage: media[0],
        variants: [
          {
            price: variantPrice,
            compareAtPrice: compareAt,
            stock: DEFAULT_STOCK,
            sku,
            color: color || undefined,
            imageUrl: media[0],
            published: true,
          },
        ],
      });
      ok += 1;
      logger.alwaysInfo(`[ok] ${sku} ${name}`);
    } catch (e) {
      failed += 1;
      logger.error(`[fail] ${sku}`, { error: e });
    }
  }

  logger.alwaysInfo("Import finished", { ok, skipped, failed, dryRun });
  await db.$disconnect();
}

main().catch((e) => {
  logger.error("Import script failed", { error: e });
  void db.$disconnect();
  process.exit(1);
});
