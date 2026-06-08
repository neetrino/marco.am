/**
 * Adds description JSONB, migrates HTML rows, drops descriptionHtml.
 * Usage: pnpm exec tsx src/scripts/apply-product-description-migration.ts
 */

import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import {
  parseDescriptionHtmlToEntries,
  toPrismaProductDescription,
} from '../lib/products/product-description';

loadEnvConfig(process.cwd());

const BATCH_SIZE = 100;

type LegacyRow = {
  id: string;
  descriptionHtml: string;
};

async function hasColumn(columnName: string): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'product_translations'
        AND column_name = ${columnName}
    ) AS "exists"
  `;
  return rows[0]?.exists === true;
}

async function ensureDescriptionColumn(): Promise<void> {
  await db.$executeRawUnsafe(
    'ALTER TABLE "product_translations" ADD COLUMN IF NOT EXISTS "description" JSONB',
  );
}

async function fetchBatch(cursor: string | null): Promise<LegacyRow[]> {
  if (cursor) {
    return db.$queryRaw<LegacyRow[]>`
      SELECT id, "descriptionHtml"
      FROM product_translations
      WHERE "descriptionHtml" IS NOT NULL
        AND "description" IS NULL
        AND id > ${cursor}
      ORDER BY id ASC
      LIMIT ${BATCH_SIZE}
    `;
  }

  return db.$queryRaw<LegacyRow[]>`
    SELECT id, "descriptionHtml"
    FROM product_translations
    WHERE "descriptionHtml" IS NOT NULL
      AND "description" IS NULL
    ORDER BY id ASC
    LIMIT ${BATCH_SIZE}
  `;
}

async function migrateHtmlRows(): Promise<number> {
  let cursor: string | null = null;
  let updated = 0;

  for (;;) {
    const batch = await fetchBatch(cursor);
    if (batch.length === 0) {
      break;
    }

    for (const row of batch) {
      const entries = parseDescriptionHtmlToEntries(row.descriptionHtml);
      await db.productTranslation.update({
        where: { id: row.id },
        data: { description: toPrismaProductDescription(entries) },
      });
      updated += 1;
    }

    cursor = batch[batch.length - 1]?.id ?? null;
    process.stdout.write(`Migrated ${updated} rows…\n`);
  }

  return updated;
}

async function dropDescriptionHtmlColumn(): Promise<void> {
  await db.$executeRawUnsafe(
    'ALTER TABLE "product_translations" DROP COLUMN IF EXISTS "descriptionHtml"',
  );
}

async function main(): Promise<void> {
  await ensureDescriptionColumn();

  const hasLegacyColumn = await hasColumn('descriptionHtml');
  if (hasLegacyColumn) {
    const updated = await migrateHtmlRows();
    process.stdout.write(`Converted ${updated} translations to JSON description.\n`);
    await dropDescriptionHtmlColumn();
    process.stdout.write('Dropped descriptionHtml column.\n');
    return;
  }

  process.stdout.write('descriptionHtml column not found — schema already migrated.\n');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
