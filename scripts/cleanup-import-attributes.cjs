/**
 * Cleanup import attribute artifacts (E2/E6).
 *
 *   node scripts/cleanup-import-attributes.cjs --dry-run
 *   node scripts/cleanup-import-attributes.cjs --execute
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

const MIN_PRODUCTS_FOR_FILTERABLE = 3;
const TEMP_KEY_PREFIX = '__cleanup_empty_key__';

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

async function countProductsForAttribute(prisma, attributeId) {
  return prisma.product.count({
    where: {
      deletedAt: null,
      OR: [
        { productAttributes: { some: { attributeId } } },
        { variants: { some: { options: { some: { attributeId } } } } },
      ],
    },
  });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
  const prisma = new PrismaClient();

  try {
    const broken = await prisma.attribute.findMany({
      where: { OR: [{ key: '' }, { key: { startsWith: ' ' } }] },
      select: { id: true, key: true, _count: { select: { values: true } } },
    });

    const marco = await prisma.attribute.findMany({
      where: { key: { startsWith: 'marco_filter_' } },
      select: { id: true, key: true, filterable: true },
    });

    const disableCandidates = [];
    for (const attribute of marco) {
      const productCount = await countProductsForAttribute(prisma, attribute.id);
      if (productCount < MIN_PRODUCTS_FOR_FILTERABLE && attribute.filterable) {
        disableCandidates.push({ id: attribute.id, key: attribute.key, productCount });
      }
    }

    const report = {
      mode: dryRun ? 'dry-run' : 'execute',
      brokenAttributes: broken,
      disableFilterable: disableCandidates,
    };
    console.log(JSON.stringify(report, null, 2));

    if (dryRun) {
      console.log('\nRun with --execute to apply.');
      return;
    }

    for (const attribute of broken) {
      await prisma.attribute.update({
        where: { id: attribute.id },
        data: { key: `${TEMP_KEY_PREFIX}${attribute.id}` },
      });
      await prisma.attribute.delete({ where: { id: attribute.id } });
      console.log(`[cleanup] deleted broken attribute ${attribute.id}`);
    }

    if (disableCandidates.length > 0) {
      const result = await prisma.attribute.updateMany({
        where: { id: { in: disableCandidates.map((row) => row.id) } },
        data: { filterable: false },
      });
      console.log(`[cleanup] filterable=false for ${result.count} sparse marco_filter attributes`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[cleanup-import-attributes] fatal', error);
  process.exit(1);
});
