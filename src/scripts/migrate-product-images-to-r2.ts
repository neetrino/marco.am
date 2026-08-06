/**
 * Migrate Base64 product images to Cloudflare R2.
 *
 * Usage:
 *   pnpm migrate:product-images-to-r2 --dry-run
 *   pnpm migrate:product-images-to-r2 --apply
 *   pnpm migrate:product-images-to-r2 --verify
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import { isR2Configured, uploadToR2 } from '@/lib/r2';
import { prepareRasterForR2Upload } from '@/lib/utils/prepare-raster-for-r2-upload';
import { syncProductListingReadModel } from '@/lib/read-model/product-read-model-sync';
import {
  isDataOrBlobImageReference,
  redactImageRefForLog,
  toPersistedProductImageUrl,
} from '@/lib/products/persisted-product-image-url';
import { logger } from '@/lib/utils/logger';

loadEnvConfig(process.cwd());

type Mode = 'dry-run' | 'apply' | 'verify';

type ManifestEntry = {
  contentHash: string;
  objectKey: string;
  publicUrl: string;
  mimeType: string;
};

type MigrationStats = {
  productsScanned: number;
  base64ReferencesFound: number;
  uniqueImagesUploaded: number;
  duplicatesReused: number;
  referencesReplaced: number;
  listingRowsRebuilt: number;
  failedImages: number;
  productsStillWithoutValidImage: number;
};

const MANIFEST_DIR = join(process.cwd(), '.cache');
const MANIFEST_PATH = join(MANIFEST_DIR, 'product-images-r2-migration-manifest.json');
const DATA_URL_RE = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i;
const MAX_DECODED_BYTES = 5 * 1024 * 1024;

function parseMode(argv: string[]): Mode {
  if (argv.includes('--apply')) return 'apply';
  if (argv.includes('--verify')) return 'verify';
  return 'dry-run';
}

function loadManifest(): Record<string, ManifestEntry> {
  if (!existsSync(MANIFEST_PATH)) {
    return {};
  }
  try {
    const raw = readFileSync(MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, ManifestEntry>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveManifest(manifest: Record<string, ManifestEntry>): void {
  mkdirSync(MANIFEST_DIR, { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function extractMediaStrings(media: unknown): string[] {
  if (!Array.isArray(media)) {
    return [];
  }
  const out: string[] = [];
  for (const item of media) {
    if (typeof item === 'string' && item.trim()) {
      out.push(item.trim());
      continue;
    }
    if (item && typeof item === 'object') {
      const obj = item as { url?: string; src?: string; value?: string };
      const candidate = obj.url ?? obj.src ?? obj.value;
      if (typeof candidate === 'string' && candidate.trim()) {
        out.push(candidate.trim());
      }
    }
  }
  return out;
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(DATA_URL_RE);
  if (!match) {
    return null;
  }
  const mime = match[1]!.toLowerCase();
  const buffer = Buffer.from(match[2]!.replace(/\s+/g, ''), 'base64');
  if (buffer.length <= 0 || buffer.length > MAX_DECODED_BYTES) {
    return null;
  }
  return { mime, buffer };
}

async function uploadDataUrlToR2(
  dataUrl: string,
  manifest: Record<string, ManifestEntry>,
): Promise<{ url: string; reused: boolean } | { error: string }> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return { error: 'invalid_or_oversized_data_url' };
  }

  const contentHash = createHash('sha256').update(parsed.buffer).digest('hex');
  const existing = manifest[contentHash];
  if (existing?.publicUrl) {
    return { url: existing.publicUrl, reused: true };
  }

  try {
    const prepared = await prepareRasterForR2Upload(parsed.buffer, parsed.mime);
    const objectKey = `products/migrated/${contentHash.slice(0, 24)}.${prepared.extension}`;
    const publicUrl = await uploadToR2(objectKey, prepared.buffer, prepared.contentType);
    if (!publicUrl) {
      return { error: 'r2_upload_failed' };
    }
    manifest[contentHash] = {
      contentHash,
      objectKey,
      publicUrl,
      mimeType: prepared.contentType,
    };
    return { url: publicUrl, reused: false };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: message };
  }
}

function replaceInMedia(media: unknown, mapping: Map<string, string>): unknown[] {
  const source = Array.isArray(media) ? media : [];
  return source.map((item) => {
    if (typeof item === 'string') {
      return mapping.get(item) ?? item;
    }
    if (item && typeof item === 'object') {
      const obj = { ...(item as Record<string, unknown>) };
      for (const key of ['url', 'src', 'value'] as const) {
        const value = obj[key];
        if (typeof value === 'string' && mapping.has(value)) {
          obj[key] = mapping.get(value);
        }
      }
      return obj;
    }
    return item;
  });
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv.slice(2));
  const stats: MigrationStats = {
    productsScanned: 0,
    base64ReferencesFound: 0,
    uniqueImagesUploaded: 0,
    duplicatesReused: 0,
    referencesReplaced: 0,
    listingRowsRebuilt: 0,
    failedImages: 0,
    productsStillWithoutValidImage: 0,
  };

  if ((mode === 'apply' || mode === 'verify') && !isR2Configured() && mode === 'apply') {
    throw new Error('R2 is not configured; cannot apply migration');
  }

  const manifest = loadManifest();
  const products = await db.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      media: true,
      variants: { select: { id: true, sku: true, imageUrl: true } },
    },
  });

  const affectedProductIds = new Set<string>();

  for (const product of products) {
    stats.productsScanned += 1;
    const mapping = new Map<string, string>();
    const mediaStrings = extractMediaStrings(product.media);
    const candidates = [
      ...mediaStrings,
      ...product.variants.map((variant) => variant.imageUrl).filter((v): v is string => Boolean(v)),
    ];

    for (const candidate of candidates) {
      if (!isDataOrBlobImageReference(candidate)) {
        continue;
      }
      stats.base64ReferencesFound += 1;

      if (mode === 'verify') {
        continue;
      }

      if (mode === 'dry-run') {
        logger.alwaysInfo('[dry-run] would migrate', {
          productId: product.id,
          ref: redactImageRefForLog(candidate),
        });
        continue;
      }

      const uploaded = await uploadDataUrlToR2(candidate, manifest);
      if ('error' in uploaded) {
        stats.failedImages += 1;
        logger.error('Failed to migrate image', {
          productId: product.id,
          ref: redactImageRefForLog(candidate),
          error: uploaded.error,
        });
        continue;
      }
      if (uploaded.reused) {
        stats.duplicatesReused += 1;
      } else {
        stats.uniqueImagesUploaded += 1;
      }
      mapping.set(candidate, uploaded.url);
    }

    if (mode === 'apply' && mapping.size > 0) {
      const nextMedia = replaceInMedia(product.media, mapping);
      await db.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: product.id },
          data: { media: nextMedia as object[] },
        });
        for (const variant of product.variants) {
          if (!variant.imageUrl || !mapping.has(variant.imageUrl)) {
            continue;
          }
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { imageUrl: mapping.get(variant.imageUrl) },
          });
          stats.referencesReplaced += 1;
        }
        stats.referencesReplaced += mediaStrings.filter((value) => mapping.has(value)).length;
      });
      affectedProductIds.add(product.id);
      saveManifest(manifest);
    }
  }

  if (mode === 'apply' && affectedProductIds.size > 0) {
    for (const productId of affectedProductIds) {
      await syncProductListingReadModel(productId);
      stats.listingRowsRebuilt += 1;
    }
  }

  // Listing-row direct scan / repair for leftover data: images
  const listingRows = await db.productListingRow.findMany({
    where: { image: { startsWith: 'data:' } },
    select: { id: true, productId: true, image: true, locale: true },
  });
  for (const row of listingRows) {
    stats.base64ReferencesFound += 1;
    if (mode === 'dry-run') {
      logger.alwaysInfo('[dry-run] listing row has data: image', {
        productId: row.productId,
        locale: row.locale,
        ref: redactImageRefForLog(row.image),
      });
      continue;
    }
    if (mode === 'apply' && row.image) {
      const uploaded = await uploadDataUrlToR2(row.image, manifest);
      if ('error' in uploaded) {
        stats.failedImages += 1;
        continue;
      }
      if (uploaded.reused) {
        stats.duplicatesReused += 1;
      } else {
        stats.uniqueImagesUploaded += 1;
      }
      await db.productListingRow.update({
        where: { id: row.id },
        data: { image: uploaded.url, images: [uploaded.url] },
      });
      stats.referencesReplaced += 1;
      saveManifest(manifest);
    }
  }

  for (const product of products) {
    const mediaOk = extractMediaStrings(product.media).some(
      (value) => toPersistedProductImageUrl(value) !== null,
    );
    if (!mediaOk) {
      stats.productsStillWithoutValidImage += 1;
    }
  }

  if (mode === 'apply') {
    saveManifest(manifest);
  }

  process.stdout.write(`${JSON.stringify({ mode, stats }, null, 2)}\n`);
  await db.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
