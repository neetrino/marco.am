/**
 * Upload brand logos from `BRANDS MARCO/20/` → R2 `brands/logos/{slug}.webp` → DB.
 *
 * Usage:
 *   node scripts/upload-brand-logos-folder-20.cjs --dry-run
 *   node scripts/upload-brand-logos-folder-20.cjs --apply
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

const BASE_DIR = path.join(process.cwd(), "BRANDS MARCO", "20");
const WEBP_QUALITY = 82;
const BRAND_LOGO_FILES = [
  { slug: "pacific", file: "pacific.png" },
  { slug: "disakulp", file: "disa-kulp.png" },
  { slug: "pinskdrev", file: "pinskdrev.png", legacySlug: "brand-85ebe26ae2" },
];

const prisma = new PrismaClient();

function assertEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(value).trim();
}

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${assertEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: assertEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: assertEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function prepareWebp(sourcePath) {
  return sharp(fs.readFileSync(sourcePath))
    .rotate()
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer();
}

async function resolveBrand(entry, dryRun) {
  const bySlug = await prisma.brand.findFirst({
    where: { slug: entry.slug, deletedAt: null },
    select: { id: true, slug: true, logoUrl: true },
  });
  if (bySlug) {
    return bySlug;
  }

  if (!entry.legacySlug) {
    return null;
  }

  const legacy = await prisma.brand.findFirst({
    where: { slug: entry.legacySlug, deletedAt: null },
    select: { id: true, slug: true, logoUrl: true },
  });
  if (!legacy) {
    return null;
  }

  if (dryRun) {
    return { ...legacy, slug: entry.slug, wouldRenameFrom: entry.legacySlug };
  }

  const conflict = await prisma.brand.findFirst({
    where: { slug: entry.slug, deletedAt: null, id: { not: legacy.id } },
    select: { id: true },
  });
  if (conflict) {
    throw new Error(`Cannot rename ${entry.legacySlug}: slug ${entry.slug} already taken`);
  }

  const renamed = await prisma.brand.update({
    where: { id: legacy.id },
    data: { slug: entry.slug },
    select: { id: true, slug: true, logoUrl: true },
  });
  console.log(`[upload-brand-logos-20] slug renamed: ${entry.legacySlug} -> ${entry.slug}`);
  return renamed;
}

async function uploadBrandLogos(dryRun) {
  const bucket = assertEnv("R2_BUCKET_NAME");
  const publicUrl = assertEnv("R2_PUBLIC_URL").replace(/\/$/, "");
  const client = dryRun ? null : createR2Client();
  const results = [];

  for (const entry of BRAND_LOGO_FILES) {
    const sourcePath = path.join(BASE_DIR, entry.file);
    if (!fs.existsSync(sourcePath)) {
      results.push({ slug: entry.slug, status: "missing_file", sourcePath });
      continue;
    }

    const brand = await resolveBrand(entry, dryRun);
    if (!brand) {
      results.push({ slug: entry.slug, status: "brand_not_found" });
      continue;
    }

    const webp = await prepareWebp(sourcePath);
    const key = `brands/logos/${entry.slug}.webp`;
    const logoUrl = `${publicUrl}/${key}`;

    if (dryRun) {
      results.push({
        slug: entry.slug,
        status: "ready",
        brandId: brand.id,
        previousLogoUrl: brand.logoUrl,
        logoUrl,
        key,
        bytes: webp.length,
      });
      continue;
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: webp,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    await prisma.brand.update({ where: { id: brand.id }, data: { logoUrl } });
    results.push({
      slug: entry.slug,
      status: "uploaded",
      brandId: brand.id,
      logoUrl,
      key,
      bytes: webp.length,
    });
    console.log(`[upload-brand-logos-20] uploaded: ${entry.slug} -> ${logoUrl}`);
  }

  return results;
}

async function main() {
  const dryRun = !process.argv.includes("--apply");
  const results = await uploadBrandLogos(dryRun);
  console.log(JSON.stringify({ mode: dryRun ? "dry-run" : "apply", results }, null, 2));
  if (dryRun) {
    console.log("\nRun with --apply to upload to R2 and update DB.");
  }
}

main()
  .catch((error) => {
    console.error("[upload-brand-logos-20] fatal", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
