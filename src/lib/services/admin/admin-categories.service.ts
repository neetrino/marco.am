import { db } from "@white-shop/db";
import { invalidateCategoryPublicCaches } from "@/lib/services/read-through-json-cache";
import {
  normalizeProductCategoryLinks,
  toProductCategoriesSet,
  type CategoryGraph,
} from "@/lib/services/product-category-links.service";
import { buildBaseCategorySlug, collectDescendantIds } from "@/lib/services/admin/admin-categories.helpers";
import {
  buildCategoryTranslationsInput,
  deriveExplicitCategoryIds,
  mapCategory,
  normalizeCategoryLocale,
  normalizeCategoryMedia,
  normalizeCategoryTitle,
  normalizeOptionalText,
  type CategoryInput,
  type CategoryMoveDirection,
  type CategoryMoveScope,
  type CategoryNode,
  type CategoryUpdateInput,
  type ProblemError,
  type SupportedCategoryLocale,
} from "@/lib/services/admin/admin-categories.shared";
import {
  applySubcategoryAssignments,
  buildCategoryUpdatePatch,
  prepareCategoryUpdateData,
  upsertCategoryTranslations,
  type LoadedCategoryForUpdate,
} from "@/lib/services/admin/admin-categories-update.helpers";
import type { PrismaTransactionClient } from "@/lib/types/prisma";
import { logger } from "@/lib/utils/logger";

const MAX_CATEGORY_TREE_DEPTH = 64;

class AdminCategoriesService {
  private readonly defaultLocale = "en";
  private readonly supportedLocales: SupportedCategoryLocale[] = ["hy", "en", "ru"];

  private buildProblemError(status: number, title: string, detail: string): ProblemError {
    const typeByStatus = {
      400: "https://api.shop.am/problems/bad-request",
      404: "https://api.shop.am/problems/not-found",
      422: "https://api.shop.am/problems/unprocessable-entity",
    } as const;

    const type = typeByStatus[status as keyof typeof typeByStatus] ?? "https://api.shop.am/problems/internal-error";
    return { status, type, title, detail };
  }

