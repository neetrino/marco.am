/**
 * Sync transparent brand logos from `BRANDS MARCO/` → R2 `brands/logos/{slug}.webp` → DB.
 *
 * Stage 1 — audit (match + report, no writes):
 *   node scripts/sync-brand-logos-macro.cjs --audit
 *
 * Stage 2 — upload to R2:
 *   node scripts/sync-brand-logos-macro.cjs --upload-r2
 *
 * Stage 3 — update DB logoUrl:
 *   node scripts/sync-brand-logos-macro.cjs --update-db
 *
 * Or both writes:
 *   node scripts/sync-brand-logos-macro.cjs --apply
 *
 * Optional manual overrides (slug → filename in BRANDS MARCO):
 *   scripts/brand-logos-macro-overrides.json
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { loadEnvConfig } = require("@next/env");
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");

loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client",
));

const REPO_ROOT = process.cwd();
const BRANDS_DIR = path.join(REPO_ROOT, "BRANDS MARCO");
const REPORT_DIR = path.join(REPO_ROOT, "docs", "reports");
const REPORT_PATH = path.join(REPORT_DIR, "brand-logos-macro-sync.json");
const OVERRIDES_PATH = path.join(__dirname, "brand-logos-macro-overrides.json");
const R2_PREFIX = "brands/logos/";
const AUTO_MATCH_MAX_DISTANCE = 8;
const WEBP_QUALITY = 82;

/** Verified by visual inspection of local files (Telegram names are not in filenames). */
const DEFAULT_OVERRIDES = {
  "IMAGE 2026-06-09 20:34:13 1.webp": "fds",
  "IMAGE 2026-06-09 20:34:29 1.webp": "lg",
  "IMAGE 2026-06-09 20:40:55 1.webp": "unhopper",
  "IMAGE 2026-06-09 20:41:05 1.webp": "hennson",
  "IMAGE 2026-06-09 20:41:15 1.webp": "royax",
  "IMAGE 2026-06-09 20:41:22 1.webp": "carino",
  "IMAGE 2026-06-09 20:41:25 1.webp": "zdemir-malzeme",
  "IMAGE 2026-06-09 20:41:36 1.webp": "tragen",
  "IMAGE 2026-06-09 20:41:00 1.webp": "welux",
  "IMAGE 2026-06-09 20:41:20 1.webp": "misline",
  "IMAGE 2026-06-09 20:41:39 1.webp": "evo-gloss",
  "IMAGE 2026-06-09 20:41:58 1.webp": "philips",
};

function assertEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(value).trim();
}

function readOverrides() {
  const merged = { ...DEFAULT_OVERRIDES };
  if (fs.existsSync(OVERRIDES_PATH)) {
    const custom = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"));
    for (const [file, slug] of Object.entries(custom)) {
      merged[file] = slug;
    }
  }
  return merged;
}

async function dHash(buf) {
  const { data, info } = await sharp(buf)
    .flatten({ background: "#ffffff" })
    .resize(9, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const left = data[y * info.width + x];
      const right = data[y * info.width + x + 1];
      bits += left < right ? "1" : "0";
    }
  }
  return bits;
}

function hamming(a, b) {
  let distance = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) distance += 1;
  }
  return distance;
}

function listUniqueLocalLogos() {
  if (!fs.existsSync(BRANDS_DIR)) {
    throw new Error(`Folder not found: ${BRANDS_DIR}`);
  }

  const files = fs
    .readdirSync(BRANDS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".webp"));
  const byHash = new Map();

  for (const file of files) {
    const buffer = fs.readFileSync(path.join(BRANDS_DIR, file));
    const md5 = crypto.createHash("md5").update(buffer).digest("hex");
    if (!byHash.has(md5)) {
      byHash.set(md5, { file, buffer, md5 });
    }
  }

  return Array.from(byHash.values());
}

async function prepareWebp(buffer) {
  return sharp(buffer).rotate().webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
}

