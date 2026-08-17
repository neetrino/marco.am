/**
 * Copies product specification rows onto every locale that is missing them.
 *
 * Import/legacy data often stored specs only on hy/ru while the admin editor
 * reads/writes en. This backfill mirrors nonempty description JSON to empty
 * sibling locales, then rebuilds listing + PDP read models.
 *
 * Usage:
 *   pnpm exec tsx src/scripts/backfill-product-descriptions-across-locales.ts
 *   pnpm exec tsx src/scripts/backfill-product-descriptions-across-locales.ts --dry-run
 */

import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

import { PrismaClient } from '@white-shop/db/prisma';
import {
  parseProductDescriptionJson,
  toPrismaProductDescription,
  type ProductDescriptionEntry,
} from '@/lib/products/product-description';
import { syncProductListingReadModelBatch } from '@/lib/read-model/product-read-model-sync';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const BATCH_SIZE = 100;
const LOCALE_PRIORITY = ['en', 'hy', 'ru', 'ka'] as const;

function logLine(message: string): void {
  process.stdout.write(`${message}\n`);
}

function pickSourceDescription(
  rows: Array<{ locale: string; description: unknown }>,
): ProductDescriptionEntry[] | null {
  for (const locale of LOCALE_PRIORITY) {
    const row = rows.find((entry) => entry.locale === locale);
    const specs = parseProductDescriptionJson(row?.description);
    if (specs.length > 0) {
      return specs;
    }
  }

  for (const row of rows) {
    const specs = parseProductDescriptionJson(row.description);
    if (specs.length > 0) {
      return specs;
    }
  }

  return null;
}

async function main(): Promise<void> {
  logLine(
    dryRun
      ? '[dry-run] Scanning product translations for missing description specs…'
      : 'Backfilling product description specs across locales…',
  );

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      translations: {
        select: { id: true, locale: true, description: true },
      },
    },
  });

  const productIdsToSync: string[] = [];
  let translationsUpdated = 0;

  for (const product of products) {
    const source = pickSourceDescription(product.translations);
    if (!source) {
      continue;
    }

    const targets = product.translations.filter(
      (row) => parseProductDescriptionJson(row.description).length === 0,
    );
    if (targets.length === 0) {
      continue;
    }

    productIdsToSync.push(product.id);
    translationsUpdated += targets.length;

    logLine(
      `product=${product.id} sourceSpecs=${source.length} emptyLocales=${targets
        .map((row) => row.locale)
        .join(',')}`,
    );

    if (dryRun) {
      continue;
    }

    await prisma.productTranslation.updateMany({
      where: { id: { in: targets.map((row) => row.id) } },
      data: { description: toPrismaProductDescription(source) },
    });
  }

  logLine(
    `${dryRun ? '[dry-run] Would update' : 'Updated'} ${translationsUpdated} translation(s) across ${productIdsToSync.length} product(s).`,
  );

  if (dryRun || productIdsToSync.length === 0) {
    return;
  }

  for (let index = 0; index < productIdsToSync.length; index += BATCH_SIZE) {
    const batch = productIdsToSync.slice(index, index + BATCH_SIZE);
    logLine(`Syncing read models ${index + 1}–${index + batch.length} / ${productIdsToSync.length}…`);
    await syncProductListingReadModelBatch(batch);
  }

  logLine('Done.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
