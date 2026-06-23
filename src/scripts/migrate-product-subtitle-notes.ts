/**
 * Moves legacy description note rows (empty title) into ProductTranslation.subtitle.
 *
 * Usage: pnpm exec tsx src/scripts/migrate-product-subtitle-notes.ts
 *        pnpm exec tsx src/scripts/migrate-product-subtitle-notes.ts --dry-run
 */

import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

import { PrismaClient } from '@white-shop/db/prisma';
import {
  getProductDescriptionNotes,
  getProductDescriptionSpecs,
  parseProductDescriptionJson,
  toPrismaProductDescription,
} from '@/lib/products/product-description';
import {
  isProductSubtitleHtmlEmpty,
  normalizeProductSubtitleForEditor,
  sanitizeProductSubtitleHtml,
} from '@/lib/security/sanitize-product-html';

import { syncProductPdpReadModelBatch } from '@/lib/read-model/product-pdp-read-model-sync';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const syncReadModelOnly = process.argv.includes('--sync-read-model-only');
const BATCH_SIZE = 100;

function notesToSubtitleHtml(notes: Array<{ value: string }>): string {
  const joined = notes.map((note) => note.value.trim()).join('<br>');
  return sanitizeProductSubtitleHtml(normalizeProductSubtitleForEditor(joined));
}

interface TranslationUpdate {
  id: string;
  productId: string;
  slug: string;
  locale: string;
  subtitle: string | null;
  description: ReturnType<typeof toPrismaProductDescription>;
}

async function syncReadModelsForProducts(productIds: readonly string[]): Promise<void> {
  if (productIds.length === 0) {
    console.log('No products to sync.');
    return;
  }

  console.log(`Syncing PDP read-model for ${productIds.length} product(s)...`);
  const syncStartedAt = Date.now();
  await syncProductPdpReadModelBatch(productIds, {
    logProgress: (message) => console.log(message),
  });
  console.log(`PDP read-model synced in ${((Date.now() - syncStartedAt) / 1000).toFixed(1)}s.`);
}

async function migrate(): Promise<void> {
  if (syncReadModelOnly) {
    const rows = await prisma.productTranslation.findMany({
      where: { subtitle: { not: null } },
      select: { productId: true },
    });
    const productIds = [...new Set(rows.map((row) => row.productId))];
    await syncReadModelsForProducts(productIds);
    return;
  }

  const startedAt = Date.now();
  const translations = await prisma.productTranslation.findMany({
    select: {
      id: true,
      locale: true,
      subtitle: true,
      description: true,
      productId: true,
      slug: true,
    },
  });

  const pending: TranslationUpdate[] = [];

  for (const translation of translations) {
    const entries = parseProductDescriptionJson(translation.description);
    const notes = getProductDescriptionNotes(entries);
    if (notes.length === 0) {
      continue;
    }

    const specs = getProductDescriptionSpecs(entries);
    const nextSubtitle = isProductSubtitleHtmlEmpty(translation.subtitle)
      ? notesToSubtitleHtml(notes)
      : translation.subtitle;

    pending.push({
      id: translation.id,
      productId: translation.productId,
      slug: translation.slug,
      locale: translation.locale,
      subtitle: nextSubtitle,
      description: toPrismaProductDescription(specs),
    });
  }

  console.log(
    `Found ${pending.length} translation(s) with legacy note rows (of ${translations.length} total).`,
  );

  if (dryRun) {
    console.log(`Dry run — no writes. Example: ${pending[0]?.slug ?? 'n/a'} (${pending[0]?.locale ?? 'n/a'})`);
    return;
  }

  for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
    const batch = pending.slice(offset, offset + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((item) =>
        prisma.productTranslation.update({
          where: { id: item.id },
          data: {
            subtitle: item.subtitle,
            description: item.description,
          },
        }),
      ),
    );
    console.log(`Updated ${Math.min(offset + BATCH_SIZE, pending.length)}/${pending.length}`);
  }

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Done. ${pending.length} translation(s) updated in ${elapsedSec}s.`);

  const productIds = [...new Set(pending.map((item) => item.productId))];
  await syncReadModelsForProducts(productIds);
}

migrate()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
