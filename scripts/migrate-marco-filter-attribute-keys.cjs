/**
 * Rename marco_filter_{N} attribute keys to semantic slugs from hy labels (E4).
 *
 *   node scripts/migrate-marco-filter-attribute-keys.cjs --dry-run
 *   node scripts/migrate-marco-filter-attribute-keys.cjs --execute
 */
const path = require('path');

require('@next/env').loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  '..',
  'shared',
  'db',
  'generated',
  'prisma-client',
));

const TEMP_KEY_PREFIX = '__migrate_attr__';

function toAsciiSlug(value, fallbackPrefix) {
  const slug = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || fallbackPrefix;
}

async function renameVariantAttributesJson(prisma, oldKey, newKey) {
  if (oldKey === newKey) {
    return 0;
  }
  const rows = await prisma.$executeRawUnsafe(
    `
    UPDATE "product_variants"
    SET "attributes" = ("attributes" - $1) || jsonb_build_object($2, "attributes"->$1)
    WHERE "attributes" IS NOT NULL
      AND jsonb_typeof("attributes") = 'object'
      AND "attributes" ? $1
    `,
    oldKey,
    newKey,
  );
  return Number(rows) || 0;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
  const prisma = new PrismaClient();

  try {
    const attributes = await prisma.attribute.findMany({
      where: { key: { startsWith: 'marco_filter_' } },
      select: {
        id: true,
        key: true,
        translations: { where: { locale: 'hy' }, select: { name: true } },
      },
      orderBy: { key: 'asc' },
    });

    const plan = attributes.map((attribute) => {
      const label = attribute.translations[0]?.name ?? attribute.key;
      const newKey = toAsciiSlug(label, attribute.key);
      return {
        id: attribute.id,
        oldKey: attribute.key,
        newKey,
        label,
      };
    });

    const slugOwners = new Map();
    for (const row of plan) {
      if (slugOwners.has(row.newKey) && slugOwners.get(row.newKey) !== row.oldKey) {
        throw new Error(`Slug collision: ${row.newKey} for ${row.oldKey} and ${slugOwners.get(row.newKey)}`);
      }
      slugOwners.set(row.newKey, row.oldKey);
    }

    const changes = plan.filter((row) => row.oldKey !== row.newKey);
    console.log(
      JSON.stringify(
        {
          mode: dryRun ? 'dry-run' : 'execute',
          total: plan.length,
          changes: changes.length,
          sample: changes.slice(0, 10),
        },
        null,
        2,
      ),
    );

    if (dryRun) {
      console.log('\nRun with --execute to apply.');
      return;
    }

    for (const row of changes) {
      await prisma.attribute.update({
        where: { id: row.id },
        data: { key: `${TEMP_KEY_PREFIX}${row.id}` },
      });
    }

    let optionsUpdated = 0;
    let jsonUpdated = 0;
    for (const row of changes) {
      await prisma.attribute.update({
        where: { id: row.id },
        data: { key: row.newKey },
      });
      const optionResult = await prisma.productVariantOption.updateMany({
        where: { attributeKey: row.oldKey },
        data: { attributeKey: row.newKey },
      });
      optionsUpdated += optionResult.count;
      jsonUpdated += await renameVariantAttributesJson(prisma, row.oldKey, row.newKey);
      console.log(`[migrate] ${row.oldKey} -> ${row.newKey}`);
    }

    console.log(
      JSON.stringify(
        {
          applied: changes.length,
          optionsUpdated,
          jsonUpdated,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[migrate-marco-filter-attribute-keys] fatal', error);
  process.exit(1);
});
