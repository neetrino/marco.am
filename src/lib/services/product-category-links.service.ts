import { db } from "@white-shop/db";
import type { PrismaTransactionClient } from "@/lib/types/prisma";

const MAX_CATEGORY_DEPTH = 64;

export type NormalizedProductCategoryLinks = {
  primaryCategoryId: string | null;
  categoryIds: string[];
};

export type ProductCategoryLinksInput = {
  primaryCategoryId?: string | null;
  categoryIds?: string[];
};

type CategoryRow = {
  id: string;
  parentId: string | null;
};

export type CategoryGraph = Map<string, CategoryRow>;

type DbClient = PrismaTransactionClient | typeof db;

function throwInvalidCategory(categoryId: string): never {
  throw {
    status: 400,
    type: "https://api.shop.am/problems/validation-error",
    title: "Validation Error",
    detail: `Category '${categoryId}' does not exist or is deleted`,
  };
}

async function loadCategoryGraph(
  client: DbClient,
  seedIds: string[],
  preloaded?: CategoryGraph,
): Promise<CategoryGraph> {
  if (seedIds.length === 0) {
    return preloaded ?? new Map();
  }

  const byId =
    preloaded ??
    new Map<string, CategoryRow>(
      (
        await client.category.findMany({
          where: { deletedAt: null },
          select: { id: true, parentId: true },
        })
      ).map((row) => [row.id, row]),
    );

  for (const id of seedIds) {
    if (!byId.has(id)) {
      throwInvalidCategory(id);
    }
  }

  return byId;
}

function collectAncestorChain(
  categoryId: string,
  byId: Map<string, CategoryRow>,
): string[] {
  const chain: string[] = [];
  let current: string | null = categoryId;
  let guard = 0;

  while (current && guard < MAX_CATEGORY_DEPTH) {
    guard += 1;
    const row = byId.get(current);
    if (!row) {
      break;
    }
    chain.push(current);
    current = row.parentId;
  }

  return chain;
}

function isAncestorOf(
  ancestorId: string,
  descendantId: string,
  byId: Map<string, CategoryRow>,
): boolean {
  let current: string | null = descendantId;
  let guard = 0;

  while (current && guard < MAX_CATEGORY_DEPTH) {
    guard += 1;
    const row = byId.get(current);
    if (!row) {
      return false;
    }
    if (row.parentId === ancestorId) {
      return true;
    }
    current = row.parentId;
  }

  return false;
}

function pickDeepestExplicitCategory(
  explicitIds: string[],
  byId: Map<string, CategoryRow>,
): string {
  const leaves = explicitIds.filter(
    (id) => !explicitIds.some((other) => id !== other && isAncestorOf(id, other, byId)),
  );

  return leaves.length > 0 ? leaves[leaves.length - 1]! : explicitIds[explicitIds.length - 1]!;
}

function orderCategoryIds(
  expanded: Set<string>,
  primaryId: string,
  explicitIds: string[],
  byId: Map<string, CategoryRow>,
): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  const primaryChain = collectAncestorChain(primaryId, byId).reverse();
  for (const id of primaryChain) {
    if (expanded.has(id) && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }

  for (const explicitId of explicitIds) {
    const chain = collectAncestorChain(explicitId, byId).reverse();
    for (const id of chain) {
      if (expanded.has(id) && !seen.has(id)) {
        ordered.push(id);
        seen.add(id);
      }
    }
  }

  for (const id of expanded) {
    if (!seen.has(id)) {
      ordered.push(id);
    }
  }

  return ordered;
}

/**
 * Validates category selections, expands ancestor paths, and keeps primary in sync.
 */
export async function normalizeProductCategoryLinks(
  input: ProductCategoryLinksInput,
  tx?: PrismaTransactionClient,
  categoryGraph?: CategoryGraph,
): Promise<NormalizedProductCategoryLinks> {
  const client = tx ?? db;
  const explicitIds = [
    ...new Set(
      (input.categoryIds ?? []).filter((id): id is string => Boolean(id?.trim())),
    ),
  ];

  let primaryId = input.primaryCategoryId?.trim() || null;
  if (primaryId && !explicitIds.includes(primaryId)) {
    explicitIds.push(primaryId);
  }

  if (explicitIds.length === 0) {
    return { primaryCategoryId: null, categoryIds: [] };
  }

  const byId = await loadCategoryGraph(client, explicitIds, categoryGraph);

  if (primaryId && !byId.has(primaryId)) {
    throwInvalidCategory(primaryId);
  }

  if (!primaryId) {
    primaryId = pickDeepestExplicitCategory(explicitIds, byId);
  }

  const expanded = new Set<string>();
  for (const id of explicitIds) {
    for (const chainId of collectAncestorChain(id, byId)) {
      expanded.add(chainId);
    }
  }

  const categoryIds = orderCategoryIds(expanded, primaryId, explicitIds, byId);

  return {
    primaryCategoryId: primaryId,
    categoryIds,
  };
}

export function toProductCategoriesConnect(categoryIds: string[]) {
  return {
    connect: categoryIds.map((id) => ({ id })),
  };
}

export function toProductCategoriesSet(categoryIds: string[]) {
  return {
    set: categoryIds.map((id) => ({ id })),
  };
}
