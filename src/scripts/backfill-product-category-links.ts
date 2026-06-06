/**
 * Backfill product category links: primaryCategoryId, categoryIds[], and categories M2M.
 *
 * Usage (from repo root):
 *   pnpm run backfill:product-categories
 *   pnpm run backfill:product-categories -- --dry-run
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import {
  normalizeProductCategoryLinks,
  toProductCategoriesSet,
  type CategoryGraph,
} from "@/lib/services/product-category-links.service";
import { invalidateCategoryPublicCaches } from "@/lib/services/read-through-json-cache";

const BATCH_SIZE = 50;

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
  const dryRun = process.argv.includes("--dry-run");

  const [products, categories] = await Promise.all([
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

  const categoryGraph = buildCategoryGraph(categories);
  const pendingUpdates: Array<{
    id: string;
    primaryCategoryId: string | null;
    categoryIds: string[];
  }> = [];

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
      categoryGraph,
    );

    const m2mIds = product.categories.map((category) => category.id);
    const needsUpdate =
      product.primaryCategoryId !== normalized.primaryCategoryId ||
      !idsEqual(product.categoryIds, normalized.categoryIds) ||
      !idsEqual(m2mIds, normalized.categoryIds);

    if (!needsUpdate) {
      continue;
    }

    pendingUpdates.push({
      id: product.id,
      primaryCategoryId: normalized.primaryCategoryId,
      categoryIds: normalized.categoryIds,
    });
  }

  if (!dryRun && pendingUpdates.length > 0) {
    for (let offset = 0; offset < pendingUpdates.length; offset += BATCH_SIZE) {
      const batch = pendingUpdates.slice(offset, offset + BATCH_SIZE);
      await db.$transaction(
        batch.map((update) =>
          db.product.update({
            where: { id: update.id },
            data: {
              primaryCategoryId: update.primaryCategoryId,
              categoryIds: update.categoryIds,
              categories: toProductCategoriesSet(update.categoryIds),
            },
          }),
        ),
      );
    }

    await invalidateCategoryPublicCaches();
  }

  process.stdout.write(
    `Backfill complete: ${pendingUpdates.length} / ${products.length} products updated${dryRun ? " (dry-run)" : ""}\n`,
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
