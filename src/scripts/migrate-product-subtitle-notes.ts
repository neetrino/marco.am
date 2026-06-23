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

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function notesToSubtitleHtml(notes: Array<{ value: string }>): string {
  const joined = notes.map((note) => note.value.trim()).join('<br>');
  return sanitizeProductSubtitleHtml(normalizeProductSubtitleForEditor(joined));
}

async function migrate(): Promise<void> {
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

  let updated = 0;

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

    console.log(
      `[${dryRun ? 'dry-run' : 'update'}] ${translation.slug} (${translation.locale}): ${notes.length} note(s) -> subtitle`,
    );

    if (!dryRun) {
      await prisma.productTranslation.update({
        where: { id: translation.id },
        data: {
          subtitle: nextSubtitle,
          description: toPrismaProductDescription(specs),
        },
      });
    }

    updated += 1;
  }

  console.log(`Done. ${updated} translation(s) ${dryRun ? 'would be' : 'were'} updated.`);
}

migrate()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
