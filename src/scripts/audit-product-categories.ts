/**
 * Audit product ↔ category link consistency.
 * Usage: pnpm exec tsx src/scripts/audit-product-categories.ts
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import { isLegacyShopCategoryFromTranslations } from "@/lib/constants/excluded-shop-category-slugs";

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

async function main(): Promise<void> {
  loadEnv();

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
      select: {
        id: true,
        translations: { select: { slug: true, title: true } },
      },
    }),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  let noLinks = 0;
  let m2mMismatch = 0;
  let legacyLinked = 0;
  let missingPrimaryInIds = 0;

  for (const product of products) {
    const hasLinks =
      product.primaryCategoryId !== null ||
      product.categoryIds.length > 0 ||
      product.categories.length > 0;

    if (!hasLinks) {
      noLinks += 1;
      continue;
    }

    const m2mIds = product.categories.map((c) => c.id);
    if (!idsEqual(m2mIds, product.categoryIds)) {
      m2mMismatch += 1;
    }

    if (
      product.primaryCategoryId &&
      !product.categoryIds.includes(product.primaryCategoryId)
    ) {
      missingPrimaryInIds += 1;
    }

    const linkedIds = [
      ...new Set([
        ...(product.primaryCategoryId ? [product.primaryCategoryId] : []),
        ...product.categoryIds,
        ...m2mIds,
      ]),
    ];

    if (
      linkedIds.some((id) => {
        const cat = categoryById.get(id);
        return cat && isLegacyShopCategoryFromTranslations(cat.translations);
      })
    ) {
      legacyLinked += 1;
    }
  }

  process.stdout.write(
    [
      `Products total: ${products.length}`,
      `No category links: ${noLinks}`,
      `M2M vs categoryIds mismatch: ${m2mMismatch}`,
      `primaryCategoryId not in categoryIds: ${missingPrimaryInIds}`,
      `Linked to legacy category: ${legacyLinked}`,
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
