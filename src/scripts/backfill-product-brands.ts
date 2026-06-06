/**
 * Backfill missing product brandId values using Marco.xlsx export.
 *
 * Prepare map (once, when xlsx changes):
 *   python src/scripts/export-marco-xlsx-brands.py
 *
 * Usage:
 *   pnpm exec tsx src/scripts/backfill-product-brands.ts --dry-run
 *   pnpm exec tsx src/scripts/backfill-product-brands.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import { findOrCreateBrandId } from "@/scripts/marco-csv-import/lib";

const MAP_PATH = join(process.cwd(), "src/scripts/marco-xlsx-brand-map.json");
const BATCH_SIZE = 50;

type BrandMapFile = {
  bySku: Record<string, string>;
  byName: Record<string, string>;
};

function loadEnv(): void {
  loadEnvConfig(process.cwd());
}

function loadBrandMap(): BrandMapFile {
  const raw = readFileSync(MAP_PATH, "utf8");
  return JSON.parse(raw) as BrandMapFile;
}

function normalizeSku(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.trim();
}

function buildBrandLookup(
  translations: Array<{ brandId: string; name: string }>,
): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const row of translations) {
    const key = row.name.trim().toLowerCase();
    if (key.length > 0 && !lookup.has(key)) {
      lookup.set(key, row.brandId);
    }
  }

  return lookup;
}

function inferBrandFromTitle(
  title: string,
  knownBrandNames: string[],
): string | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return null;
  }

  const titleLower = trimmed.toLowerCase();
  const sorted = [...knownBrandNames].sort((a, b) => b.length - a.length);

  for (const brandName of sorted) {
    const brandLower = brandName.toLowerCase();
    if (
      titleLower === brandLower ||
      titleLower.startsWith(`${brandLower} `) ||
      titleLower.startsWith(`${brandLower}-`)
    ) {
      return brandName;
    }
  }

  return null;
}

async function main(): Promise<void> {
  loadEnv();
  const dryRun = process.argv.includes("--dry-run");
  const brandMap = loadBrandMap();

  const [products, brandTranslations] = await Promise.all([
    db.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        brandId: true,
        translations: { select: { locale: true, title: true } },
        variants: { select: { sku: true }, take: 1, orderBy: { createdAt: "asc" } },
      },
    }),
    db.brandTranslation.findMany({
      where: { brand: { deletedAt: null } },
      select: { brandId: true, name: true },
    }),
  ]);

  const brandLookup = buildBrandLookup(brandTranslations);
  const knownBrandNames = [...new Set(brandTranslations.map((row) => row.name.trim()))];
  const brandIdCache = new Map<string, string>();

  async function resolveBrandId(brandName: string): Promise<string | null> {
    const trimmed = brandName.trim();
    if (!trimmed) {
      return null;
    }

    const cached = brandIdCache.get(trimmed);
    if (cached) {
      return cached;
    }

    const existing = brandLookup.get(trimmed.toLowerCase());
    if (existing) {
      brandIdCache.set(trimmed, existing);
      return existing;
    }

    if (dryRun) {
      brandIdCache.set(trimmed, `dry-run:${trimmed}`);
      return brandIdCache.get(trimmed)!;
    }

    const created = await findOrCreateBrandId(trimmed);
    if (created) {
      brandIdCache.set(trimmed, created);
      brandLookup.set(trimmed.toLowerCase(), created);
    }
    return created;
  }

  const pendingUpdates: Array<{ id: string; brandId: string; source: string }> = [];
  let alreadyHasBrand = 0;
  let unresolved = 0;

  for (const product of products) {
    if (product.brandId) {
      alreadyHasBrand += 1;
      continue;
    }

    const sku = normalizeSku(product.variants[0]?.sku);
    const hyTitle =
      product.translations.find((tr) => tr.locale === "hy")?.title ??
      product.translations[0]?.title ??
      "";

    let brandName =
      (sku ? brandMap.bySku[sku] : undefined) ??
      brandMap.byName[hyTitle.toLowerCase()] ??
      inferBrandFromTitle(hyTitle, knownBrandNames) ??
      null;

    if (!brandName && hyTitle) {
      const firstToken = hyTitle.split(/\s+/)[0]?.trim();
      if (firstToken && firstToken.length >= 2) {
        brandName = firstToken;
      }
    }

    if (!brandName) {
      unresolved += 1;
      continue;
    }

    const brandId = await resolveBrandId(brandName);
    if (!brandId) {
      unresolved += 1;
      continue;
    }

    const source =
      sku && brandMap.bySku[sku]
        ? "xlsx-sku"
        : brandMap.byName[hyTitle.toLowerCase()]
          ? "xlsx-name"
          : inferBrandFromTitle(hyTitle, knownBrandNames)
            ? "title-known-brand"
            : "title-first-token";

    pendingUpdates.push({ id: product.id, brandId, source });
  }

  if (!dryRun && pendingUpdates.length > 0) {
    for (let offset = 0; offset < pendingUpdates.length; offset += BATCH_SIZE) {
      const batch = pendingUpdates.slice(offset, offset + BATCH_SIZE);
      await db.$transaction(
        batch.map((update) =>
          db.product.update({
            where: { id: update.id },
            data: { brandId: update.brandId },
          }),
        ),
      );
    }
  }

  const bySource = pendingUpdates.reduce<Record<string, number>>((acc, row) => {
    acc[row.source] = (acc[row.source] ?? 0) + 1;
    return acc;
  }, {});

  process.stdout.write(
    [
      `Products total: ${products.length}`,
      `Already had brand: ${alreadyHasBrand}`,
      `To update: ${pendingUpdates.length}${dryRun ? " (dry-run)" : ""}`,
      `Unresolved: ${unresolved}`,
      `Sources: ${JSON.stringify(bySource)}`,
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
