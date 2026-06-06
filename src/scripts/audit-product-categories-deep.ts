/**
 * Deep audit: verify categoryIds include ancestor chains and M2M sync.
 * Usage: pnpm exec tsx src/scripts/audit-product-categories-deep.ts
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import {
  normalizeProductCategoryLinks,
  type CategoryGraph,
} from "@/lib/services/product-category-links.service";

function loadEnv(): void {
  loadEnvConfig(process.cwd());
}

function sortedIds(ids: string[]): string[] {
  return [...ids].sort();
}

function idsEqual(left: string[], right: string[]): boolean {
  const a = sortedIds(left);
  const b = sortedIds(right);
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function buildCategoryGraph(
  rows: Array<{ id: string; parentId: string | null }>,
): CategoryGraph {
  return new Map(rows.map((row) => [row.id, row]));
}

async function main(): Promise<void> {
  loadEnv();

  const [products, categoryRows] = await Promise.all([
    db.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        primaryCategoryId: true,
        categoryIds: true,
        categories: { select: { id: true } },
      },
    }),
    db.category.findMany({
      where: { deletedAt: null },
      select: { id: true, parentId: true },
    }),
  ]);

  const graph = buildCategoryGraph(categoryRows);
  let needsNormalization = 0;
  let leafOnlyLinks = 0;
  const samples: string[] = [];

  for (const product of products) {
    const hasLinks =
      product.primaryCategoryId !== null ||
      product.categoryIds.length > 0 ||
      product.categories.length > 0;

    if (!hasLinks) {
      continue;
    }

    const normalized = await normalizeProductCategoryLinks(
      {
        primaryCategoryId: product.primaryCategoryId,
        categoryIds:
          product.categoryIds.length > 0
            ? product.categoryIds
            : product.primaryCategoryId
              ? [product.primaryCategoryId]
              : product.categories.map((category) => category.id),
      },
      undefined,
      graph,
    );

    const m2mIds = product.categories.map((category) => category.id);
    const needsUpdate =
      product.primaryCategoryId !== normalized.primaryCategoryId ||
      !idsEqual(product.categoryIds, normalized.categoryIds) ||
      !idsEqual(m2mIds, normalized.categoryIds);

    if (needsUpdate) {
      needsNormalization += 1;
      if (samples.length < 5) {
        samples.push(
          `${product.id}: stored=${product.categoryIds.length} normalized=${normalized.categoryIds.length}`,
        );
      }
    }

    const explicitCount = product.categoryIds.filter((id) => {
      const row = graph.get(id);
      if (!row?.parentId) {
        return true;
      }
      return !product.categoryIds.includes(row.parentId);
    }).length;

    if (
      product.categoryIds.length > 0 &&
      normalized.categoryIds.length > product.categoryIds.length
    ) {
      leafOnlyLinks += 1;
    }
  }

  process.stdout.write(
    [
      `Products total: ${products.length}`,
      `Need normalization (missing ancestors / M2M drift): ${needsNormalization}`,
      `Leaf-only categoryIds (ancestors missing): ${leafOnlyLinks}`,
      ...(samples.length > 0 ? [`Samples:\n  ${samples.join("\n  ")}`] : []),
    ].join("\n") + "\n",
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
