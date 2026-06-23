/**
 * Backfill product-level attribute values from existing variant options.
 *
 * Usage (from repo root):
 *   pnpm run backfill:product-attribute-values
 *   pnpm run backfill:product-attribute-values:apply
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";

const BATCH_SIZE = 500;

type AttributeValueRow = {
  productId: string;
  attributeId: string;
  attributeValueId: string;
};

type VariantAttributeEntry = {
  valueId?: unknown;
};

function loadEnv(): void {
  loadEnvConfig(process.cwd());
}

function parseArgs(argv: readonly string[]): { execute: boolean } {
  return { execute: argv.includes("--execute") };
}

function uniqueRows(rows: AttributeValueRow[]): AttributeValueRow[] {
  const seen = new Set<string>();
  const result: AttributeValueRow[] = [];

  for (const row of rows) {
    const key = `${row.productId}:${row.attributeValueId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(row);
  }

  return result;
}

function uniqueProductAttributeRows(
  rows: AttributeValueRow[],
): Array<{ productId: string; attributeId: string }> {
  const seen = new Set<string>();
  const result: Array<{ productId: string; attributeId: string }> = [];

  for (const row of rows) {
    const key = `${row.productId}:${row.attributeId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({ productId: row.productId, attributeId: row.attributeId });
  }

  return result;
}

function collectLegacyAttributeValueIds(attributes: unknown): string[] {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return [];
  }

  const valueIds: string[] = [];
  for (const rawValue of Object.values(attributes as Record<string, unknown>)) {
    const entries = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const entry of entries) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const valueId = (entry as VariantAttributeEntry).valueId;
      if (typeof valueId === "string" && valueId.trim().length > 0) {
        valueIds.push(valueId);
      }
    }
  }

  return valueIds;
}

async function main(): Promise<void> {
  loadEnv();
  const { execute } = parseArgs(process.argv.slice(2));

  const products = await db.product.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      attributeValues: { select: { attributeValueId: true } },
      variants: {
        select: {
          attributes: true,
          options: {
            select: {
              valueId: true,
              attributeValue: { select: { id: true, attributeId: true } },
            },
          },
        },
      },
    },
  });

  const legacyValueIds = new Set<string>();
  for (const product of products) {
    for (const variant of product.variants) {
      for (const valueId of collectLegacyAttributeValueIds(variant.attributes)) {
        legacyValueIds.add(valueId);
      }
    }
  }

  const legacyValues =
    legacyValueIds.size > 0
      ? await db.attributeValue.findMany({
          where: { id: { in: [...legacyValueIds] } },
          select: { id: true, attributeId: true },
        })
      : [];
  const legacyValueToAttribute = new Map(
    legacyValues.map((value) => [value.id, value.attributeId]),
  );

  const existingPairs = new Set<string>();
  const candidateRows: AttributeValueRow[] = [];

  for (const product of products) {
    for (const existing of product.attributeValues) {
      existingPairs.add(`${product.id}:${existing.attributeValueId}`);
    }

    for (const variant of product.variants) {
      for (const option of variant.options) {
        if (!option.valueId || !option.attributeValue?.attributeId) {
          continue;
        }
        candidateRows.push({
          productId: product.id,
          attributeId: option.attributeValue.attributeId,
          attributeValueId: option.valueId,
        });
      }

      for (const valueId of collectLegacyAttributeValueIds(variant.attributes)) {
        const attributeId = legacyValueToAttribute.get(valueId);
        if (!attributeId) {
          continue;
        }
        candidateRows.push({
          productId: product.id,
          attributeId,
          attributeValueId: valueId,
        });
      }
    }
  }

  const rowsToCreate = uniqueRows(candidateRows).filter(
    (row) => !existingPairs.has(`${row.productId}:${row.attributeValueId}`),
  );
  const productAttributeRows = uniqueProductAttributeRows(rowsToCreate);
  const affectedProductIds = new Set(rowsToCreate.map((row) => row.productId));

  if (execute && rowsToCreate.length > 0) {
    for (let offset = 0; offset < productAttributeRows.length; offset += BATCH_SIZE) {
      await db.productAttribute.createMany({
        data: productAttributeRows.slice(offset, offset + BATCH_SIZE),
        skipDuplicates: true,
      });
    }

    for (let offset = 0; offset < rowsToCreate.length; offset += BATCH_SIZE) {
      await db.productAttributeValue.createMany({
        data: rowsToCreate.slice(offset, offset + BATCH_SIZE),
        skipDuplicates: true,
      });
    }
  }

  process.stdout.write(
    [
      `Product attribute value backfill ${execute ? "applied" : "dry-run"}`,
      `products scanned: ${products.length}`,
      `products affected: ${affectedProductIds.size}`,
      `attribute values to create: ${rowsToCreate.length}`,
    ].join("\n") + "\n",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
