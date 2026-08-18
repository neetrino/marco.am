#!/usr/bin/env node
/**
 * Reconcile product-level attribute values from a deterministic Marco manifest.
 *
 * Defaults to dry-run. Nothing is written unless --execute is explicitly set.
 */
"use strict";

const fs = require("fs");
const path = require("path");

require("@next/env").loadEnvConfig(process.cwd());

const { PrismaClient, Prisma } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client",
));
const {
  assertManifest,
  normalizeMatch,
  planReconciliation,
  summarizePlans,
  valueRef,
} = require("./marco-attribute-reconcile-lib.cjs");

const DEFAULT_BATCH_SIZE = 100;
const VALUE_LOCALES = ["hy", "en", "ru"];
const MAX_TRANSACTION_RETRIES = 3;

function parseArgs(argv) {
  const args = { execute: false, batchSize: DEFAULT_BATCH_SIZE, manifestPath: "", reportPath: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--execute") args.execute = true;
    else if (arg === "--dry-run") args.execute = false;
    else if (arg === "--manifest") args.manifestPath = argv[++index] ?? "";
    else if (arg.startsWith("--manifest=")) args.manifestPath = arg.slice("--manifest=".length);
    else if (arg === "--report") args.reportPath = argv[++index] ?? "";
    else if (arg.startsWith("--report=")) args.reportPath = arg.slice("--report=".length);
    else if (arg === "--batch-size") args.batchSize = Number.parseInt(argv[++index] ?? "", 10);
    else if (arg.startsWith("--batch-size=")) {
      args.batchSize = Number.parseInt(arg.slice("--batch-size=".length), 10);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.manifestPath) throw new Error("--manifest PATH is required");
  if (!Number.isInteger(args.batchSize) || args.batchSize < 1 || args.batchSize > 500) {
    throw new Error("--batch-size must be an integer between 1 and 500");
  }
  return args;
}

function chunk(items, size) {
  const chunks = [];
  for (let offset = 0; offset < items.length; offset += size) chunks.push(items.slice(offset, offset + size));
  return chunks;
}

function readManifest(manifestPath) {
  const absolutePath = path.resolve(manifestPath);
  if (!fs.existsSync(absolutePath)) throw new Error(`Manifest not found: ${absolutePath}`);
  const manifest = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  assertManifest(manifest);
  return { absolutePath, manifest };
}

async function loadAttributeCatalog(prisma) {
  return prisma.attribute.findMany({
    select: {
      id: true,
      key: true,
      translations: { select: { locale: true, name: true } },
      values: {
        select: {
          id: true,
          value: true,
          translations: { select: { locale: true, label: true } },
        },
      },
    },
    orderBy: { key: "asc" },
  });
}

async function loadProducts(prisma, skus, batchSize) {
  const products = [];
  for (const skuBatch of chunk(skus, batchSize)) {
    const variants = await prisma.productVariant.findMany({
      where: { sku: { in: skuBatch }, product: { deletedAt: null } },
      select: {
        sku: true,
        product: {
          select: {
            id: true,
            productAttributes: { select: { attributeId: true } },
            attributeValues: {
              select: { id: true, attributeId: true, attributeValueId: true },
            },
          },
        },
      },
    });
    for (const variant of variants) products.push({ sku: variant.sku, ...variant.product });
  }
  return products;
}

function publicPlan(plan) {
  return {
    sku: plan.sku,
    productId: plan.productId,
    sourceRow: plan.sourceRow,
    statuses: plan.statuses,
  };
}

function reportDocument(mode, manifestPath, manifest, plans, applyCounts = null) {
  return {
    mode,
    manifest: manifestPath,
    source: manifest.source,
    manifestStats: manifest.stats,
    counts: summarizePlans(plans),
    applyCounts,
    products: plans.map(publicPlan),
  };
}

async function withSerializableRetry(prisma, operation) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 120_000,
      });
    } catch (error) {
      if (error?.code !== "P2034" || attempt === MAX_TRANSACTION_RETRIES) throw error;
    }
  }
  throw new Error("Serializable transaction retry limit exhausted");
}

async function findOrCreateAttributeValue(tx, desired, runtimeValueIds, applyCounts) {
  if (desired.attributeValueId) return desired.attributeValueId;
  const ref = valueRef(desired.attributeId, desired.value);
  if (runtimeValueIds.has(ref)) return runtimeValueIds.get(ref);

  const candidates = await tx.attributeValue.findMany({
    where: {
      attributeId: desired.attributeId,
      OR: [
        { value: { equals: desired.value, mode: "insensitive" } },
        { translations: { some: { label: { equals: desired.value, mode: "insensitive" } } } },
      ],
    },
    select: {
      id: true,
      value: true,
      translations: { select: { label: true } },
    },
  });
  const normalizedCandidates = candidates.filter((candidate) =>
    [candidate.value, ...candidate.translations.map((translation) => translation.label)]
      .map(normalizeMatch)
      .includes(normalizeMatch(desired.value)),
  );
  if (normalizedCandidates.length > 1) {
    throw new Error(
      `Refusing ambiguous AttributeValue create for ${desired.attributeKey}=${desired.value}`,
    );
  }
  if (normalizedCandidates.length === 1) {
    runtimeValueIds.set(ref, normalizedCandidates[0].id);
    return normalizedCandidates[0].id;
  }

  const created = await tx.attributeValue.create({
    data: {
      attributeId: desired.attributeId,
      value: desired.value,
      translations: {
        create: VALUE_LOCALES.map((locale) => ({ locale, label: desired.value })),
      },
    },
    select: { id: true },
  });
  runtimeValueIds.set(ref, created.id);
  applyCounts.attributeValuesCreated += 1;
  return created.id;
}