async function buildMapping() {
  const prisma = new PrismaClient();
  try {
    const overrides = readOverrides();
    const locals = listUniqueLocalLogos();
    for (const item of locals) {
      item.hash = await dHash(item.buffer);
      const meta = await sharp(item.buffer).metadata();
      item.hasAlpha = Boolean(meta.hasAlpha);
    }

    const brands = await prisma.brand.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        slug: true,
        logoUrl: true,
        translations: { where: { locale: "en" }, select: { name: true } },
      },
      orderBy: { slug: "asc" },
    });

    const slugToBrand = Object.fromEntries(brands.map((brand) => [brand.slug, brand]));
    const fileToSlug = new Map();
    const mapping = new Map();

    for (const [file, slug] of Object.entries(overrides)) {
      const brand = slugToBrand[slug];
      const local = locals.find((item) => item.file === file);
      if (!brand) {
        throw new Error(`Override slug not found in DB: ${slug} (${file})`);
      }
      if (!local) {
        throw new Error(`Override file not found: ${file}`);
      }
      if (fileToSlug.has(file)) {
        throw new Error(`Duplicate override file: ${file}`);
      }
      fileToSlug.set(file, slug);
      mapping.set(slug, {
        slug,
        brandId: brand.id,
        name: brand.translations[0]?.name ?? slug,
        file,
        distance: 0,
        source: "manual",
        previousLogoUrl: brand.logoUrl ?? null,
        hasAlpha: local.hasAlpha,
      });
    }

    const autoCandidates = [];
    for (const brand of brands) {
      if (mapping.has(brand.slug) || !brand.logoUrl) continue;
      try {
        const response = await fetch(brand.logoUrl);
        if (!response.ok) continue;
        const buffer = Buffer.from(await response.arrayBuffer());
        autoCandidates.push({
          slug: brand.slug,
          brandId: brand.id,
          name: brand.translations[0]?.name ?? brand.slug,
          hash: await dHash(buffer),
          previousLogoUrl: brand.logoUrl,
        });
      } catch {
        // skip unreachable old logo
      }
    }

    const pairs = [];
    for (const candidate of autoCandidates) {
      for (const local of locals) {
        if (fileToSlug.has(local.file)) continue;
        pairs.push({
          slug: candidate.slug,
          brandId: candidate.brandId,
          name: candidate.name,
          file: local.file,
          md5: local.md5,
          distance: hamming(candidate.hash, local.hash),
          previousLogoUrl: candidate.previousLogoUrl,
          hasAlpha: local.hasAlpha,
        });
      }
    }
    pairs.sort((a, b) => a.distance - b.distance);

    const usedFiles = new Set([...fileToSlug.keys()]);
    const usedSlugs = new Set([...mapping.keys()]);

    for (const pair of pairs) {
      if (pair.distance > AUTO_MATCH_MAX_DISTANCE) break;
      if (usedSlugs.has(pair.slug) || usedFiles.has(pair.file)) continue;
      usedSlugs.add(pair.slug);
      usedFiles.add(pair.file);
      mapping.set(pair.slug, {
        slug: pair.slug,
        brandId: pair.brandId,
        name: pair.name,
        file: pair.file,
        distance: pair.distance,
        source: "auto",
        previousLogoUrl: pair.previousLogoUrl,
        hasAlpha: pair.hasAlpha,
      });
    }

    const mapped = [...mapping.values()].sort((a, b) => a.slug.localeCompare(b.slug));
    const mappedFiles = new Set(mapped.map((item) => item.file));
    const unusedLocal = locals
      .filter((item) => !mappedFiles.has(item.file))
      .map((item) => item.file)
      .sort();
    const missingBrands = brands
      .filter((brand) => !mapping.has(brand.slug))
      .map((brand) => ({
        slug: brand.slug,
        name: brand.translations[0]?.name ?? brand.slug,
        hadLogo: Boolean(brand.logoUrl),
        logoUrl: brand.logoUrl ?? null,
      }));

    return {
      generatedAt: new Date().toISOString(),
      brandsDir: BRANDS_DIR,
      localUniqueCount: locals.length,
      mappedCount: mapped.length,
      mapped,
      unusedLocal,
      missingBrands,
    };
  } finally {
    await prisma.$disconnect();
  }
}

function writeReport(report) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  return REPORT_PATH;
}

function readReport() {
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`Report not found — run --audit first: ${REPORT_PATH}`);
  }
  return JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
}