  private async loadCategoryWithChildren(categoryId: string): Promise<(CategoryNode & { children: CategoryNode[] }) | null> {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        translations: true,
        children: {
          where: { deletedAt: null },
          include: { translations: true },
        },
      },
    });

    if (!category) {
      return null;
    }

    return {
      id: category.id,
      parentId: category.parentId,
      requiresSizes: category.requiresSizes,
      showInHeader: category.showInHeader,
      media: Array.isArray(category.media) ? category.media.filter((item): item is string => typeof item === "string") : [],
      translations: category.translations,
      children: category.children.map((child) => ({
        id: child.id,
        parentId: child.parentId,
        requiresSizes: child.requiresSizes,
        showInHeader: child.showInHeader,
        media: Array.isArray(child.media) ? child.media.filter((item): item is string => typeof item === "string") : [],
        translations: child.translations,
      })),
    };
  }

  private async buildUniqueCategorySlug(
    baseSlug: string,
    locale: string,
    excludeCategoryId?: string,
  ): Promise<string> {
    const existingTranslations = await db.categoryTranslation.findMany({
      where: {
        locale,
        slug: {
          startsWith: baseSlug,
        },
        ...(excludeCategoryId
          ? {
              categoryId: {
                not: excludeCategoryId,
              },
            }
          : {}),
      },
      select: {
        slug: true,
      },
    });
    const existingSlugs = new Set(existingTranslations.map((item) => item.slug));
    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
      suffix += 1;
    }
    return `${baseSlug}-${suffix}`;
  }

  private async rebuildFullPathForSubtree(rootCategoryId: string): Promise<void> {
    const categories = await db.category.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        parentId: true,
        translations: {
          select: {
            id: true,
            locale: true,
            slug: true,
            fullPath: true,
          },
        },
      },
    });

    const categoryMap = new Map(
      categories.map((category) => [category.id, category]),
    );
    const childMap = new Map<string, string[]>();

    categories.forEach((category) => {
      if (!category.parentId) {
        return;
      }
      const children = childMap.get(category.parentId) ?? [];
      children.push(category.id);
      childMap.set(category.parentId, children);
    });

    const subtreeIds = collectDescendantIds(rootCategoryId, childMap);
    if (subtreeIds.length === 0) {
      return;
    }

    const pathMemo = new Map<string, string | null>();
    const getPathForLocale = (
      categoryId: string,
      locale: string,
      visited: Set<string>,
    ): string | null => {
      const cacheKey = `${categoryId}:${locale}`;
      if (pathMemo.has(cacheKey)) {
        return pathMemo.get(cacheKey) ?? null;
      }

      if (visited.has(categoryId)) {
        return null;
      }

      const category = categoryMap.get(categoryId);
      if (!category) {
        return null;
      }

      const translation =
        category.translations.find((item) => item.locale === locale) ??
        category.translations[0];

      if (!translation) {
        return null;
      }

      if (!category.parentId) {
        pathMemo.set(cacheKey, translation.slug);
        return translation.slug;
      }

      const nextVisited = new Set(visited);
      nextVisited.add(categoryId);
      const parentPath = getPathForLocale(category.parentId, locale, nextVisited);
      const resultPath = parentPath ? `${parentPath}/${translation.slug}` : translation.slug;
      pathMemo.set(cacheKey, resultPath);
      return resultPath;
    };

    const updates = subtreeIds.flatMap((categoryId) => {
      const category = categoryMap.get(categoryId);
      if (!category) {
        return [];
      }

      return category.translations
        .map((translation) => {
          const computedPath = getPathForLocale(category.id, translation.locale, new Set());
          if (!computedPath || computedPath === translation.fullPath) {
            return null;
          }

          return db.categoryTranslation.update({
            where: { id: translation.id },
            data: { fullPath: computedPath },
          });
        })
        .filter((operation): operation is ReturnType<typeof db.categoryTranslation.update> => operation !== null);
    });

    if (updates.length > 0) {
      await db.$transaction(updates);
    }
  }

  private async ensureParentExists(parentId: string): Promise<void> {
    const parentCategory = await db.category.findFirst({
      where: { id: parentId, deletedAt: null },
      select: { id: true },
    });

    if (!parentCategory) {
      throw this.buildProblemError(
        404,
        "Parent category not found",
        `Parent category with id '${parentId}' does not exist`,
      );
    }
  }

  private async ensureSubcategoriesExist(subcategoryIds: string[]): Promise<void> {
    if (subcategoryIds.length === 0) {
      return;
    }

    const existing = await db.category.findMany({
      where: {
        id: { in: subcategoryIds },
        deletedAt: null,
      },
      select: { id: true },
    });

    const existingIds = new Set(existing.map((item) => item.id));
    const missingId = subcategoryIds.find((id) => !existingIds.has(id));
    if (missingId) {
      throw this.buildProblemError(
        404,
        "Subcategory not found",
        `Subcategory with id '${missingId}' does not exist`,
      );
    }
  }

  private async loadCategoryForUpdate(categoryId: string): Promise<LoadedCategoryForUpdate> {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        translations: {
          select: { id: true, locale: true },
        },
        children: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    });

    if (!category) {
      throw this.buildProblemError(
        404,
        "Category not found",
        `Category with id '${categoryId}' does not exist`,
      );
    }
    return category;
  }

  private async validateCategoryUpdateHierarchy(
    categoryId: string,
    data: CategoryUpdateInput,
    normalizedSubcategoryIds: string[] | undefined,
  ): Promise<void> {
    if (data.parentId === categoryId) {
      throw this.buildProblemError(400, "Invalid parent", "Category cannot be its own parent");
    }

    if (data.parentId) {
      await this.ensureParentExists(data.parentId);
      const parentIsDescendant = await this.isCategoryDescendant(categoryId, data.parentId);
      if (parentIsDescendant) {
        throw this.buildProblemError(
          400,
          "Circular reference",
          "Cannot set parent to a category that is a descendant of this category",
        );
      }
    }

    if (normalizedSubcategoryIds === undefined) {
      return;
    }

    await this.ensureSubcategoriesExist(normalizedSubcategoryIds);
    for (const subcategoryId of normalizedSubcategoryIds) {
      const isAncestor = await this.isCategoryDescendant(subcategoryId, categoryId);
      if (isAncestor) {
        throw this.buildProblemError(
          400,
          "Circular reference",
          "Cannot assign an ancestor category as subcategory",
        );
      }
    }
  }

  private async reindexProductCategoryLinksForCategoryTreeChange(
    changedCategoryIdsInput: string[],
  ): Promise<void> {
    const changedCategoryIds = [...new Set(changedCategoryIdsInput.filter(Boolean))];
    if (changedCategoryIds.length === 0) {
      return;
    }

    const affectedProducts = await db.product.findMany({
      where: {
        deletedAt: null,
        OR: [
          { primaryCategoryId: { in: changedCategoryIds } },
          { categoryIds: { hasSome: changedCategoryIds } },
        ],
      },
      select: {
        id: true,
        primaryCategoryId: true,
        categoryIds: true,
      },
    });
    if (affectedProducts.length === 0) {
      return;
    }

    const categories = await db.category.findMany({
      where: { deletedAt: null },
      select: { id: true, parentId: true },
    });
    const categoryGraph: CategoryGraph = new Map(
      categories.map((category) => [
        category.id,
        {
          id: category.id,
          parentId: category.parentId,
        },
      ]),
    );

    const updates: Array<{
      id: string;
      primaryCategoryId: string | null;
      categoryIds: string[];
    }> = [];

    for (const product of affectedProducts) {
      const explicitCategoryIds = deriveExplicitCategoryIds(
        product.categoryIds,
        categoryGraph,
        MAX_CATEGORY_TREE_DEPTH,
      );
      const normalizedLinks = await normalizeProductCategoryLinks(
        {
          primaryCategoryId: product.primaryCategoryId,
          categoryIds: explicitCategoryIds,
        },
        undefined,
        categoryGraph,
      );
      const primaryChanged = normalizedLinks.primaryCategoryId !== product.primaryCategoryId;
      const categoryIdsChanged =
        normalizedLinks.categoryIds.length !== product.categoryIds.length ||
        normalizedLinks.categoryIds.some((id, index) => id !== product.categoryIds[index]);

      if (!primaryChanged && !categoryIdsChanged) {
        continue;
      }
      updates.push({
        id: product.id,
        primaryCategoryId: normalizedLinks.primaryCategoryId,
        categoryIds: normalizedLinks.categoryIds,
      });
    }

    if (updates.length === 0) {
      return;
    }

    const chunkSize = 50;
    for (let index = 0; index < updates.length; index += chunkSize) {
      const chunk = updates.slice(index, index + chunkSize);
      await db.$transaction(
        chunk.map((update) =>
          db.product.update({
            where: { id: update.id },
            data: {
              primaryCategoryId: update.primaryCategoryId,
              categoryIds: update.categoryIds,
              categories: toProductCategoriesSet(update.categoryIds),
            },
          }),
        ),
      );
    }
  }

  /**
   * Get categories for admin
   */
  async getCategories(localeInput?: string) {
    const locale = normalizeCategoryLocale(
      localeInput,
      this.defaultLocale,
      this.supportedLocales,
    );
    const categories = await db.category.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        translations: true,
      },
      orderBy: {
        position: "asc",
      },
    });
    const categoryIds = categories.map((category) => category.id);
    const directProductCountByCategoryId = new Map<string, number>(
      categoryIds.map((categoryId) => [categoryId, 0]),
    );
    if (categoryIds.length > 0) {
      const relationCounts = await db.$queryRaw<Array<{ categoryId: string; count: bigint }>>`
        SELECT category_id as "categoryId", COUNT(DISTINCT product_id)::bigint as "count"
        FROM (
          SELECT p."id" as product_id, p."primaryCategoryId" as category_id
          FROM "products" p
          WHERE p."deletedAt" IS NULL
            AND p."primaryCategoryId" IS NOT NULL
            AND p."primaryCategoryId" = ANY(${categoryIds}::text[])
          UNION ALL
          SELECT p."id" as product_id, pc."A" as category_id
          FROM "_ProductCategories" pc
          INNER JOIN "products" p ON p."id" = pc."B"
          WHERE p."deletedAt" IS NULL
            AND pc."A" = ANY(${categoryIds}::text[])
        ) category_product
        GROUP BY category_id
      `;

      for (const row of relationCounts) {
        directProductCountByCategoryId.set(
          row.categoryId,
          Number(row.count),
        );
      }
    }

    return {
      data: categories.map((category) =>
        mapCategory(
          {
            id: category.id,
            parentId: category.parentId,
            requiresSizes: category.requiresSizes,
            showInHeader: category.showInHeader,
            media: Array.isArray(category.media) ? category.media.filter((item): item is string => typeof item === "string") : [],
            translations: category.translations,
          },
          locale,
          this.defaultLocale,
          this.supportedLocales,
          directProductCountByCategoryId,
        ),
      ),
    };
  }

  /**
   * Create category
   */
  async createCategory(data: CategoryInput) {
    const locale = normalizeCategoryLocale(
      data.locale,
      this.defaultLocale,
      this.supportedLocales,
    );
    const translationTitles = buildCategoryTranslationsInput({
      locale: data.locale,
      title: data.title,
      translations: data.translations,
      defaultLocale: this.defaultLocale,
      supportedLocales: this.supportedLocales,
    });
    const entries = Object.entries(translationTitles) as Array<[SupportedCategoryLocale, string]>;
    const primaryTitle = entries[0]?.[1] ?? normalizeCategoryTitle(data.title);

    if (!primaryTitle) {
      throw this.buildProblemError(400, "Invalid title", "Category title cannot be empty");
    }

    if (data.parentId) {
      await this.ensureParentExists(data.parentId);
    }
    const normalizedMedia = normalizeCategoryMedia(data.media);

    const basePrimarySlug = buildBaseCategorySlug(primaryTitle);
    const provisionalSlug =
      basePrimarySlug.length > 0
        ? basePrimarySlug
        : `tmp-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    const category = await db.category.create({
      data: {
        parentId: data.parentId || undefined,
        requiresSizes: data.requiresSizes ?? false,
        showInHeader: data.showInHeader ?? true,
        media: normalizedMedia,
        published: true,
        translations: {
          create: {
            locale,
            title: primaryTitle,
            slug: provisionalSlug,
            fullPath: provisionalSlug,
            seoTitle: normalizeOptionalText(data.seoTitle),
            seoDescription: normalizeOptionalText(data.seoDescription),
          },
        },
      },
    });

    const titleForMissing = primaryTitle;
    const allTitles: Record<SupportedCategoryLocale, string> = {
      hy: translationTitles.hy ?? titleForMissing,
      en: translationTitles.en ?? titleForMissing,
      ru: translationTitles.ru ?? titleForMissing,
    };
    await Promise.all(
      this.supportedLocales.map(async (supportedLocale) => {
        const existing = await db.categoryTranslation.findFirst({
          where: {
            categoryId: category.id,
            locale: supportedLocale,
          },
        });
        const nextTitle = allTitles[supportedLocale];
        if (!nextTitle) {
          return;
        }
        if (existing) {
          const uniqueSlug = await this.buildUniqueCategorySlug(
            buildBaseCategorySlug(nextTitle),
            supportedLocale,
            category.id,
          );
          await db.categoryTranslation.update({
            where: { id: existing.id },
            data: {
              title: nextTitle,
              slug: uniqueSlug,
            },
          });
          return;
        }
        const slug = await this.buildUniqueCategorySlug(
          buildBaseCategorySlug(nextTitle),
          supportedLocale,
          category.id,
        );
        await db.categoryTranslation.create({
          data: {
            categoryId: category.id,
            locale: supportedLocale,
            title: nextTitle,
            slug,
            fullPath: slug,
            seoTitle: normalizeOptionalText(data.seoTitle),
            seoDescription: normalizeOptionalText(data.seoDescription),
          },
        });
      }),
    );

    await this.rebuildFullPathForSubtree(category.id);
    const reloaded = await this.loadCategoryWithChildren(category.id);
    if (!reloaded) {
      throw this.buildProblemError(404, "Category not found", `Category with id '${category.id}' does not exist`);
    }

    await invalidateCategoryPublicCaches();

    return {
      data: mapCategory(
        {
          id: reloaded.id,
          parentId: reloaded.parentId,
          requiresSizes: reloaded.requiresSizes,
          showInHeader: reloaded.showInHeader,
          media: Array.isArray(reloaded.media) ? reloaded.media.filter((item): item is string => typeof item === "string") : [],
          translations: reloaded.translations,
        },
        locale,
        this.defaultLocale,
        this.supportedLocales,
      ),
    };
  }

  /**
   * Get category by ID with children
   */
  async getCategoryById(categoryId: string, localeInput?: string) {
    const locale = normalizeCategoryLocale(
      localeInput,
      this.defaultLocale,
      this.supportedLocales,
    );
    const category = await this.loadCategoryWithChildren(categoryId);

    if (!category) {
      return null;
    }

    return {
      ...mapCategory(
        {
          id: category.id,
          parentId: category.parentId,
          requiresSizes: category.requiresSizes,
          showInHeader: category.showInHeader,
          media: Array.isArray(category.media) ? category.media.filter((item): item is string => typeof item === "string") : [],
          translations: category.translations,
        },
        locale,
        this.defaultLocale,
        this.supportedLocales,
      ),
      children: category.children.map((child) =>
        mapCategory(
          {
            id: child.id,
            parentId: child.parentId,
            requiresSizes: child.requiresSizes,
            showInHeader: child.showInHeader,
            media: Array.isArray(child.media) ? child.media.filter((item): item is string => typeof item === "string") : [],
            translations: child.translations,
          },
          locale,
          this.defaultLocale,
          this.supportedLocales,
        ),
      ),
    };
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: string, data: CategoryUpdateInput) {
    const category = await this.loadCategoryForUpdate(categoryId);
    const prepared = prepareCategoryUpdateData({
      category,
      categoryId,
      data,
      defaultLocale: this.defaultLocale,
      supportedLocales: this.supportedLocales,
      buildProblemError: this.buildProblemError.bind(this),
    });
    await this.validateCategoryUpdateHierarchy(
      categoryId,
      data,
      prepared.normalizedSubcategoryIds,
    );

    await db.$transaction(async (tx: PrismaTransactionClient) => {
      const buildUniqueCategorySlugInTransaction = async (
        baseSlug: string,
        locale: string,
        excludeCategoryId?: string,
      ): Promise<string> => {
        const existingTranslations = await tx.categoryTranslation.findMany({
          where: {
            locale,
            slug: {
              startsWith: baseSlug,
            },
            ...(excludeCategoryId
              ? {
                  categoryId: {
                    not: excludeCategoryId,
                  },
                }
              : {}),
          },
          select: {
            slug: true,
          },
        });
        const existingSlugs = new Set(existingTranslations.map((item) => item.slug));
        if (!existingSlugs.has(baseSlug)) {
          return baseSlug;
        }

        let suffix = 2;
        while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
          suffix += 1;
        }
        return `${baseSlug}-${suffix}`;
      };

      const categoryPatch = buildCategoryUpdatePatch(
        data,
        prepared.normalizedMedia,
      );
      if (categoryPatch) {
        await tx.category.update({
          where: { id: categoryId },
          data: categoryPatch,
        });
      }

      if (prepared.hasTranslationPayload) {
        await upsertCategoryTranslations(tx, {
          categoryId,
          data,
          locale: prepared.locale,
          hasBulkTranslations: prepared.hasBulkTranslations,
          translationTitles: prepared.translationTitles,
          category,
          supportedLocales: this.supportedLocales,
          buildProblemError: this.buildProblemError.bind(this),
          buildUniqueCategorySlug: buildUniqueCategorySlugInTransaction,
        });
      }

      await applySubcategoryAssignments(
        tx,
        categoryId,
        prepared.normalizedSubcategoryIds,
      );
    });

    const shouldRebuildCurrentSubtree =
      prepared.parentChanged ||
      prepared.normalizedTitle !== undefined ||
      prepared.subcategoriesChanged;

    if (shouldRebuildCurrentSubtree) {
      await this.rebuildFullPathForSubtree(categoryId);
      for (const removedChildId of prepared.removedChildIds) {
        await this.rebuildFullPathForSubtree(removedChildId);
      }
    }

    const shouldReindexProductCategoryLinks =
      prepared.parentChanged || prepared.subcategoriesChanged;
    if (shouldReindexProductCategoryLinks) {
      await this.reindexProductCategoryLinksForCategoryTreeChange([
        categoryId,
        ...(prepared.normalizedSubcategoryIds ?? []),
        ...prepared.removedChildIds,
      ]);
    }

    const updatedCategory = await db.category.findUnique({
      where: { id: categoryId },
      include: { translations: true },
    });

    if (!updatedCategory) {
      throw this.buildProblemError(
        404,
        "Category not found",
        `Category with id '${categoryId}' does not exist`,
      );
    }

    await invalidateCategoryPublicCaches();

    return {
      data: mapCategory(
        {
          id: updatedCategory.id,
          parentId: updatedCategory.parentId,
          requiresSizes: updatedCategory.requiresSizes,
          showInHeader: updatedCategory.showInHeader,
          media: Array.isArray(updatedCategory.media) ? updatedCategory.media.filter((item): item is string => typeof item === "string") : [],
          translations: updatedCategory.translations,
        },
        prepared.locale,
        this.defaultLocale,
        this.supportedLocales,
      ),
    };
  }

  /**
   * Helper function to check if a category is a descendant of another category
   */
  private async isCategoryDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
    let currentId: string | null = descendantId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) {
        return false;
      }
      visited.add(currentId);

      const category: { parentId: string | null } | null =
        await db.category.findUnique({
        where: { id: currentId },
        select: {
          parentId: true,
        },
        });

      if (!category?.parentId) {
        return false;
      }

      if (category.parentId === ancestorId) {
        return true;
      }

      currentId = category.parentId;
    }
    return false;
  }

  private async loadSubtreeCategoryIds(rootCategoryId: string): Promise<string[]> {
    const categories = await db.category.findMany({
      where: { deletedAt: null },
      select: { id: true, parentId: true },
    });

    const childMap = new Map<string, string[]>();
    categories.forEach((category) => {
      if (!category.parentId) {
        return;
      }
      const siblings = childMap.get(category.parentId) ?? [];
      siblings.push(category.id);
      childMap.set(category.parentId, siblings);
    });

    return collectDescendantIds(rootCategoryId, childMap);
  }

  private async countActiveProductsInCategories(categoryIds: string[]): Promise<number> {
    if (categoryIds.length === 0) {
      return 0;
    }

    return db.product.count({
      where: {
        deletedAt: null,
        OR: [
          { primaryCategoryId: { in: categoryIds } },
          { categoryIds: { hasSome: categoryIds } },
        ],
      },
    });
  }

  /**
   * Delete category (soft delete)
   */
  private async loadScopedCategoryOrder(scope: CategoryMoveScope): Promise<string[]> {
    const whereScope =
      scope === "roots" ? { parentId: null } : { parentId: { not: null } };
    const scopedCategories = await db.category.findMany({
      where: {
        deletedAt: null,
        ...whereScope,
      },
      select: {
        id: true,
      },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
    return scopedCategories.map((item) => item.id);
  }

  private async persistScopedCategoryOrder(orderedIds: string[]): Promise<void> {
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.category.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );
  }

  async moveCategory(data: {
    categoryId: string;
    direction: CategoryMoveDirection;
    scope: CategoryMoveScope;
  }) {
    const categoryId = data.categoryId.trim();
    if (!categoryId) {
      throw this.buildProblemError(400, "Invalid category id", "Category id is required");
    }

    const orderedIds = await this.loadScopedCategoryOrder(data.scope);
    const currentIndex = orderedIds.findIndex((id) => id === categoryId);
    if (currentIndex < 0) {
      throw this.buildProblemError(
        404,
        "Category not found",
        `Category with id '${categoryId}' does not exist in ${data.scope}`,
      );
    }

    const delta = data.direction === "up" ? -1 : 1;
    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= orderedIds.length) {
      return { success: true, moved: false };
    }

    const [movingId] = orderedIds.splice(currentIndex, 1);
    orderedIds.splice(targetIndex, 0, movingId);

    await this.persistScopedCategoryOrder(orderedIds);
    await invalidateCategoryPublicCaches();
    return { success: true, moved: true };
  }

  async reorderCategory(data: {
    categoryId: string;
    targetCategoryId: string;
    scope: CategoryMoveScope;
  }) {
    const categoryId = data.categoryId.trim();
    const targetCategoryId = data.targetCategoryId.trim();
    if (!categoryId || !targetCategoryId) {
      throw this.buildProblemError(
        400,
        "Invalid category reorder request",
        "categoryId and targetCategoryId are required",
      );
    }

    const orderedIds = await this.loadScopedCategoryOrder(data.scope);
    const sourceIndex = orderedIds.findIndex((id) => id === categoryId);
    const targetIndex = orderedIds.findIndex((id) => id === targetCategoryId);
    if (sourceIndex < 0 || targetIndex < 0) {
      throw this.buildProblemError(
        404,
        "Category not found",
        "Category or target category does not exist in current scope",
      );
    }

    if (sourceIndex === targetIndex) {
      return { success: true, moved: false };
    }

    const [movingId] = orderedIds.splice(sourceIndex, 1);
    orderedIds.splice(targetIndex, 0, movingId);
    await this.persistScopedCategoryOrder(orderedIds);
    await invalidateCategoryPublicCaches();
    return { success: true, moved: true };
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId: string, options?: { cascade?: boolean }) {
    logger.devLog('🗑️ [ADMIN SERVICE] deleteCategory called:', categoryId);
    
    const category = await db.category.findFirst({
      where: { id: categoryId },
      include: {
        children: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!category) {
      throw this.buildProblemError(
        404,
        "Category not found",
        `Category with id '${categoryId}' does not exist`,
      );
    }

    // Check if category has children
    const childrenCount = category.children ? category.children.length : 0;
    if (childrenCount > 0) {
      if (!options?.cascade) {
        throw this.buildProblemError(
          422,
          "Cannot delete category",
          `This category has ${childrenCount} child categor${childrenCount > 1 ? "ies" : "y"}. Please delete or move child categories first.`,
        );
      }

      const subtreeIds = await this.loadSubtreeCategoryIds(categoryId);
      const productsCount = await this.countActiveProductsInCategories(subtreeIds);
      if (productsCount > 0) {
        throw this.buildProblemError(
          422,
          "Cannot delete category",
          `This category tree has ${productsCount} associated product${productsCount > 1 ? "s" : ""}. Remove products from these categories first.`,
        );
      }

      await db.category.updateMany({
        where: { id: { in: subtreeIds } },
        data: {
          deletedAt: new Date(),
          published: false,
        },
      });

      logger.devLog('✅ [ADMIN SERVICE] Category subtree deleted:', {
        categoryId,
        deletedCount: subtreeIds.length,
      });
      await invalidateCategoryPublicCaches();
      return { success: true, deletedCount: subtreeIds.length };
    }

    const productsCount = await this.countActiveProductsInCategories([categoryId]);

    if (productsCount > 0) {
      throw this.buildProblemError(
        422,
        "Cannot delete category",
        `This category has ${productsCount} associated product${productsCount > 1 ? "s" : ""}. Please remove products from this category first.`,
      );
    }

    await db.category.update({
      where: { id: categoryId },
      data: {
        deletedAt: new Date(),
        published: false,
      },
    });

    logger.devLog('✅ [ADMIN SERVICE] Category deleted:', categoryId);
    await invalidateCategoryPublicCaches();
    return { success: true };
  }
}

export const adminCategoriesService = new AdminCategoriesService();



