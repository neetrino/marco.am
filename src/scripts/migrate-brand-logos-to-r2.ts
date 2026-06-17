/**
 * One-off: migrate bundled /assets/brands logos to R2 `brands/logos/{basename}.webp`
 * and set brands.logoUrl. Optionally delete junk objects under brands/logos/.
 *
 * Usage:
 *   pnpm exec tsx src/scripts/migrate-brand-logos-to-r2.ts --dry-run
 *   pnpm exec tsx src/scripts/migrate-brand-logos-to-r2.ts --apply
 *   pnpm exec tsx src/scripts/migrate-brand-logos-to-r2.ts --apply --delete-junk
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';

import { db } from '@white-shop/db';
import { resolveBrandStaticLogoForDisplay } from '@/scripts/brand-bundled-logo-sources';
import {
  BRAND_LOGOS_R2_PREFIX,
  buildBrandLogoR2Key,
  resolveBrandLogoR2Basename,
} from '@/lib/services/admin/brand-logo-storage';
import { prepareRasterForR2Upload } from '@/lib/utils/prepare-raster-for-r2-upload';
import { isLocalFilesystemImageReference } from '@/lib/utils/image-utils';

const BAD_KEY_MARKERS = /c__users|appdata|roaming|workspacestorage/i;
const STATIC_SITE_PREFIX = 'static-site';

type MigrateStats = {
  scanned: number;
  skippedValid: number;
  uploaded: number;
  dbUpdated: number;
  noSource: number;
  clearedInvalid: number;
  errors: number;
};

function parseArgs(argv: string[]): { apply: boolean; deleteJunk: boolean } {
  return {
    apply: argv.includes('--apply'),
    deleteJunk: argv.includes('--delete-junk'),
  };
}

function isValidBrandLogoUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }
  const value = url.trim();
  if (isLocalFilesystemImageReference(value)) {
    return false;
  }
  if (!value.startsWith('https://') && !value.startsWith('http://')) {
    return false;
  }
  return value.includes(`/${BRAND_LOGOS_R2_PREFIX}`) && !BAD_KEY_MARKERS.test(value);
}

function contentTypeFromPath(assetPath: string): string {
  const lower = assetPath.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function loadBundledLogoBuffer(
  assetPath: string,
  publicUrl: string,
): Promise<{ buffer: Buffer; mime: string } | null> {
  const relative = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  const localPath = join(process.cwd(), 'public', relative);

  if (existsSync(localPath)) {
    const buffer = readFileSync(localPath);
    return { buffer, mime: contentTypeFromPath(localPath) };
  }

  const remoteCandidates = [
    `${publicUrl}/${STATIC_SITE_PREFIX}/${relative}`,
    `${publicUrl}/${relative}`,
    `http://127.0.0.1:3000/${relative}`,
  ];

  for (const candidate of remoteCandidates) {
    const buffer = await fetchBuffer(candidate);
    if (buffer && buffer.length > 0) {
      return { buffer, mime: contentTypeFromPath(assetPath) };
    }
  }

  return null;
}

function createR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are not configured');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function deleteJunkBrandLogos(apply: boolean): Promise<number> {
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!bucket) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const client = createR2Client();
  const junkKeys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: BRAND_LOGOS_R2_PREFIX,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );

    for (const item of response.Contents ?? []) {
      const key = item.Key;
      if (key && BAD_KEY_MARKERS.test(key)) {
        junkKeys.push(key);
      }
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`[brand-logos] junk objects under ${BRAND_LOGOS_R2_PREFIX}: ${junkKeys.length}`);

  if (!apply || junkKeys.length === 0) {
    return junkKeys.length;
  }

  for (let i = 0; i < junkKeys.length; i += 1000) {
    const chunk = junkKeys.slice(i, i + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
  }

  console.log(`[brand-logos] deleted ${junkKeys.length} junk objects`);
  return junkKeys.length;
}

async function migrateBrands(apply: boolean): Promise<MigrateStats> {
  const { uploadToR2 } = await import('@/lib/r2');
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') ?? '';
  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL is not configured');
  }

  const stats: MigrateStats = {
    scanned: 0,
    skippedValid: 0,
    uploaded: 0,
    dbUpdated: 0,
    noSource: 0,
    clearedInvalid: 0,
    errors: 0,
  };

  const brands = await db.brand.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      slug: true,
      logoUrl: true,
      translations: {
        where: { locale: 'en' },
        take: 1,
        select: { name: true },
      },
    },
    orderBy: { slug: 'asc' },
  });

  for (const brand of brands) {
    stats.scanned += 1;
    const name = brand.translations[0]?.name?.trim() ?? '';

    if (isValidBrandLogoUrl(brand.logoUrl)) {
      stats.skippedValid += 1;
      continue;
    }

    const bundled = resolveBrandStaticLogoForDisplay(brand.slug, name);
    if (!bundled?.src) {
      if (
        apply &&
        brand.logoUrl &&
        (brand.logoUrl.startsWith('data:') || isLocalFilesystemImageReference(brand.logoUrl))
      ) {
        await db.brand.update({
          where: { id: brand.id },
          data: { logoUrl: null },
        });
        stats.clearedInvalid += 1;
      }
      stats.noSource += 1;
      console.log(`[brand-logos] no bundled source: ${brand.slug} (${name || 'no name'})`);
      continue;
    }

    let basename: string;
    try {
      basename = resolveBrandLogoR2Basename({
        slug: brand.slug,
        name,
        brandId: brand.id,
      });
    } catch {
      stats.errors += 1;
      console.error(`[brand-logos] cannot resolve basename: ${brand.slug}`);
      continue;
    }

    const source = await loadBundledLogoBuffer(bundled.src, publicUrl);
    if (!source) {
      stats.noSource += 1;
      console.log(`[brand-logos] source file missing: ${bundled.src} for ${brand.slug}`);
      continue;
    }

    const prepared = await prepareRasterForR2Upload(source.buffer, source.mime);
    const key = buildBrandLogoR2Key(basename, prepared.extension);
    const nextUrl = `${publicUrl}/${key}`;

    console.log(
      `[brand-logos] ${apply ? 'APPLY' : 'DRY'} ${brand.slug} ← ${bundled.src} → ${key}`,
    );

    if (!apply) {
      continue;
    }

    const uploadedUrl = await uploadToR2(key, prepared.buffer, prepared.contentType);
    if (!uploadedUrl) {
      stats.errors += 1;
      console.error(`[brand-logos] upload failed: ${brand.slug}`);
      continue;
    }

    stats.uploaded += 1;

    await db.brand.update({
      where: { id: brand.id },
      data: { logoUrl: uploadedUrl || nextUrl },
    });
    stats.dbUpdated += 1;
  }

  return stats;
}

async function main(): Promise<void> {
  const { apply, deleteJunk } = parseArgs(process.argv.slice(2));
  const { isR2Configured } = await import('@/lib/r2');

  if (!isR2Configured()) {
    throw new Error('R2 is not configured');
  }

  console.log(`[brand-logos] mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);

  if (deleteJunk) {
    await deleteJunkBrandLogos(apply);
  }

  const stats = await migrateBrands(apply);

  console.log('\n[brand-logos] summary');
  console.log(`  scanned: ${stats.scanned}`);
  console.log(`  skipped (valid R2 url): ${stats.skippedValid}`);
  console.log(`  uploaded: ${stats.uploaded}`);
  console.log(`  db updated: ${stats.dbUpdated}`);
  console.log(`  no bundled source: ${stats.noSource}`);
  console.log(`  cleared invalid logoUrl: ${stats.clearedInvalid}`);
  console.log(`  errors: ${stats.errors}`);
}

main()
  .catch((error: unknown) => {
    console.error('[brand-logos] fatal', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
