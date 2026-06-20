/**
 * Reconcile Marco catalog DB with Excel source (drafts, brands, SKU fixes).
 *
 * Build manifest first:
 *   python scripts/build-marco-reconcile-manifest.py
 *
 * Dry-run:
 *   node scripts/marco-import-reconcile.cjs --dry-run
 *
 * Apply:
 *   node scripts/marco-import-reconcile.cjs --execute
 *
 * Optional: upload Pacific/DISAKULP logos from BRANDS MARCO/20/
 *   node scripts/marco-import-reconcile.cjs --execute --upload-brand-logos
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

require("@next/env").loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client",
));

const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "docs",
  "reports",
  "marco-import-reconcile-manifest.json",
);
const TEMP_SKU_PREFIX = "__RECONCILE__";
const BRAND_LOGO_FILES = [
  { slug: "pacific", file: "pacific.png" },
  { slug: "disakulp", file: "disa-kulp.png" },
];

const prisma = new PrismaClient();

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Manifest not found: ${MANIFEST_PATH}\nRun: python scripts/build-marco-reconcile-manifest.py`,
    );
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

async function unpublishProducts(productIds) {
  if (productIds.length === 0) return 0;
  const result = await prisma.product.updateMany({
    where: { id: { in: productIds }, deletedAt: null },
    data: { published: false, publishedAt: null },
  });
  await prisma.productVariant.updateMany({
    where: { productId: { in: productIds } },
    data: { published: false },
  });
  return result.count;
}

async function clearBrandBySkus(skus) {
  if (skus.length === 0) return 0;
  const variants = await prisma.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { productId: true },
  });
  const productIds = [...new Set(variants.map((v) => v.productId))];
  if (productIds.length === 0) return 0;
  const result = await prisma.product.updateMany({
    where: { id: { in: productIds }, deletedAt: null, brandId: { not: null } },
    data: { brandId: null },
  });
  return result.count;
}

async function applySkuUpdates(updates) {
  let applied = 0;
  for (const row of updates) {
    const variant = await prisma.productVariant.findFirst({
      where: { barcode: row.legacyId },
      select: { id: true, sku: true, productId: true },
    });
    if (!variant) continue;
    if (variant.sku === row.newSku) continue;

    const conflict = await prisma.productVariant.findUnique({
      where: { sku: row.newSku },
      select: { id: true },
    });
    if (conflict && conflict.id !== variant.id) {
      console.warn(
        `[reconcile] SKU conflict ${row.newSku} for legacy ${row.legacyId} (${row.name})`,
      );
      continue;
    }

    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { sku: `${TEMP_SKU_PREFIX}${variant.id}` },
    });
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { sku: row.newSku },
    });
    applied += 1;
  }
  return applied;
}

async function softDeleteJunkBrands(names) {
  const brands = await prisma.brand.findMany({
    where: {
      deletedAt: null,
      translations: { some: { name: { in: names, mode: "insensitive" } } },
    },
    select: { id: true, translations: { where: { locale: "hy" }, select: { name: true } } },
  });

  let cleared = 0;
  let deleted = 0;
  for (const brand of brands) {
    const clearedProducts = await prisma.product.updateMany({
      where: { brandId: brand.id, deletedAt: null },
      data: { brandId: null },
    });
    cleared += clearedProducts.count;
    await prisma.brand.update({
      where: { id: brand.id },
      data: { published: false, deletedAt: new Date() },
    });
    deleted += 1;
    console.log(
      `[reconcile] junk brand removed: ${brand.translations[0]?.name ?? brand.id} (products cleared: ${clearedProducts.count})`,
    );
  }
  return { cleared, deleted };
}

async function purgeSoftDeletedProducts() {
  const deleted = await prisma.product.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true },
  });
  if (deleted.length === 0) return 0;
  const result = await prisma.product.deleteMany({
    where: { id: { in: deleted.map((p) => p.id) } },
  });
  return result.count;
}

function createR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function uploadBrandLogos() {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  if (!bucket || !publicUrl) {
    throw new Error("R2_BUCKET_NAME and R2_PUBLIC_URL required");
  }

  const client = createR2Client();
  const baseDir = path.join(process.cwd(), "BRANDS MARCO", "20");
  let uploaded = 0;

  for (const entry of BRAND_LOGO_FILES) {
    const sourcePath = path.join(baseDir, entry.file);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`[reconcile] logo file missing: ${sourcePath}`);
      continue;
    }

    const brand = await prisma.brand.findFirst({
      where: { slug: entry.slug, deletedAt: null },
      select: { id: true },
    });
    if (!brand) {
      console.warn(`[reconcile] brand not found for slug ${entry.slug}`);
      continue;
    }

    const webp = await sharp(fs.readFileSync(sourcePath)).rotate().webp({ quality: 82 }).toBuffer();
    const key = `brands/logos/${entry.slug}.webp`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: webp,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const logoUrl = `${publicUrl}/${key}`;
    await prisma.brand.update({ where: { id: brand.id }, data: { logoUrl } });
    uploaded += 1;
    console.log(`[reconcile] logo uploaded: ${entry.slug} -> ${logoUrl}`);
  }

  return uploaded;
}

async function planActions(manifest) {
  const draftVariants = await prisma.productVariant.findMany({
    where: {
      sku: { in: manifest.draftSkus },
      product: { deletedAt: null, published: true },
    },
    select: { productId: true, sku: true },
  });

  const syntheticPublished = await prisma.productVariant.findMany({
    where: {
      sku: { startsWith: "MARCO-" },
      product: { deletedAt: null, published: true },
    },
    select: { productId: true, sku: true, barcode: true },
  });

  const clearBrandVariants = await prisma.productVariant.findMany({
    where: {
      sku: { in: manifest.clearBrandSkus },
      product: { deletedAt: null, brandId: { not: null } },
    },
    select: { productId: true, sku: true },
  });

  const skuUpdates = [];
  for (const row of manifest.articuleUpdates) {
    const variant = await prisma.productVariant.findFirst({
      where: { barcode: row.legacyId },
      select: { sku: true },
    });
    if (!variant) {
      skuUpdates.push({ ...row, status: "missing_in_db" });
      continue;
    }
    if (variant.sku === row.newSku) {
      skuUpdates.push({ ...row, status: "already_ok" });
      continue;
    }
    skuUpdates.push({ ...row, oldSku: variant.sku, status: "will_update" });
  }

  const junkBrands = await prisma.brand.findMany({
    where: {
      deletedAt: null,
      translations: { some: { name: { in: manifest.junkBrandNames, mode: "insensitive" } } },
    },
    select: {
      id: true,
      slug: true,
      translations: { where: { locale: "hy" }, select: { name: true } },
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });

  const softDeletedCount = await prisma.product.count({ where: { deletedAt: { not: null } } });

  return {
    unpublishDraftProducts: [...new Set(draftVariants.map((v) => v.productId))],
    unpublishSyntheticProducts: [...new Set(syntheticPublished.map((v) => v.productId))],
    clearBrandProductIds: [...new Set(clearBrandVariants.map((v) => v.productId))],
    skuUpdates,
    junkBrands,
    softDeletedCount,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--execute");
  const uploadLogos = process.argv.includes("--upload-brand-logos");
  const manifest = readManifest();
  const plan = await planActions(manifest);

  const skuWillUpdate = plan.skuUpdates.filter((r) => r.status === "will_update");

  const report = {
    mode: dryRun ? "dry-run" : "execute",
    manifestStats: manifest.stats,
    unpublishDrafts: plan.unpublishDraftProducts.length,
    unpublishSyntheticMarco: plan.unpublishSyntheticProducts.length,
    clearBrandProducts: plan.clearBrandProductIds.length,
    skuUpdates: skuWillUpdate.length,
    skuAlreadyOk: plan.skuUpdates.filter((r) => r.status === "already_ok").length,
    skuMissingInDb: plan.skuUpdates.filter((r) => r.status === "missing_in_db").length,
    junkBrands: plan.junkBrands.map((b) => ({
      name: b.translations[0]?.name,
      slug: b.slug,
      products: b._count.products,
    })),
    purgeSoftDeletedProducts: plan.softDeletedCount,
  };

  console.log(JSON.stringify(report, null, 2));

  if (dryRun) {
    console.log("\n[dry-run] Sample SKU updates:");
    for (const row of skuWillUpdate.slice(0, 10)) {
      console.log(`  ${row.legacyId} | ${row.oldSku} -> ${row.newSku} | ${row.name}`);
    }
    console.log("\nRun with --execute to apply.");
    return;
  }

  const draftUnpublished = await unpublishProducts(plan.unpublishDraftProducts);
  const syntheticUnpublished = await unpublishProducts(plan.unpublishSyntheticProducts);
  const brandsCleared = await clearBrandBySkus(manifest.clearBrandSkus);
  const skusApplied = await applySkuUpdates(skuWillUpdate);
  const junk = await softDeleteJunkBrands(manifest.junkBrandNames);
  const purged = await purgeSoftDeletedProducts();
  let logosUploaded = 0;
  if (uploadLogos) {
    logosUploaded = await uploadBrandLogos();
  }

  const finalPublished = await prisma.product.count({ where: { deletedAt: null, published: true } });
  const finalSyntheticPublished = await prisma.productVariant.count({
    where: { sku: { startsWith: "MARCO-" }, product: { deletedAt: null, published: true } },
  });

  console.log(
    JSON.stringify(
      {
        applied: {
          draftUnpublished,
          syntheticUnpublished,
          brandsCleared,
          skusApplied,
          junkBrandsDeleted: junk.deleted,
          junkBrandProductsCleared: junk.cleared,
          purgedSoftDeletedProducts: purged,
          logosUploaded,
        },
        final: { publishedProducts: finalPublished, publishedSyntheticMarcoSkus: finalSyntheticPublished },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("[marco-import-reconcile] fatal", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
