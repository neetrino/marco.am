/**
 * Cleanup unclaimed draft product image uploads older than a safe threshold.
 * Objects under products/drafts/ that are not referenced by Product.media / variants / listing rows.
 *
 * Usage:
 *   pnpm cleanup:orphan-product-image-uploads --dry-run
 *   pnpm cleanup:orphan-product-image-uploads --apply --older-than-days=7
 *
 * Requires AWS SDK ListObjects on the R2 bucket (same credentials as upload).
 */

import { ListObjectsV2Command, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import { isR2Configured } from '@/lib/r2';

loadEnvConfig(process.cwd());

const DEFAULT_OLDER_THAN_DAYS = 7;
const DRAFT_PREFIX = 'products/drafts/';

function readOlderThanDays(argv: string[]): number {
  const hit = argv.find((arg) => arg.startsWith('--older-than-days='));
  if (!hit) {
    return DEFAULT_OLDER_THAN_DAYS;
  }
  const parsed = Number(hit.slice('--older-than-days='.length));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_OLDER_THAN_DAYS;
}

function createR2Client(): { client: S3Client; bucket: string; publicBase: string } | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }
  return {
    bucket: bucketName,
    publicBase: publicUrl.replace(/\/$/, ''),
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

function publicUrlForKey(publicBase: string, key: string): string {
  const path = key.startsWith('/') ? key.slice(1) : key;
  return `${publicBase}/${path}`;
}

async function collectReferencedUrls(): Promise<Set<string>> {
  const referenced = new Set<string>();
  const products = await db.product.findMany({
    where: { deletedAt: null },
    select: { media: true, variants: { select: { imageUrl: true } } },
  });
  for (const product of products) {
    if (Array.isArray(product.media)) {
      for (const item of product.media) {
        if (typeof item === 'string' && item.startsWith('http')) {
          referenced.add(item);
        } else if (item && typeof item === 'object') {
          const obj = item as { url?: string; src?: string; value?: string };
          const candidate = obj.url ?? obj.src ?? obj.value;
          if (typeof candidate === 'string' && candidate.startsWith('http')) {
            referenced.add(candidate);
          }
        }
      }
    }
    for (const variant of product.variants) {
      if (variant.imageUrl?.startsWith('http')) {
        referenced.add(variant.imageUrl);
      }
    }
  }
  const listing = await db.productListingRow.findMany({
    where: { image: { not: null } },
    select: { image: true },
  });
  for (const row of listing) {
    if (row.image?.startsWith('http')) {
      referenced.add(row.image);
    }
  }
  return referenced;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const olderThanDays = readOlderThanDays(argv);
  const cutoffMs = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

  if (!isR2Configured()) {
    throw new Error('R2 is not configured');
  }
  const r2 = createR2Client();
  if (!r2) {
    throw new Error('R2 client unavailable');
  }

  const referenced = await collectReferencedUrls();
  let listed = 0;
  let candidates = 0;
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const page = await r2.client.send(
      new ListObjectsV2Command({
        Bucket: r2.bucket,
        Prefix: DRAFT_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );
    for (const object of page.Contents ?? []) {
      listed += 1;
      if (!object.Key || !object.LastModified) {
        continue;
      }
      if (object.LastModified.getTime() > cutoffMs) {
        continue;
      }
      const url = publicUrlForKey(r2.publicBase, object.Key);
      if (referenced.has(url)) {
        continue;
      }
      candidates += 1;
      if (!apply) {
        process.stdout.write(
          `${JSON.stringify({ action: 'would-delete', key: object.Key, lastModified: object.LastModified.toISOString() })}\n`,
        );
        continue;
      }
      await r2.client.send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: object.Key }));
      deleted += 1;
      process.stdout.write(`${JSON.stringify({ action: 'deleted', key: object.Key })}\n`);
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  process.stdout.write(
    `${JSON.stringify({
      mode: apply ? 'apply' : 'dry-run',
      olderThanDays,
      listed,
      orphanCandidates: candidates,
      deleted,
    })}\n`,
  );
  await db.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
