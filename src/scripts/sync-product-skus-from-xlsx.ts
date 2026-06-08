/**
 * Replace product variant SKUs using Marco.xlsx "Артикул" column (matched by product title).
 *
 * Prepare map (when xlsx changes):
 *   python src/scripts/export-marco-xlsx-skus.py "C:\path\Marco.xlsx"
 *
 * Usage:
 *   pnpm exec tsx src/scripts/sync-product-skus-from-xlsx.ts --dry-run
 *   pnpm exec tsx src/scripts/sync-product-skus-from-xlsx.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";

const MAP_PATH = join(process.cwd(), "src/scripts/marco-xlsx-sku-map.json");
const TEMP_SKU_PREFIX = "__SKU_SYNC__";

type SkuMapFile = {
  byName: Record<string, string[]>;
  byArticul: Record<string, string>;
  stats?: Record<string, number>;
};

function loadEnv(): void {
  loadEnvConfig(process.cwd());
}

function parseArgs(argv: string[]): { dryRun: boolean } {
  return { dryRun: argv.includes("--dry-run") };
}

function loadSkuMap(): SkuMapFile {
  const raw = readFileSync(MAP_PATH, "utf8");
  return JSON.parse(raw) as SkuMapFile;
}

function normalizeTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function titleKey(value: string): string {
  return normalizeTitle(value).toLowerCase();
}

function pickProductTitle(
  translations: Array<{ title: string; locale: string }>,
): string {
  const hy = translations.find((t) => t.locale === "hy");
  if (hy?.title.trim()) {
    return normalizeTitle(hy.title);
  }
  const en = translations.find((t) => t.locale === "en");
  if (en?.title.trim()) {
    return normalizeTitle(en.title);
  }
  const fallback = translations[0]?.title ?? "";
  return normalizeTitle(fallback);
}

function resolveTargetArticul(
  articuls: string[],
  currentSku: string | null,
  assignedArticuls: Set<string>,
): string | null {
  if (articuls.length === 0) {
    return null;
  }

  if (currentSku && articuls.includes(currentSku)) {
    return currentSku;
  }

  const unused = articuls.filter((articul) => !assignedArticuls.has(articul));
  if (unused.length > 0) {
    return unused[0];
  }

  return null;
}

async function applySkuUpdates(
  updates: Array<{ variantId: string; newSku: string }>,
): Promise<number> {
  for (const row of updates) {
    await db.productVariant.update({
      where: { id: row.variantId },
      data: { sku: `${TEMP_SKU_PREFIX}${row.variantId}` },
    });
  }

  let updated = 0;
  for (const row of updates) {
    await db.productVariant.update({
      where: { id: row.variantId },
      data: { sku: row.newSku },
    });
    updated += 1;
    if (updated % 100 === 0) {
      logger.alwaysInfo(`Updated ${updated}/${updates.length}...`);
    }
  }

  return updated;
}

async function main(): Promise<void> {
  loadEnv();
  const { dryRun } = parseArgs(process.argv.slice(2));

  const skuMap = loadSkuMap();
  logger.alwaysInfo("Loaded SKU map", skuMap.stats ?? {});

  const products = await db.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      translations: { select: { title: true, locale: true } },
      variants: {
        select: { id: true, sku: true },
        orderBy: { position: "asc" },
      },
    },
  });

  logger.alwaysInfo(`DB products (not deleted): ${products.length}`);

  const assignedArticuls = new Set<string>();
  let matched = 0;
  let skippedNoMatch = 0;
  let skippedNoVariants = 0;
  let skippedSame = 0;
  let skippedConflict = 0;

  const updates: Array<{
    variantId: string;
    title: string;
    oldSku: string | null;
    newSku: string;
  }> = [];

  const sortedProducts = [...products].sort((left, right) => {
    const leftTitle = titleKey(pickProductTitle(left.translations));
    const rightTitle = titleKey(pickProductTitle(right.translations));
    const leftSku = left.variants[0]?.sku?.trim() ?? "";
    const rightSku = right.variants[0]?.sku?.trim() ?? "";
    const leftArticuls = skuMap.byName[leftTitle] ?? [];
    const rightArticuls = skuMap.byName[rightTitle] ?? [];
    const leftExact = leftArticuls.includes(leftSku) ? 0 : 1;
    const rightExact = rightArticuls.includes(rightSku) ? 0 : 1;
    if (leftExact !== rightExact) {
      return leftExact - rightExact;
    }
    const leftMarco = leftSku.startsWith("MARCO-") ? 1 : 0;
    const rightMarco = rightSku.startsWith("MARCO-") ? 1 : 0;
    return leftMarco - rightMarco;
  });

  for (const product of sortedProducts) {
    if (product.variants.length === 0) {
      skippedNoVariants += 1;
      continue;
    }

    const title = pickProductTitle(product.translations);
    const key = titleKey(title);
    const articuls = skuMap.byName[key];
    if (!articuls || articuls.length === 0) {
      skippedNoMatch += 1;
      continue;
    }

    matched += 1;
    const primaryVariant = product.variants[0];
    const currentSku = primaryVariant.sku?.trim() ?? null;
    const targetArticul = resolveTargetArticul(articuls, currentSku, assignedArticuls);

    if (!targetArticul) {
      skippedConflict += 1;
      logger.warn("[conflict] Could not assign articul", { title, articuls, currentSku });
      continue;
    }

    assignedArticuls.add(targetArticul);

    if (currentSku === targetArticul) {
      skippedSame += 1;
      continue;
    }

    updates.push({
      variantId: primaryVariant.id,
      title,
      oldSku: currentSku,
      newSku: targetArticul,
    });
  }

  logger.alwaysInfo("Plan summary", {
    matched,
    toUpdate: updates.length,
    skippedNoMatch,
    skippedNoVariants,
    skippedSame,
    skippedConflict,
    dryRun,
  });

  for (const row of updates.slice(0, 15)) {
    logger.alwaysInfo(`  ${row.title}: ${row.oldSku ?? "(empty)"} -> ${row.newSku}`);
  }

  const duplicateProductIds = findMarcoDuplicateProductIds(sortedProducts, skuMap, assignedArticuls);
  logger.alwaysInfo(`Duplicate MARCO products to remove: ${duplicateProductIds.length}`);

  if (dryRun) {
    logger.alwaysInfo("Dry run — no database changes.");
    return;
  }

  const updated = await applySkuUpdates(
    updates.map((row) => ({ variantId: row.variantId, newSku: row.newSku })),
  );

  logger.alwaysInfo(`Done. Updated ${updated} variant SKUs.`);

  if (duplicateProductIds.length === 0) {
    logger.alwaysInfo("No duplicate MARCO products to remove.");
    return;
  }

  logger.alwaysInfo(`Soft-deleting ${duplicateProductIds.length} duplicate MARCO products...`);
  for (const productId of duplicateProductIds) {
    await db.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), published: false },
    });
  }
  logger.alwaysInfo(`Removed ${duplicateProductIds.length} duplicate products.`);
}

function findMarcoDuplicateProductIds(
  products: Array<{
    id: string;
    translations: Array<{ title: string; locale: string }>;
    variants: Array<{ sku: string | null }>;
  }>,
  skuMap: SkuMapFile,
  assignedArticuls: Set<string>,
): string[] {
  const byTitle = new Map<string, typeof products>();
  for (const product of products) {
    const key = titleKey(pickProductTitle(product.translations));
    const group = byTitle.get(key) ?? [];
    group.push(product);
    byTitle.set(key, group);
  }

  const duplicateIds: string[] = [];
  for (const [key, group] of byTitle.entries()) {
    if (group.length < 2) {
      continue;
    }

    const articuls = skuMap.byName[key] ?? [];
    const canonical = group.find((product) => {
      const sku = product.variants[0]?.sku?.trim() ?? "";
      return articuls.includes(sku) && assignedArticuls.has(sku);
    });
    if (!canonical) {
      continue;
    }

    for (const product of group) {
      if (product.id === canonical.id) {
        continue;
      }
      const sku = product.variants[0]?.sku?.trim() ?? "";
      if (sku.startsWith("MARCO-")) {
        duplicateIds.push(product.id);
      }
    }
  }

  return duplicateIds;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
