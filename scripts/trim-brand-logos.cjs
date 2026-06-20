/**
 * Trim transparent margins from brand logos → tighter crop → larger mark in UI cells.
 *
 * Usage:
 *   node scripts/trim-brand-logos.cjs --audit
 *   node scripts/trim-brand-logos.cjs --apply
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { loadEnvConfig } = require('@next/env');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  '..',
  'shared',
  'db',
  'generated',
  'prisma-client',
));

const REPO_ROOT = process.cwd();
const LOCAL_DIR = path.join(REPO_ROOT, 'BRANDS MARCO');
const REPORT_PATH = path.join(REPO_ROOT, 'docs', 'reports', 'brand-logos-trim.json');
const R2_PREFIX = 'brands/logos/';
const TRIM_THRESHOLD = 10;
const PADDING_PX = 8;
const WEBP_QUALITY = 82;

function assertEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return String(value).trim();
}

function createR2Client() {
  const accountId = assertEnv('R2_ACCOUNT_ID');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: assertEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: assertEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
}

async function loadSourceBuffer(slug, logoUrl) {
  const localPath = path.join(LOCAL_DIR, `${slug}.webp`);
  if (fs.existsSync(localPath)) {
    return { buffer: fs.readFileSync(localPath), source: 'local' };
  }
  if (!logoUrl) {
    return null;
  }
  const response = await fetch(logoUrl);
  if (!response.ok) {
    return null;
  }
  return { buffer: Buffer.from(await response.arrayBuffer()), source: 'r2' };
}

async function trimLogo(buffer) {
  const before = await sharp(buffer).metadata();
  let pipeline = sharp(buffer).trim({ threshold: TRIM_THRESHOLD });
  if (PADDING_PX > 0) {
    pipeline = pipeline.extend({
      top: PADDING_PX,
      bottom: PADDING_PX,
      left: PADDING_PX,
      right: PADDING_PX,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }
  const trimmed = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
  const after = await sharp(trimmed).metadata();
  return { trimmed, before, after };
}

function pixelReduction(before, after) {
  const b = before.width * before.height;
  const a = after.width * after.height;
  if (b === 0) return 0;
  return Math.round((1 - a / b) * 100);
}

async function buildPlan() {
  const prisma = new PrismaClient();
  try {
    const brands = await prisma.brand.findMany({
      where: { deletedAt: null, logoUrl: { not: null } },
      select: { id: true, slug: true, logoUrl: true },
      orderBy: { slug: 'asc' },
    });

    const items = [];
    for (const brand of brands) {
      const loaded = await loadSourceBuffer(brand.slug, brand.logoUrl);
      if (!loaded) {
        items.push({ slug: brand.slug, status: 'missing-source' });
        continue;
      }
      const { trimmed, before, after } = await trimLogo(loaded.buffer);
      const savedPct = pixelReduction(before, after);
      items.push({
        slug: brand.slug,
        status: savedPct > 0 ? 'will-trim' : 'unchanged',
        source: loaded.source,
        before: { w: before.width, h: before.height },
        after: { w: after.width, h: after.height },
        savedPct,
        bytes: trimmed.length,
        trimmed,
      });
    }
    return items;
  } finally {
    await prisma.$disconnect();
  }
}

function toReportItem(item) {
  return {
    slug: item.slug,
    status: item.status,
    ...(item.source ? { source: item.source } : {}),
    ...(item.before ? { before: item.before } : {}),
    ...(item.after ? { after: item.after } : {}),
    ...(typeof item.savedPct === 'number' ? { savedPct: item.savedPct } : {}),
    ...(typeof item.bytes === 'number' ? { bytes: item.bytes } : {}),
  };
}

async function main() {
  const audit = process.argv.includes('--audit');
  const apply = process.argv.includes('--apply');
  if (!audit && !apply) {
    throw new Error('Pass --audit or --apply');
  }

  const items = await buildPlan();
  const toTrim = items.filter((item) => item.status === 'will-trim');
  const unchanged = items.filter((item) => item.status === 'unchanged');
  const missing = items.filter((item) => item.status === 'missing-source');

  if (audit) {
    console.log('\n=== Brand logo trim audit ===\n');
    console.log(`Total with logoUrl: ${items.length}`);
    console.log(`Will trim: ${toTrim.length}`);
    console.log(`Already tight: ${unchanged.length}`);
    console.log(`Missing source: ${missing.length}`);
    console.log('\nTop savings:');
    for (const item of [...toTrim].sort((a, b) => b.savedPct - a.savedPct).slice(0, 15)) {
      console.log(
        `  ${item.slug.padEnd(24)} ${item.before.w}x${item.before.h} -> ${item.after.w}x${item.after.h}  (-${item.savedPct}%)`,
      );
    }
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(
      REPORT_PATH,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          paddingPx: PADDING_PX,
          trimThreshold: TRIM_THRESHOLD,
          summary: { total: items.length, willTrim: toTrim.length, unchanged: unchanged.length, missing: missing.length },
          items: items.map(toReportItem),
        },
        null,
        2,
      ),
    );
    console.log(`\nReport: ${path.relative(REPO_ROOT, REPORT_PATH)}`);
    return;
  }

  const client = createR2Client();
  const bucket = assertEnv('R2_BUCKET_NAME');
  const publicUrl = assertEnv('R2_PUBLIC_URL').replace(/\/$/, '');
  let uploaded = 0;

  for (const item of toTrim) {
    const key = `${R2_PREFIX}${item.slug}.webp`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: item.trimmed,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    fs.writeFileSync(path.join(LOCAL_DIR, `${item.slug}.webp`), item.trimmed);
    uploaded += 1;
    console.log(`trimmed ${item.slug} -> ${publicUrl}/${key}`);
  }

  console.log(`\nUploaded trimmed logos: ${uploaded}`);
  console.log(`Skipped (already tight): ${unchanged.length}`);
}

main().catch((error) => {
  console.error('[trim-brand-logos] fatal', error);
  process.exit(1);
});
