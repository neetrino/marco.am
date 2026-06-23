/**
 * Backfill products.warrantyYears from Marco Excel manifest.
 *
 * Build manifest:
 *   python scripts/build-marco-warranty-manifest.py
 *
 * Dry-run:
 *   node scripts/backfill-product-warranty.cjs --dry-run
 *
 * Apply:
 *   node scripts/backfill-product-warranty.cjs --execute
 */
const fs = require("fs");
const path = require("path");

require("@next/env").loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client",
));

const MANIFEST_PATH = path.join(__dirname, "..", "docs", "reports", "marco-warranty-manifest.json");

const prisma = new PrismaClient();

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Manifest not found: ${MANIFEST_PATH}\nRun: python scripts/build-marco-warranty-manifest.py`,
    );
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function normalizeWarrantyYears(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = typeof value === "string" ? Number.parseInt(value, 10) : value;
  if (numeric === 1 || numeric === 2 || numeric === 3) {
    return numeric;
  }
  return null;
}

async function loadMatchIndex() {
  const variants = await prisma.productVariant.findMany({
    select: {
      barcode: true,
      sku: true,
      productId: true,
    },
  });

  const byBarcode = new Map();
  const bySku = new Map();
  for (const variant of variants) {
    if (variant.barcode) {
      byBarcode.set(String(variant.barcode), variant.productId);
    }
    if (variant.sku) {
      bySku.set(String(variant.sku), variant.productId);
    }
  }

  const slugRows = await prisma.productTranslation.findMany({
    where: { slug: { startsWith: "marco-" } },
    select: { productId: true, slug: true },
  });

  const byImportSlug = new Map();
  for (const row of slugRows) {
    const match = row.slug.match(/^marco-(\d+)-/);
    if (!match) continue;
    byImportSlug.set(match[1], row.productId);
  }

  return { byBarcode, bySku, byImportSlug };
}

function resolveProductId(entry, index) {
  const byBarcode = index.byBarcode.get(entry.legacyId);
  if (byBarcode) {
    return { productId: byBarcode, matchType: "barcode" };
  }

  if (entry.sku) {
    const bySku = index.bySku.get(entry.sku);
    if (bySku) {
      return { productId: bySku, matchType: "sku" };
    }
  }

  const bySlug = index.byImportSlug.get(entry.legacyId);
  if (bySlug) {
    return { productId: bySlug, matchType: "slug" };
  }

  return { productId: null, matchType: "missing" };
}

async function planUpdates(manifest) {
  const index = await loadMatchIndex();
  const targetByProductId = new Map();
  const matchStats = { barcode: 0, sku: 0, slug: 0, missing: 0 };
  const missingEntries = [];
  const duplicateConflicts = [];

  for (const entry of manifest.entries) {
    const warrantyYears = normalizeWarrantyYears(entry.warrantyYears);
    const resolved = resolveProductId(entry, index);
    if (!resolved.productId) {
      matchStats.missing += 1;
      if (warrantyYears !== null && missingEntries.length < 20) {
        missingEntries.push({ ...entry, warrantyYears });
      }
      continue;
    }

    matchStats[resolved.matchType] += 1;

    const existing = targetByProductId.get(resolved.productId);
    if (existing && existing.warrantyYears !== warrantyYears) {
      duplicateConflicts.push({
        productId: resolved.productId,
        previousLegacyId: existing.legacyId,
        nextLegacyId: entry.legacyId,
        previousWarrantyYears: existing.warrantyYears,
        nextWarrantyYears: warrantyYears,
      });
    }

    targetByProductId.set(resolved.productId, {
      legacyId: entry.legacyId,
      warrantyYears,
      matchType: resolved.matchType,
      name: entry.name,
    });
  }

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, warrantyYears: true },
  });

  const updates = [];
  let setWarranty = 0;
  let clearWarranty = 0;
  let unchanged = 0;

  for (const product of products) {
    const target = targetByProductId.get(product.id);
    const nextWarrantyYears = target ? target.warrantyYears : null;
    const current = normalizeWarrantyYears(product.warrantyYears);

    if (current === nextWarrantyYears) {
      unchanged += 1;
      continue;
    }

    updates.push({
      productId: product.id,
      currentWarrantyYears: current,
      nextWarrantyYears,
      legacyId: target?.legacyId ?? null,
      matchType: target?.matchType ?? "not_in_excel",
      name: target?.name ?? null,
    });

    if (nextWarrantyYears === null) {
      clearWarranty += 1;
    } else {
      setWarranty += 1;
    }
  }

  return {
    matchStats,
    missingEntries,
    duplicateConflicts,
    updates,
    stats: {
      excelRows: manifest.entries.length,
      matchedProducts: targetByProductId.size,
      activeProducts: products.length,
      updates: updates.length,
      setWarranty,
      clearWarranty,
      unchanged,
      missingInDb: matchStats.missing,
    },
  };
}

async function applyUpdates(updates) {
  let applied = 0;
  for (const row of updates) {
    await prisma.product.update({
      where: { id: row.productId },
      data: { warrantyYears: row.nextWarrantyYears },
    });
    applied += 1;
  }
  return applied;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--execute");
  const manifest = readManifest();
  const plan = await planUpdates(manifest);

  const report = {
    mode: dryRun ? "dry-run" : "execute",
    manifestStats: manifest.stats,
    ...plan.stats,
    matchStats: plan.matchStats,
    duplicateConflicts: plan.duplicateConflicts.slice(0, 10),
    missingWithWarranty: plan.missingEntries,
  };

  console.log(JSON.stringify(report, null, 2));

  if (plan.updates.length > 0) {
    console.log("\nSample updates:");
    for (const row of plan.updates.slice(0, 12)) {
      console.log(
        `  ${row.productId} | ${row.legacyId ?? "n/a"} | ${row.currentWarrantyYears ?? "null"} -> ${row.nextWarrantyYears ?? "null"} | ${row.matchType}`,
      );
    }
  }

  if (dryRun) {
    console.log("\nRun with --execute to apply.");
    return;
  }

  const applied = await applyUpdates(plan.updates);
  console.log(JSON.stringify({ applied }, null, 2));
}

main()
  .catch((error) => {
    console.error("[backfill-product-warranty] fatal", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
