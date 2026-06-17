import { db } from "@white-shop/db";

import {
  filterHeaderNavCategoryTree,
} from "@/lib/constants/excluded-shop-category-slugs";
import { getCachedJson } from "@/lib/services/read-through-json-cache";
import { buildDistinctSubtreeProductCountMap } from "@/lib/services/category-product-counts.service";
import { resolveCategoryTranslation } from "@/lib/i18n/category-translation";

/** Categories change rarely; longer TTL improves Redis hit rate (invalidated on admin category writes). */
const CATEGORY_TREE_CACHE_TTL_SEC = 300;

class CategoriesService {
  /**
   * Get category tree
   */
  async getTree(lang: string = "en") {
    const cacheKey = `categories:tree:v3:${lang}`;
    return getCachedJson(cacheKey, CATEGORY_TREE_CACHE_TTL_SEC, () =>
      this.buildCategoryTree(lang),
    );
  }

  private async buildCategoryTree(lang: string) {
    const categories = await db.category.findMany({
      where: {
        published: true,
        deletedAt: null,
      },
      include: {
        translations: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    // Build tree structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    categories.forEach((category: {
      id: string;
      parentId: string | null;
      showInHeader: boolean;
      media: unknown[];
      translations: Array<{ locale: string; slug: string; title: string; fullPath: string }>;
    }) => {
      const translation = resolveCategoryTranslation(category.translations, lang);
      if (!translation) return;

      const categoryData = {
        id: category.id,
        slug: translation.slug,
        title: translation.title,
        showInHeader: category.showInHeader,
        fullPath: translation.fullPath,
        media: Array.isArray(category.media)
          ? category.media.filter((item): item is string => typeof item === 'string')
          : [],
        productCount: 0,
        children: [] as any[],
      };

      categoryMap.set(category.id, categoryData);

      if (!category.parentId) {
        rootCategories.push(categoryData);
      }
    });

    // Build parent-child relationships
    categories.forEach((category: {
      id: string;
      parentId: string | null;
    }) => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        const child = categoryMap.get(category.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    const allIds = Array.from(categoryMap.keys()) as string[];
    if (allIds.length > 0) {
      const categoryRows = categories.map((category) => ({
        id: category.id,
        parentId: category.parentId,
      }));
      const publishedProducts = await db.product.findMany({
        where: { published: true, deletedAt: null },
        select: { primaryCategoryId: true, categoryIds: true },
      });
      const productCountById = buildDistinctSubtreeProductCountMap(
        categoryRows,
        publishedProducts,
      );

      for (const id of allIds) {
        const node = categoryMap.get(id) as { productCount: number } | undefined;
        if (node) {
          node.productCount = productCountById.get(id) ?? 0;
        }
      }
    }

    return {
      data: filterHeaderNavCategoryTree(rootCategories),
    };
  }

  /**
   * Get category by slug
   */
  async findBySlug(slug: string, lang: string = "en") {
    const category = await db.category.findFirst({
      where: {
        translations: {
          some: {
            slug,
            locale: lang,
          },
        },
        published: true,
        deletedAt: null,
      },
      include: {
        translations: true,
        parent: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!category) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Category not found",
        detail: `Category with slug '${slug}' does not exist or is not published`,
      };
    }

    const translation = resolveCategoryTranslation(category.translations, lang);
    const parentTranslation = category.parent
      ? resolveCategoryTranslation(category.parent.translations, lang)
      : null;

    return {
      id: category.id,
      slug: translation?.slug || "",
      title: translation?.title || "",
      description: translation?.description || null,
      fullPath: translation?.fullPath || "",
      seo: {
        title: translation?.seoTitle || translation?.title,
        description: translation?.seoDescription || null,
      },
      parent: category.parent
        ? {
            id: category.parent.id,
            slug: parentTranslation?.slug || "",
            title: parentTranslation?.title || "",
          }
        : null,
    };
  }
}

export const categoriesService = new CategoriesService();

