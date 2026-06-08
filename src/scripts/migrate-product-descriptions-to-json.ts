/**
 * Migrates product_translations.descriptionHtml (HTML) to description (JSON array).
 * Usage: pnpm exec tsx src/scripts/migrate-product-descriptions-to-json.ts
 *
 * Run BEFORE applying migration that drops descriptionHtml if the column still exists.
 * Safe to re-run: only rows with null description and non-null descriptionHtml are updated.
 */

import { loadEnvConfig } from '@next/env';
import { Prisma } from '@white-shop/db/prisma';
import { db } from '@white-shop/db';
import {
  parseDescriptionHtmlToEntries,
  toPrismaProductDescription,
} from '../lib/products/product-description';

loadEnvConfig(process.cwd());

const BATCH_SIZE = 100;

type LegacyTranslationRow = {
  id: string;
  descriptionHtml: string | null;
};

async function hasDescriptionHtmlColumn(): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'product_translations'
        AND column_name = 'descriptionHtml'
    ) AS "exists"
  `;
  return rows[0]?.exists === true;
}

async function fetchLegacyBatch(cursor: string | null): Promise<LegacyTranslationRow[]> {
  return db.$queryRaw<LegacyTranslationRow[]>`
    SELECT id, "descriptionHtml"
    FROM product_translations
    WHERE "descriptionHtml" IS NOT NULL
      AND "description" IS NULL
      ${cursor ? Prisma.sql`AND id > ${cursor}` : Prisma.empty}
    ORDER BY id ASC
    LIMIT ${BATCH_SIZE}
  `;
}

async function updateDescription(id: string, description: ReturnType<typeof parseDescriptionHtmlToEntries>): Promise<void> {
  await db.productTranslation.update({
    where: { id },
    data: { description: toPrismaProductDescription(description) },
  });
}

async function main(): Promise<void> {
  const legacyColumnExists = await hasDescriptionHtmlColumn();
  if (!legacyColumnExists) {
    process.stdout.write('descriptionHtml column not found — nothing to migrate.\n');
    return;
  }

  let cursor: string | null = null;
  let migrated = 0;
  let empty = 0;

  for (;;) {
    const batch = await fetchLegacyBatch(cursor);

    if (batch.length === 0) {
      break;
    }

    for (const row of batch) {
      const html = row.descriptionHtml ?? '';
      const entries = parseDescriptionHtmlToEntries(html);
      await updateDescription(row.id, entries);
      if (entries.length > 0) {
        migrated += 1;
      } else {
        empty += 1;
      }
    }

    cursor = batch[batch.length - 1]?.id ?? null;
    process.stdout.write(`Processed batch ending at ${cursor}…\n`);
  }

  process.stdout.write(`Migration complete. Updated: ${migrated + empty}, with entries: ${migrated}, empty: ${empty}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
