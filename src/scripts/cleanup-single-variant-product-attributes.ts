/**
 * Moves single-variant product attribute data to product-level links and clears
 * variant-level attribute leftovers.
 *
 * The sellable ProductVariant row is intentionally kept because the current
 * product model stores price, SKU, stock, discount, image, and related commerce
 * data on ProductVariant even for simple products.
 *
 * Usage:
 *   pnpm run cleanup:single-variant-attributes
 *   pnpm run cleanup:single-variant-attributes:apply
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import { Prisma } from "@white-shop/db/prisma";

const BATCH_SIZE = 500;
const UNMAPPED_SAMPLE_LIMIT = 20;

type AttributeValueRow = {
  productId: string;
  attributeId: string;
  attributeValueId: string;
};

type AttributeValueResolution = {
  attributeId: string;
  attributeValueId: string;
};

type UnmappedEntry = {
  productId: string;
  variantId: string;
  source: "option" | "json";
  attributeId?: string | null;
  attributeKey?: string | null;
  valueId?: string | null;
  value?: string | null;
};

type LegacyAttributeEntry = {
  attributeKey: string | null;
  valueId: string | null;
  value: string | null;
};

function parseArgs(argv: readonly string[]): { execute: boolean } {
  return { execute: argv.includes("--execute") };
}

function normalizeValue(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function keyedValue(attributeIdOrKey: string, value: string | null | undefined): string {
  return `${attributeIdOrKey}:${normalizeValue(value)}`;
}

function pushUnique<T>(target: T[], seen: Set<string>, key: string, value: T): void {
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  target.push(value);
}

function collectLegacyAttributeEntries(attributes: unknown): LegacyAttributeEntry[] {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return [];
  }

  const entries: LegacyAttributeEntry[] = [];

  for (const [rawAttributeKey, rawValue] of Object.entries(attributes as Record<string, unknown>)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    for (const valueEntry of values) {
      if (valueEntry && typeof valueEntry === "object" && !Array.isArray(valueEntry)) {
        const entry = valueEntry as {
          attributeKey?: unknown;
          valueId?: unknown;
          value?: unknown;
        };
        entries.push({
          attributeKey:
            typeof entry.attributeKey === "string" && entry.attributeKey.trim().length > 0
              ? entry.attributeKey
              : rawAttributeKey,
          valueId:
            typeof entry.valueId === "string" && entry.valueId.trim().length > 0
              ? entry.valueId
              : null,
          value:
            typeof entry.value === "string" && entry.value.trim().length > 0
              ? entry.value
              : null,
        });
        continue;
      }

      if (typeof valueEntry === "string" && valueEntry.trim().length > 0) {
        entries.push({
          attributeKey: rawAttributeKey,
          valueId: null,
          value: valueEntry,
        });
      }
    }
  }

  return entries;
}

function hasJsonAttributePayload(attributes: unknown): boolean {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return false;
  }
  return Object.keys(attributes as Record<string, unknown>).length > 0;
}

async function buildAttributeValueResolvers(): Promise<{
  byValueId: Map<string, AttributeValueResolution>;
  byAttributeIdAndValue: Map<string, AttributeValueResolution>;
  byAttributeKeyAndValue: Map<string, AttributeValueResolution>;
}> {
  const attributes = await db.attribute.findMany({
    select: {
      id: true,
      key: true,
      values: {
        select: {
          id: true,
          value: true,
          translations: { select: { label: true } },
        },
      },
    },
  });

  const byValueId = new Map<string, AttributeValueResolution>();
  const byAttributeIdAndValue = new Map<string, AttributeValueResolution>();
  const byAttributeKeyAndValue = new Map<string, AttributeValueResolution>();

  for (const attribute of attributes) {
    for (const value of attribute.values) {
      const resolution = {
        attributeId: attribute.id,
        attributeValueId: value.id,
      };
      byValueId.set(value.id, resolution);
      byAttributeIdAndValue.set(keyedValue(attribute.id, value.value), resolution);
      byAttributeKeyAndValue.set(keyedValue(attribute.key, value.value), resolution);

      for (const translation of value.translations) {
        byAttributeIdAndValue.set(keyedValue(attribute.id, translation.label), resolution);
        byAttributeKeyAndValue.set(keyedValue(attribute.key, translation.label), resolution);
      }
    }
  }

  return { byValueId, byAttributeIdAndValue, byAttributeKeyAndValue };
}

function uniqueProductAttributeRows(
  rows: readonly AttributeValueRow[],
): Array<{ productId: string; attributeId: string }> {
  const seen = new Set<string>();
  const result: Array<{ productId: string; attributeId: string }> = [];

  for (const row of rows) {
    pushUnique(result, seen, `${row.productId}:${row.attributeId}`, {
      productId: row.productId,
      attributeId: row.attributeId,
    });
  }

  return result;
}

async function createInBatches<T>(
  rows: readonly T[],
  createMany: (batch: T[]) => Promise<unknown>,
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    await createMany(rows.slice(offset, offset + BATCH_SIZE));
  }
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const { execute } = parseArgs(process.argv.slice(2));

  const resolvers = await buildAttributeValueResolvers();
  const products = await db.product.findMany({
    select: {
      id: true,
      attributeValues: { select: { attributeValueId: true } },
      variants: {
        select: {
          id: true,
          attributes: true,
          options: {
            select: {
              id: true,
              attributeId: true,
              attributeKey: true,
              valueId: true,
              value: true,
            },
          },
        },
      },
    },
  });

  const singleVariantProducts = products.filter((product) => product.variants.length === 1);
  const zeroVariantProducts = products.filter((product) => product.variants.length === 0).length;
  const multiVariantProducts = products.filter((product) => product.variants.length > 1).length;
  const existingProductValuePairs = new Set<string>();
  const candidateRows: AttributeValueRow[] = [];
  const candidateRowKeys = new Set<string>();
  const unmappedEntries: UnmappedEntry[] = [];
  const cleanableVariantIds: string[] = [];
  const variantIdsWithOptionsToDelete: string[] = [];
  const variantIdsWithJsonToClear: string[] = [];
  let variantOptionsSeen = 0;
  let jsonAttributePayloadsSeen = 0;

  for (const product of singleVariantProducts) {
    for (const existing of product.attributeValues) {
      existingProductValuePairs.add(`${product.id}:${existing.attributeValueId}`);
    }

    const variant = product.variants[0];
    if (!variant) {
      continue;
    }

    const unmappedBefore = unmappedEntries.length;
    variantOptionsSeen += variant.options.length;

    for (const option of variant.options) {
      const resolution =
        (option.valueId ? resolvers.byValueId.get(option.valueId) : undefined) ??
        (option.attributeId && option.value
          ? resolvers.byAttributeIdAndValue.get(keyedValue(option.attributeId, option.value))
          : undefined) ??
        (option.attributeKey && option.value
          ? resolvers.byAttributeKeyAndValue.get(keyedValue(option.attributeKey, option.value))
          : undefined);

      if (!resolution) {
        unmappedEntries.push({
          productId: product.id,
          variantId: variant.id,
          source: "option",
          attributeId: option.attributeId,
          attributeKey: option.attributeKey,
          valueId: option.valueId,
          value: option.value,
        });
        continue;
      }

      pushUnique(candidateRows, candidateRowKeys, `${product.id}:${resolution.attributeValueId}`, {
        productId: product.id,
        attributeId: resolution.attributeId,
        attributeValueId: resolution.attributeValueId,
      });
    }

    const jsonEntries = collectLegacyAttributeEntries(variant.attributes);
    if (hasJsonAttributePayload(variant.attributes)) {
      jsonAttributePayloadsSeen += 1;
    }

    for (const entry of jsonEntries) {
      const resolution =
        (entry.valueId ? resolvers.byValueId.get(entry.valueId) : undefined) ??
        (entry.attributeKey && entry.value
          ? resolvers.byAttributeKeyAndValue.get(keyedValue(entry.attributeKey, entry.value))
          : undefined);

      if (!resolution) {
        unmappedEntries.push({
          productId: product.id,
          variantId: variant.id,
          source: "json",
          attributeKey: entry.attributeKey,
          valueId: entry.valueId,
          value: entry.value,
        });
        continue;
      }

      pushUnique(candidateRows, candidateRowKeys, `${product.id}:${resolution.attributeValueId}`, {
        productId: product.id,
        attributeId: resolution.attributeId,
        attributeValueId: resolution.attributeValueId,
      });
    }

    if (unmappedEntries.length === unmappedBefore) {
      cleanableVariantIds.push(variant.id);
      if (variant.options.length > 0) {
        variantIdsWithOptionsToDelete.push(variant.id);
      }
      if (hasJsonAttributePayload(variant.attributes)) {
        variantIdsWithJsonToClear.push(variant.id);
      }
    }
  }

  const rowsToCreate = candidateRows.filter(
    (row) => !existingProductValuePairs.has(`${row.productId}:${row.attributeValueId}`),
  );
  const productAttributeRowsToCreate = uniqueProductAttributeRows(rowsToCreate);

  process.stdout.write(
    [
      `Single-variant attribute cleanup ${execute ? "apply" : "dry-run"}`,
      `products scanned: ${products.length}`,
      `single-variant products scanned: ${singleVariantProducts.length}`,
      `zero-variant products skipped: ${zeroVariantProducts}`,
      `multi-variant products skipped: ${multiVariantProducts}`,
      `variant options seen on single-variant products: ${variantOptionsSeen}`,
      `variant JSON attribute payloads seen: ${jsonAttributePayloadsSeen}`,
      `product attribute values already/currently covered: ${
        candidateRows.length - rowsToCreate.length
      }`,
      `product attribute values to create: ${rowsToCreate.length}`,
      `product attributes to create: ${productAttributeRowsToCreate.length}`,
      `variant option rows to delete: ${variantOptionsSeen}`,
      `variant JSON attribute payloads to clear: ${variantIdsWithJsonToClear.length}`,
      `cleanable variants: ${cleanableVariantIds.length}`,
      `unmapped entries: ${unmappedEntries.length}`,
    ].join("\n") + "\n",
  );

  if (unmappedEntries.length > 0) {
    process.stdout.write(
      `unmapped sample: ${JSON.stringify(unmappedEntries.slice(0, UNMAPPED_SAMPLE_LIMIT), null, 2)}\n`,
    );
    if (execute) {
      throw new Error("Refusing to apply cleanup while unmapped variant attributes exist.");
    }
  }

  if (!execute) {
    return;
  }

  await db.$transaction(async (tx) => {
    await createInBatches(productAttributeRowsToCreate, (batch) =>
      tx.productAttribute.createMany({ data: batch, skipDuplicates: true }),
    );
    await createInBatches(rowsToCreate, (batch) =>
      tx.productAttributeValue.createMany({ data: batch, skipDuplicates: true }),
    );

    for (let offset = 0; offset < variantIdsWithOptionsToDelete.length; offset += BATCH_SIZE) {
      const batch = variantIdsWithOptionsToDelete.slice(offset, offset + BATCH_SIZE);
      await tx.productVariantOption.deleteMany({
        where: { variantId: { in: batch } },
      });
    }

    for (let offset = 0; offset < variantIdsWithJsonToClear.length; offset += BATCH_SIZE) {
      const batch = variantIdsWithJsonToClear.slice(offset, offset + BATCH_SIZE);
      await tx.productVariant.updateMany({
        where: { id: { in: batch } },
        data: { attributes: Prisma.DbNull },
      });
    }
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
