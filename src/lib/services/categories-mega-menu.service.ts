import { db } from '@white-shop/db';

import { filterHeaderNavCategoryTree } from '@/lib/constants/excluded-shop-category-slugs';
import { resolveCategoryTranslation } from '@/lib/i18n/category-translation';
import { getCachedJson } from '@/lib/services/read-through-json-cache';

const MEGA_MENU_CACHE_TTL_SEC = 300;

type CategoryRecord = {
  id: string;
  parentId: string | null;
  showInHeader: boolean;
  media: unknown[];
  translations: Array<{ locale: string; slug: string; title: string; fullPath: string }>;
};

export type MegaMenuCategoryNode = {
  id: string;
  slug: string;
  title: string;
  showInHeader: boolean;
  fullPath: string;
  media: string[];
  productCount: number;
  children: MegaMenuCategoryNode[];
};

type CategoryGraph = {
  categoryMap: Map<string, MegaMenuCategoryNode>;
  rootCategories: MegaMenuCategoryNode[];
  childrenByParent: Map<string, string[]>;
  directCounts: Map<string, number>;
};

async function fetchPublishedCategoryRecords(): Promise<CategoryRecord[]> {
  return db.category.findMany({
    where: {
      published: true,
      deletedAt: null,
    },
    include: {
      translations: true,
    },
    orderBy: {
      position: 'asc',
    },
  });
}

function buildCategoryGraph(categories: CategoryRecord[], lang: string): CategoryGraph {
  const categoryMap = new Map<string, MegaMenuCategoryNode>();
  const rootCategories: MegaMenuCategoryNode[] = [];

  for (const category of categories) {
    const translation = resolveCategoryTranslation(category.translations, lang);
    if (!translation) {
      continue;
    }

    const categoryData: MegaMenuCategoryNode = {
      id: category.id,
      slug: translation.slug,
      title: translation.title,
      showInHeader: category.showInHeader,
      fullPath: translation.fullPath,
      media: Array.isArray(category.media)
        ? category.media.filter((item): item is string => typeof item === 'string')
        : [],
      productCount: 0,
      children: [],
    };

    categoryMap.set(category.id, categoryData);
    if (!category.parentId) {
      rootCategories.push(categoryData);
    }
  }

  for (const category of categories) {
    if (!category.parentId) {
      continue;
    }
    const parent = categoryMap.get(category.parentId);
    const child = categoryMap.get(category.id);
    if (parent && child) {
      parent.children.push(child);
    }
  }

  const childrenByParent = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) {
      continue;
    }
    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category.id);
    childrenByParent.set(category.parentId, siblings);
  }

  return { categoryMap, rootCategories, childrenByParent, directCounts: new Map() };
}

async function attachProductCounts(graph: CategoryGraph): Promise<void> {
  const allIds = Array.from(graph.categoryMap.keys());
  if (allIds.length === 0) {
    return;
  }

  const relationCounts = await db.$queryRaw<Array<{ categoryId: string; count: bigint }>>`
    SELECT category_id as "categoryId", COUNT(DISTINCT product_id)::bigint as "count"
    FROM (
      SELECT p."id" as product_id, p."primaryCategoryId" as category_id
      FROM "products" p
      WHERE p."published" = true
        AND p."deletedAt" IS NULL
        AND p."primaryCategoryId" IS NOT NULL
        AND p."primaryCategoryId" = ANY(${allIds}::text[])
      UNION ALL
      SELECT p."id" as product_id, pc."A" as category_id
      FROM "_ProductCategories" pc
      INNER JOIN "products" p ON p."id" = pc."B"
      WHERE p."published" = true
        AND p."deletedAt" IS NULL
        AND pc."A" = ANY(${allIds}::text[])
    ) category_product
    GROUP BY category_id
  `;

  const directCounts = new Map<string, number>(allIds.map((id) => [id, 0]));
  for (const row of relationCounts) {
    directCounts.set(row.categoryId, Number(row.count));
  }
  graph.directCounts = directCounts;

  const subtreeByCategoryId = new Map<string, Set<string>>();
  const collectSubtreeIds = (categoryId: string): Set<string> => {
    const cached = subtreeByCategoryId.get(categoryId);
    if (cached) {
      return cached;
    }

    const subtree = new Set<string>([categoryId]);
    const stack = [categoryId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const childId of graph.childrenByParent.get(current) ?? []) {
        if (!subtree.has(childId)) {
          subtree.add(childId);
          stack.push(childId);
        }
      }
    }

    subtreeByCategoryId.set(categoryId, subtree);
    return subtree;
  };

  for (const id of allIds) {
    const subtree = collectSubtreeIds(id);
    let count = 0;
    subtree.forEach((subtreeId) => {
      count += directCounts.get(subtreeId) ?? 0;
    });
    const node = graph.categoryMap.get(id);
    if (node) {
      node.productCount = count;
    }
  }
}

function cloneNodeShallow(node: MegaMenuCategoryNode): MegaMenuCategoryNode {
  return {
    ...node,
    media: [...node.media],
    children: [],
  };
}

function cloneBranch(node: MegaMenuCategoryNode): MegaMenuCategoryNode {
  return {
    ...node,
    media: [...node.media],
    children: node.children.map((child) => cloneBranch(child)),
  };
}

async function getFullHeaderNavTree(lang: string): Promise<MegaMenuCategoryNode[]> {
  const cacheKey = `categories:mega-menu:full-tree:v2:${lang}`;
  return getCachedJson(cacheKey, MEGA_MENU_CACHE_TTL_SEC, async () => {
    const records = await fetchPublishedCategoryRecords();
    const graph = buildCategoryGraph(records, lang);
    await attachProductCounts(graph);
    const headerRoots = filterHeaderNavCategoryTree(graph.rootCategories);
    return headerRoots.map((root) => cloneBranch(root));
  });
}

class CategoriesMegaMenuService {
  async getRoots(lang: string = 'en') {
    const headerRoots = await getFullHeaderNavTree(lang);
    return {
      data: headerRoots.filter((root) => root.showInHeader).map((root) => cloneNodeShallow(root)),
    };
  }

  async getBranch(slug: string, lang: string = 'en') {
    const headerRoots = await getFullHeaderNavTree(lang);
    const root = headerRoots.find((item) => item.slug === slug);
    if (!root) {
      throw {
        status: 404,
        type: 'https://api.shop.am/problems/not-found',
        title: 'Category not found',
        detail: `Mega menu branch for slug '${slug}' does not exist`,
      };
    }

    return {
      data: cloneBranch(root),
    };
  }

  /** Warms shared full-tree cache for all storefront locales. */
  async warmCaches(locales: readonly string[] = ['en', 'hy', 'ru']): Promise<void> {
    await Promise.all(locales.map((lang) => getFullHeaderNavTree(lang)));
  }
}

export const categoriesMegaMenuService = new CategoriesMegaMenuService();