async function applyPlanBatch(prisma, plans, runtimeValueIds, applyCounts) {
  const actionableStatuses = new Set(["value_create", "link_create", "stale_remove"]);
  const actionable = plans.filter(
    (plan) => plan.productId && plan.statuses.some((item) => actionableStatuses.has(item.status)),
  );
  if (actionable.length === 0) return;

  const committed = await withSerializableRetry(prisma, async (tx) => {
    const transactionValueIds = new Map(runtimeValueIds);
    const transactionCounts = {
      productsProcessed: 0,
      attributeValuesCreated: 0,
      productAttributesCreated: 0,
      productAttributeValuesCreated: 0,
      staleProductAttributeValuesRemoved: 0,
    };
    for (const plan of actionable) {
      const desiredRows = [];
      for (const desired of plan.desired) {
        const attributeValueId = await findOrCreateAttributeValue(
          tx,
          desired,
          transactionValueIds,
          transactionCounts,
        );
        desiredRows.push({
          productId: plan.productId,
          attributeId: desired.attributeId,
          attributeValueId,
        });
      }

      const desiredAttributeIds = [...new Set(desiredRows.map((row) => row.attributeId))];
      if (desiredAttributeIds.length > 0) {
        const result = await tx.productAttribute.createMany({
          data: desiredAttributeIds.map((attributeId) => ({ productId: plan.productId, attributeId })),
          skipDuplicates: true,
        });
        transactionCounts.productAttributesCreated += result.count;
      }

      if (plan.staleLinkIds.length > 0) {
        const result = await tx.productAttributeValue.deleteMany({
          where: { productId: plan.productId, id: { in: plan.staleLinkIds } },
        });
        transactionCounts.staleProductAttributeValuesRemoved += result.count;
      }

      if (desiredRows.length > 0) {
        const result = await tx.productAttributeValue.createMany({
          data: desiredRows,
          skipDuplicates: true,
        });
        transactionCounts.productAttributeValuesCreated += result.count;
      }
      transactionCounts.productsProcessed += 1;
    }
    return { transactionCounts, transactionValueIds };
  });
  for (const [ref, id] of committed.transactionValueIds) runtimeValueIds.set(ref, id);
  for (const key of Object.keys(applyCounts)) {
    applyCounts[key] += committed.transactionCounts[key];
  }
}

function printNextCommands() {
  process.stdout.write(
    [
      "",
      "Read models were NOT rebuilt automatically.",
      "After reviewing a successful --execute report, run:",
      "  pnpm run rebuild:plp-read-model",
      "  pnpm run rebuild:pdp-read-model",
      "",
    ].join("\n"),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { absolutePath, manifest } = readManifest(args.manifestPath);
  const prisma = new PrismaClient();
  try {
    const attributes = await loadAttributeCatalog(prisma);
    const products = await loadProducts(
      prisma,
      manifest.entries.map((entry) => entry.sku),
      args.batchSize,
    );
    const plans = planReconciliation(manifest, products, attributes);
    let applyCounts = null;

    if (args.execute) {
      applyCounts = {
        productsProcessed: 0,
        attributeValuesCreated: 0,
        productAttributesCreated: 0,
        productAttributeValuesCreated: 0,
        staleProductAttributeValuesRemoved: 0,
      };
      const runtimeValueIds = new Map();
      for (const planBatch of chunk(plans, args.batchSize)) {
        await applyPlanBatch(prisma, planBatch, runtimeValueIds, applyCounts);
      }
    }

    const report = reportDocument(
      args.execute ? "execute" : "dry-run",
      absolutePath,
      manifest,
      plans,
      applyCounts,
    );
    const serialized = `${JSON.stringify(report, null, 2)}\n`;
    process.stdout.write(serialized);
    if (args.reportPath) {
      const reportPath = path.resolve(args.reportPath);
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, serialized, "utf8");
      process.stdout.write(`Report written: ${reportPath}\n`);
    }
    if (!args.execute) {
      process.stdout.write("Dry-run only. Re-run with --execute after reviewing every status.\n");
    }
    printNextCommands();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[marco-attribute-reconcile] fatal", error);
    process.exitCode = 1;
  });
}

module.exports = {
  parseArgs,
  publicPlan,
  reportDocument,
};