function createR2Client() {
  const accountId = assertEnv("R2_ACCOUNT_ID");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: assertEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: assertEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

async function uploadMappedToR2(report) {
  const client = createR2Client();
  const bucket = assertEnv("R2_BUCKET_NAME");
  const publicUrl = assertEnv("R2_PUBLIC_URL").replace(/\/$/, "");
  const uploaded = [];

  for (const item of report.mapped) {
    const sourcePath = path.join(BRANDS_DIR, item.file);
    const raw = fs.readFileSync(sourcePath);
    const webp = await prepareWebp(raw);
    const key = `${R2_PREFIX}${item.slug}.webp`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: webp,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    uploaded.push({
      slug: item.slug,
      key,
      url: `${publicUrl}/${key}`,
      source: item.source,
      file: item.file,
    });
  }

  return uploaded;
}

async function updateDbLogoUrls(report, uploaded) {
  const prisma = new PrismaClient();
  const urlBySlug = Object.fromEntries(uploaded.map((item) => [item.slug, item.url]));
  try {
    const updated = [];
    for (const item of report.mapped) {
      const logoUrl = urlBySlug[item.slug];
      if (!logoUrl) continue;
      await prisma.brand.update({
        where: { id: item.brandId },
        data: { logoUrl },
      });
      updated.push({ slug: item.slug, logoUrl });
    }
    return updated;
  } finally {
    await prisma.$disconnect();
  }
}

function printSummary(report) {
  process.stdout.write("\n=== Brand logos MARCO sync ===\n\n");
  process.stdout.write(`Local unique files: ${report.localUniqueCount}\n`);
  process.stdout.write(`Mapped to brands: ${report.mappedCount}\n`);
  process.stdout.write(
    `  manual: ${report.mapped.filter((item) => item.source === "manual").length}\n`,
  );
  process.stdout.write(
    `  auto: ${report.mapped.filter((item) => item.source === "auto").length}\n`,
  );
  process.stdout.write(`Missing in folder: ${report.missingBrands.length}\n`);
  process.stdout.write(`Unused local files: ${report.unusedLocal.length}\n`);

  if (report.unusedLocal.length > 0) {
    process.stdout.write("\nUnused (no DB brand / not matched):\n");
    for (const file of report.unusedLocal) {
      process.stdout.write(`  - ${file}\n`);
    }
  }

  if (report.missingBrands.length > 0) {
    process.stdout.write("\nBrands without new logo:\n");
    for (const brand of report.missingBrands) {
      process.stdout.write(
        `  - ${brand.slug} (${brand.name})${brand.hadLogo ? " [had old logo]" : " [empty]"}\n`,
      );
    }
  }

  process.stdout.write("\nMapped:\n");
  for (const item of report.mapped) {
    process.stdout.write(
      `  ${item.slug.padEnd(28)} ${item.name.padEnd(22)} ${item.source.padEnd(6)} dist=${String(item.distance).padStart(2)} alpha=${item.hasAlpha ? "yes" : "no"}  ${item.file}\n`,
    );
  }
  process.stdout.write("\n");
}

async function main() {
  const audit = process.argv.includes("--audit");
  const uploadR2 = process.argv.includes("--upload-r2");
  const updateDb = process.argv.includes("--update-db");
  const apply = process.argv.includes("--apply");

  if (!audit && !uploadR2 && !updateDb && !apply) {
    throw new Error("Pass --audit, --upload-r2, --update-db, or --apply");
  }

  if (audit || apply) {
    const report = await buildMapping();
    const reportPath = writeReport(report);
    printSummary(report);
    process.stdout.write(`Report: ${path.relative(REPO_ROOT, reportPath)}\n`);

    if (apply) {
      const uploaded = await uploadMappedToR2(report);
      const updated = await updateDbLogoUrls(report, uploaded);
      process.stdout.write(`\nUploaded to R2: ${uploaded.length}\n`);
      process.stdout.write(`Updated in DB: ${updated.length}\n`);
    }
    return;
  }

  const report = readReport();
  if (uploadR2) {
    const uploaded = await uploadMappedToR2(report);
    process.stdout.write(`[brand-logos-macro] uploaded: ${uploaded.length}\n`);
    const nextReport = { ...report, uploadedAt: new Date().toISOString(), uploaded };
    writeReport(nextReport);
  }

  if (updateDb) {
    const uploaded = report.uploaded;
    if (!uploaded || uploaded.length === 0) {
      throw new Error("No upload data in report — run --upload-r2 first");
    }
    const updated = await updateDbLogoUrls(report, uploaded);
    process.stdout.write(`[brand-logos-macro] db updated: ${updated.length}\n`);
  }
}

main().catch((error) => {
  console.error("[brand-logos-macro] fatal", error);
  process.exit(1);
});
