/**
 * Report products whose admin products-list image resolves to null.
 *
 * Usage:
 *   pnpm exec tsx src/scripts/diagnose-admin-product-list-images.ts
 *   pnpm exec tsx src/scripts/diagnose-admin-product-list-images.ts --limit=50
 */

import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import { explainAdminProductListImageResolution } from '@/lib/admin/admin-list-product-image-diagnostics';
import { resolveAdminProductListImageUrl } from '@/lib/admin/admin-list-product-image';

loadEnvConfig(process.cwd());

const DEFAULT_LIMIT = 100;

function readLimit(argv: string[]): number {
  const hit = argv.find((arg) => arg.startsWith('--limit='));
  if (!hit) {
    return DEFAULT_LIMIT;
  }
  const parsed = Number(hit.slice('--limit='.length));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_LIMIT;
}

async function main(): Promise<void> {
  const limit = readLimit(process.argv.slice(2));

  const products = await db.product.findMany({
    where: { deletedAt: null },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      media: true,
      translations: {
        where: { locale: 'en' },
        take: 1,
        select: { title: true },
      },
      variants: {
        where: { published: true },
        select: {
          sku: true,
          imageUrl: true,
          price: true,
          published: true,
        },
      },
    },
  });

  const productIds = products.map((product) => product.id);
  const listingRows = await db.productListingRow.findMany({
    where: { productId: { in: productIds }, locale: 'en' },
    select: { productId: true, image: true },
  });
  const listingByProductId = new Map(
    listingRows.map((row) => [row.productId, row.image ?? null] as const),
  );

  let nullCount = 0;
  let needsR2Repair = 0;
  let hasHttpMedia = 0;

  for (const product of products) {
    const listingRowImage = listingByProductId.get(product.id) ?? null;
    const resolved = resolveAdminProductListImageUrl(
      product.media,
      product.variants,
      listingRowImage,
    );
    if (resolved) {
      hasHttpMedia += 1;
      continue;
    }

    nullCount += 1;
    const explained = explainAdminProductListImageResolution({
      media: product.media,
      variants: product.variants,
      listingRowImage,
    });

    const mediaArray = Array.isArray(product.media) ? product.media : [];
    const hasDataOnly =
      mediaArray.length > 0 &&
      explained.mediaPreviews.every((preview) => preview === 'data:…' || preview === 'base64:…');
    if (hasDataOnly || (listingRowImage && listingRowImage.toLowerCase().startsWith('data:'))) {
      needsR2Repair += 1;
    }

    const sku =
      product.variants.map((variant) => variant.sku).find((value) => Boolean(value?.trim())) ??
      null;

    process.stdout.write(
      `${JSON.stringify({
        productId: product.id,
        sku,
        englishTitle: product.translations[0]?.title ?? null,
        mediaCount: mediaArray.length,
        mediaPreviews: explained.mediaPreviews,
        variantImageUrls: product.variants.map((variant) => {
          const raw = variant.imageUrl?.trim() ?? '';
          if (!raw) {
            return null;
          }
          if (raw.toLowerCase().startsWith('data:')) {
            return 'data:…';
          }
          return raw.length > 80 ? `${raw.slice(0, 80)}…` : raw;
        }),
        listingRowImage: listingRowImage
          ? listingRowImage.toLowerCase().startsWith('data:')
            ? 'data:…'
            : listingRowImage.length > 80
              ? `${listingRowImage.slice(0, 80)}…`
              : listingRowImage
          : null,
        finalResolvedAdminImage: explained.image,
        candidates: explained.candidates,
        likelyNeedsR2Reupload: hasDataOnly,
      })}\n`,
    );
  }

  process.stdout.write(
    `${JSON.stringify({
      summary: {
        sampled: products.length,
        adminImageNull: nullCount,
        adminImageResolved: hasHttpMedia,
        likelyNeedsR2Reupload: needsR2Repair,
      },
    })}\n`,
  );

  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  void db.$disconnect();
  process.exit(1);
});
