/**
 * Audits brand logoUrl in DB vs objects under R2 prefix `brands/logos/`.
 *
 * Usage: node scripts/audit-brand-logos.cjs
 */
const path = require("path");
const { loadEnvConfig } = require("@next/env");
const { ListObjectsV2Command, S3Client } = require("@aws-sdk/client-s3");

loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client",
));

const BRAND_LOGOS_PREFIX = "brands/logos/";
const BAD_KEY_MARKERS = /c__users|appdata|roaming|workspacestorage/i;

function readEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return String(value).trim();
}

function classifyLogoUrl(url) {
  if (!url || !String(url).trim()) {
    return "empty";
  }
  const value = String(url).trim();
  if (value.startsWith("data:image/")) {
    return "base64_in_db";
  }
  if (/^c:/i.test(value) || /^file:/i.test(value) || BAD_KEY_MARKERS.test(value)) {
    return "local_path";
  }
  if (value.startsWith("/assets/brands/")) {
    return "local_public_path";
  }
  if (/^https?:\/\//i.test(value) && value.includes("/brands/logos/")) {
    if (BAD_KEY_MARKERS.test(value)) {
      return "r2_bad_key";
    }
    return "r2_ok";
  }
  if (/^https?:\/\//i.test(value)) {
    return "remote_other";
  }
  if (value.startsWith("/")) {
    return "relative_other";
  }
  return "unknown";
}

function createR2Client() {
  const accountId = readEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: readEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: readEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function listR2BrandLogos() {
  const client = createR2Client();
  const bucket = readEnv("R2_BUCKET_NAME");
  const publicUrl = readEnv("R2_PUBLIC_URL").replace(/\/$/, "");
  const keys = [];
  let continuationToken;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: BRAND_LOGOS_PREFIX,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );
    for (const item of response.Contents ?? []) {
      if (item.Key && !item.Key.endsWith("/")) {
        keys.push({
          key: item.Key,
          url: `${publicUrl}/${item.Key}`,
          bad: BAD_KEY_MARKERS.test(item.Key),
        });
      }
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const brands = await prisma.brand.findMany({
      where: { deletedAt: null },
      select: { slug: true, logoUrl: true },
      orderBy: { slug: "asc" },
    });

    const dbStats = {};
    for (const brand of brands) {
      const bucket = classifyLogoUrl(brand.logoUrl);
      dbStats[bucket] = (dbStats[bucket] ?? 0) + 1;
    }

    const r2Objects = await listR2BrandLogos();
    const r2Good = r2Objects.filter((o) => !o.bad);
    const r2Bad = r2Objects.filter((o) => o.bad);

    console.log("\n=== Brand logos audit ===\n");
    console.log(`DB brands (active): ${brands.length}`);
    console.log("DB logoUrl breakdown:");
    for (const [kind, count] of Object.entries(dbStats).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${kind}: ${count}`);
    }

    console.log(`\nR2 prefix ${BRAND_LOGOS_PREFIX}`);
    console.log(`  total objects: ${r2Objects.length}`);
    console.log(`  valid keys (slug-like): ${r2Good.length}`);
    console.log(`  junk keys (Cursor/local paths): ${r2Bad.length}`);

    if (r2Good.length > 0) {
      console.log("\n  Sample valid R2 keys:");
      for (const item of r2Good.slice(0, 8)) {
        console.log(`    ${item.key}`);
      }
    }
    if (r2Bad.length > 0) {
      console.log("\n  Sample junk R2 keys:");
      for (const item of r2Bad.slice(0, 3)) {
        console.log(`    ${item.key.slice(0, 100)}...`);
      }
    }

    const withR2Ok = brands.filter((b) => classifyLogoUrl(b.logoUrl) === "r2_ok");
    console.log(`\nBrands with valid R2 logoUrl in DB: ${withR2Ok.length}`);
    if (withR2Ok.length > 0) {
      for (const b of withR2Ok.slice(0, 5)) {
        console.log(`  ${b.slug}`);
      }
    }

    console.log("\n--- Target architecture ---");
    console.log("1. File in R2: brands/logos/{slug}.webp (or .png)");
    console.log("2. DB brands.logoUrl = full public URL from R2_PUBLIC_URL");
    console.log("3. UI reads logoUrl from API only — no /assets/brands fallback");
    console.log("4. Admin upload: POST image → R2 → save returned URL to logoUrl\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
