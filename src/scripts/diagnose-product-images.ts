/**
 * Diagnose persisted product image health (Base64 / HTTPS / missing).
 *
 * Usage:
 *   pnpm diagnose:product-images
 *   pnpm diagnose:product-images --strict
 */

import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import {
  classifyInvalidPersistedProductImage,
  isDataOrBlobImageReference,
  redactImageRefForLog,
  toPersistedProductImageUrl,
} from '@/lib/products/persisted-product-image-url';

loadEnvConfig(process.cwd());

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

async function main(): Promise<void> {
  const strict = process.argv.includes('--strict');

  const products = await db.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      media: true,
      variants: { select: { sku: true, imageUrl: true } },
    },
  });

  let httpsMedia = 0;
  let dataMedia = 0;
  let rawBase64Media = 0;
  let blobMedia = 0;
  let noImage = 0;
  let invalidVariantImageUrl = 0;
  const offending: Array<{ productId: string; sku: string | null; issue: string; ref: string | null }> =
    [];

  for (const product of products) {
    const media = extractMediaStrings(product.media);
    const sku =
      product.variants.map((variant) => variant.sku).find((value) => Boolean(value?.trim())) ??
      null;

    if (media.length === 0) {
      noImage += 1;
    }

    let hasValid = false;
    for (const value of media) {
      const reason = classifyInvalidPersistedProductImage(value);
      if (reason === null) {
        hasValid = true;
        httpsMedia += 1;
        continue;
      }
      if (reason === 'data_url') {
        dataMedia += 1;
        offending.push({
          productId: product.id,
          sku,
          issue: 'product.media data:',
          ref: redactImageRefForLog(value),
        });
      } else if (reason === 'raw_base64') {
        rawBase64Media += 1;
        offending.push({
          productId: product.id,
          sku,
          issue: 'product.media raw_base64',
          ref: 'base64:[redacted]',
        });
      } else if (reason === 'blob_url') {
        blobMedia += 1;
        offending.push({
          productId: product.id,
          sku,
          issue: 'product.media blob:',
          ref: redactImageRefForLog(value),
        });
      }
    }

    if (media.length > 0 && !hasValid) {
      // counted in no usable image via stillWithout later if needed
    }

    for (const variant of product.variants) {
      if (!variant.imageUrl) {
        continue;
      }
      if (toPersistedProductImageUrl(variant.imageUrl) === null) {
        invalidVariantImageUrl += 1;
        offending.push({
          productId: product.id,
          sku: variant.sku,
          issue: 'variant.imageUrl invalid',
          ref: redactImageRefForLog(variant.imageUrl),
        });
      }
    }
  }

  const listingInvalid = await db.productListingRow.findMany({
    where: {
      OR: [{ image: { startsWith: 'data:' } }, { image: { startsWith: 'blob:' } }],
    },
    select: { productId: true, locale: true, image: true },
    take: 500,
  });

  for (const row of listingInvalid) {
    offending.push({
      productId: row.productId,
      sku: null,
      issue: `listingRow[${row.locale}].image invalid`,
      ref: redactImageRefForLog(row.image),
    });
  }

  const summary = {
    totalProducts: products.length,
    productsWithValidHttpsMediaSamples: httpsMedia,
    productsContainingDataMediaRefs: dataMedia,
    productsContainingRawBase64Refs: rawBase64Media,
    productsContainingBlobRefs: blobMedia,
    productsWithEmptyMedia: noImage,
    variantsContainingInvalidImageUrl: invalidVariantImageUrl,
    listingRowsContainingInvalidImage: listingInvalid.length,
    offendingSample: offending.slice(0, 50),
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  const hasBase64 =
    dataMedia > 0 ||
    rawBase64Media > 0 ||
    blobMedia > 0 ||
    listingInvalid.some((row) => isDataOrBlobImageReference(row.image));

  await db.$disconnect();

  if (strict && hasBase64) {
    process.exit(2);
  }
}

main().catch(async (error: unknown) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
