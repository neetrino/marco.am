/**
 * One-off migration: collapse the wrongly-imported "variant" image into the product gallery.
 *
 * Background: the CSV import created every product as a single-variant product and copied the
 * gallery main image into `variant.imageUrl`. The read-time gallery builder excludes variant
 * images, so the main photo dropped out of the gallery for multi-image products and the card/PDP
 * diverged. There are no real multi-variant products.
 *
 * Action per product (single variant only):
 *  - ensure each `variant.imageUrl` URL is present in `product.media` (prepend if missing → media[0]);
 *  - clear `variant.imageUrl` to null.
 *
 * Usage (repo root):
 *   pnpm exec tsx src/scripts/fix-variant-image-to-media.ts --dry-run
 *   pnpm exec tsx src/scripts/fix-variant-image-to-media.ts
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import {
  normalizeUrlForComparison,
  processImageUrl,
  smartSplitUrls,
} from "@/lib/utils/image-utils";

type MediaItem = string | { url?: string; src?: string; value?: string };

function mediaItemUrl(item: MediaItem): string | null {
  if (typeof item === "string") {
    return item;
  }
  if (item && typeof item === "object") {
    return item.url ?? item.src ?? item.value ?? null;
  }
  return null;
}

function variantImageUrls(imageUrl: string): string[] {
  return smartSplitUrls(imageUrl)
    .map((url) => processImageUrl(url))
    .filter((url): url is string => url !== null);
}

/** Returns new media array if it must change, otherwise null (already contains every variant url). */
function buildMediaWithVariantImages(
  media: MediaItem[],
  variantUrls: string[],
): MediaItem[] | null {
  const existingNormalized = new Set(
    media
      .map((item) => mediaItemUrl(item))
      .filter((url): url is string => Boolean(url))
      .map((url) => normalizeUrlForComparison(url)),
  );

  const missing = variantUrls.filter(
    (url) => !existingNormalized.has(normalizeUrlForComparison(url)),
  );

  if (missing.length === 0) {
    return null;
  }

  return [...missing, ...media];
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const dryRun = process.argv.includes("--dry-run");

  const products = await db.product.findMany({
    where: { deletedAt: null, variants: { some: { imageUrl: { not: null } } } },
    select: {
      id: true,
      media: true,
      variants: { select: { id: true, imageUrl: true } },
    },
  });

  let scanned = 0;
  let clearedVariants = 0;
  let mediaPrepended = 0;
  let skippedNoUrls = 0;

  for (const product of products) {
    scanned += 1;
    const media = Array.isArray(product.media) ? (product.media as MediaItem[]) : [];

    const allVariantUrls: string[] = [];
    for (const variant of product.variants) {
      if (variant.imageUrl) {
        allVariantUrls.push(...variantImageUrls(variant.imageUrl));
      }
    }

    if (allVariantUrls.length === 0) {
      skippedNoUrls += 1;
      continue;
    }

    const newMedia = buildMediaWithVariantImages(media, allVariantUrls);
    const variantIdsToClear = product.variants
      .filter((variant) => variant.imageUrl)
      .map((variant) => variant.id);

    if (dryRun) {
      if (newMedia) {
        mediaPrepended += 1;
      }
      clearedVariants += variantIdsToClear.length;
      continue;
    }

    await db.$transaction(async (tx) => {
      if (newMedia) {
        await tx.product.update({
          where: { id: product.id },
          data: { media: newMedia as object[] },
        });
      }
      await tx.productVariant.updateMany({
        where: { id: { in: variantIdsToClear } },
        data: { imageUrl: null },
      });
    });

    if (newMedia) {
      mediaPrepended += 1;
    }
    clearedVariants += variantIdsToClear.length;
  }

  logger.alwaysInfo("fix-variant-image-to-media finished", {
    dryRun,
    productsScanned: scanned,
    mediaPrepended,
    variantsCleared: clearedVariants,
    skippedNoUrls,
  });

  await db.$disconnect();
}

main().catch((error) => {
  logger.error("fix-variant-image-to-media failed", { error });
  void db.$disconnect();
  process.exit(1);
});
