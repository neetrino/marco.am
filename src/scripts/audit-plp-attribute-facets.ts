/**
 * Audit PLP attribute facets — counts, labels, category scope.
 *
 * Usage:
 *   pnpm exec tsx src/scripts/audit-plp-attribute-facets.ts
 *   pnpm exec tsx src/scripts/audit-plp-attribute-facets.ts --category=papovk-kahovyq
 */

import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import { aggregateProductsPlpFacets } from '@/lib/read-model/product-facet-live-aggregation';

loadEnvConfig(process.cwd());

function readCategoryArg(argv: string[]): string | undefined {
  const hit = argv.find((arg) => arg.startsWith('--category='));
  return hit?.slice('--category='.length).trim() || undefined;
}

async function main(): Promise<void> {
  const category = readCategoryArg(process.argv.slice(2));

  const [attrCount, facets, attributeRows] = await Promise.all([
    db.attribute.count(),
    aggregateProductsPlpFacets({ lang: 'hy', category }),
    db.attribute.findMany({
      orderBy: { key: 'asc' },
      select: {
        key: true,
        filterable: true,
        translations: { where: { locale: 'hy' }, select: { name: true } },
        _count: { select: { values: true } },
      },
    }),
  ]);

  const marco = attributeRows.filter((row) => row.key.startsWith('marco_filter_'));
  const broken = attributeRows.filter((row) => !row.key.trim());

  process.stdout.write(
    [
      `Scope: ${category ?? 'all published products'}`,
      `Attributes in DB: ${attrCount} (marco_filter_*: ${marco.length}, broken empty key: ${broken.length})`,
      `Visible PLP attribute facet groups: ${facets.attributeFacets.length}`,
      '',
      'Visible facets:',
      ...facets.attributeFacets.map(
        (facet) =>
          `  ${facet.label} [${facet.key}] — ${facet.values.length} values, coverage ${Math.max(...facet.values.map((v) => v.count), 0)}`,
      ),
    ].join('\n') + '\n',
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
