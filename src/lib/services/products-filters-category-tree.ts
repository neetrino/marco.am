import { db } from "@white-shop/db";
import { PRODUCT_FILTERS_CATEGORY_DESCENDANT_ENRICHMENT_MAX_ROWS } from "@/lib/constants/product-filters-query-limits";
import { isShopFilterCategoryExcludedFromTranslations } from "@/lib/constants/shop-filter-excluded-categories";
import { resolveCategoryTranslation } from "@/lib/i18n/category-translation";
import {
  buildShopCategoryFilterTree,
  resolveVisibleCategoryParentId,
  type CategoryFilterTreeNode,
} from "@/lib/shop-category-filter-tree";

type FilterCategoryRow = {
  id: string;
  parentId: string | null;
  position: number;
  slug: string;
  title: string;
  count: number;
};

export async function buildShopFilterCategoriesFromCountMap(
  categoryCountMap: Map<string, number> | null,
  lang: string,
): Promise<CategoryFilterTreeNode[]> {
  const categoryIdsWithProducts = categoryCountMap ? Array.from(categoryCountMap.keys()) : [];
  if (categoryIdsWithProducts.length === 0) {
    return [];
  }

  const categoryCounts = categoryCountMap ?? new Map<string, number>();
  const categoryRows = await db.category.findMany({
    where: {
      id: { in: categoryIdsWithProducts },
      published: true,
      deletedAt: null,
    },
    include: { translations: true },
    orderBy: { position: "asc" },
  });

  const facetRows = categoryRows
    .filter(
      (cat) =>
        !isShopFilterCategoryExcludedFromTranslations(
          cat.translations.map((t) => ({ slug: t.slug, title: t.title })),
        ),
    )
    .map((cat) => {
      const tr = resolveCategoryTranslation(cat.translations, lang);
      if (!tr) {
        return null;
      }
      const count = categoryCounts.get(cat.id) || 0;
      if (count === 0) {
        return null;
      }
      return {
        id: cat.id,
        parentId: cat.parentId,
        position: cat.position,
        slug: tr.slug,
        title: tr.title,
        count,
      };
    })
    .filter((row): row is FilterCategoryRow => row !== null);

  const rowsById = new Map<string, FilterCategoryRow>();
  const skippedParentById = new Map<string, string | null>();
  for (const row of facetRows) {
    rowsById.set(row.id, row);
  }

  let frontier = new Set(
    facetRows.map((row) => row.parentId).filter((pid): pid is string => Boolean(pid)),
  );
  let ancestorWalkGuard = 0;

  while (frontier.size > 0 && ancestorWalkGuard < 40) {
    ancestorWalkGuard += 1;
    const toFetch = [...frontier].filter((id) => !rowsById.has(id));
    frontier = new Set();
    if (toFetch.length === 0) {
      break;
    }
    const parentRows = await db.category.findMany({
      where: {
        id: { in: toFetch },
        published: true,
        deletedAt: null,
      },
      include: { translations: true },
      orderBy: { position: "asc" },
    });
    for (const cat of parentRows) {
      if (
        isShopFilterCategoryExcludedFromTranslations(
          cat.translations.map((t) => ({ slug: t.slug, title: t.title })),
        )
      ) {
        skippedParentById.set(cat.id, cat.parentId ?? null);
        if (cat.parentId) {
          frontier.add(cat.parentId);
        }
        continue;
      }
      const tr = resolveCategoryTranslation(cat.translations, lang);
      if (!tr) {
        skippedParentById.set(cat.id, cat.parentId ?? null);
        if (cat.parentId) {
          frontier.add(cat.parentId);
        }
        continue;
      }
      const count = categoryCounts.get(cat.id) || 0;
      rowsById.set(cat.id, {
        id: cat.id,
        parentId: cat.parentId,
        position: cat.position,
        slug: tr.slug,
        title: tr.title,
        count,
      });
      if (cat.parentId && !rowsById.has(cat.parentId)) {
        frontier.add(cat.parentId);
      }
    }
  }

  const enrichedOnlyIds = new Set<string>();
  if (rowsById.size <= PRODUCT_FILTERS_CATEGORY_DESCENDANT_ENRICHMENT_MAX_ROWS) {
    let prevRowCount = -1;
    let descendantWalkGuard = 0;
    while (rowsById.size !== prevRowCount && descendantWalkGuard < 25) {
      descendantWalkGuard += 1;
      prevRowCount = rowsById.size;
      const parentIds = [...rowsById.keys()];
      if (parentIds.length === 0) {
        break;
      }
      const publishedChildren = await db.category.findMany({
        where: {
          parentId: { in: parentIds },
          published: true,
          deletedAt: null,
        },
        include: { translations: true },
        orderBy: { position: "asc" },
      });
      for (const cat of publishedChildren) {
        if (
          isShopFilterCategoryExcludedFromTranslations(
            cat.translations.map((t) => ({ slug: t.slug, title: t.title })),
          )
        ) {
          continue;
        }
        const tr = resolveCategoryTranslation(cat.translations, lang);
        if (!tr) {
          continue;
        }
        if (rowsById.has(cat.id)) {
          continue;
        }
        const count = categoryCounts.get(cat.id) || 0;
        rowsById.set(cat.id, {
          id: cat.id,
          parentId: cat.parentId,
          position: cat.position,
          slug: tr.slug,
          title: tr.title,
          count,
        });
        enrichedOnlyIds.add(cat.id);
      }
    }
  }

  const visibleIds = new Set(rowsById.keys());
  const allRows = Array.from(rowsById.values());
  const treeRows = allRows.map((row) => ({
    id: row.id,
    parentId: resolveVisibleCategoryParentId(row.parentId, visibleIds, skippedParentById),
    position: row.position,
    slug: row.slug,
    title: row.title,
  }));
  const counts = new Map(allRows.map((row) => [row.id, row.count] as const));
  return buildShopCategoryFilterTree(treeRows, counts, enrichedOnlyIds);
}
