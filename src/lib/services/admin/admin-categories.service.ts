import { db } from "@white-shop/db";
import { invalidateCategoryPublicCaches } from "@/lib/services/read-through-json-cache";
import { toSlug } from "@/lib/utils/slug";
import { logger } from "@/lib/utils/logger";

type CategoryTranslation = {
  id: string;
  locale: string;
  title: string;
  slug: string;
  fullPath: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

type CategoryNode = {
  id: string;
  parentId: string | null;
  requiresSizes: boolean;
  media: string[];
  translations: CategoryTranslation[];
};

type CategoryResponseItem = {
  id: string;
  title: string;
  slug: string;
  fullPath: string;
  seoTitle: string | null;
  seoDescription: string | null;
  media: string[];
  parentId: string | null;
  requiresSizes: boolean;
  translations: Partial<Record<SupportedCategoryLocale, string>>;
};

type ProblemError = {
  status: number;
  type: string;
  title: string;
  detail: string;
};

type CategoryInput = {
  title: string;
  locale?: string;
  translations?: Partial<Record<SupportedCategoryLocale, string>>;
  parentId?: string;
  requiresSizes?: boolean;
  media?: unknown;
  seoTitle?: string;
  seoDescription?: string;
};

type CategoryUpdateInput = {
  title?: string;
  locale?: string;
  translations?: Partial<Record<SupportedCategoryLocale, string>>;
  parentId?: string | null;
  requiresSizes?: boolean;
  media?: unknown;
  subcategoryIds?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type SupportedCategoryLocale = "hy" | "en" | "ru";

class AdminCategoriesService {
  private readonly defaultLocale = "en";
  private readonly supportedLocales: SupportedCategoryLocale[] = ["hy", "en", "ru"];

  private buildProblemError(status: number, title: string, detail: string): ProblemError {
    const typeByStatus = {
      400: "https://api.shop.am/problems/bad-request",
      404: "https://api.shop.am/problems/not-found",
    } as const;

    const type = typeByStatus[status as keyof typeof typeByStatus] ?? "https://api.shop.am/problems/internal-error";
    return { status, type, title, detail };
  }

  private resolveTranslation(translations: CategoryTranslation[], locale: string): CategoryTranslation | null {
    const normalizedLocale = locale.trim().toLowerCase();
    return (
      translations.find((translation) => translation.locale === normalizedLocale) ??
      translations.find((translation) => translation.locale === this.defaultLocale) ??
      translations.find((translation) => translation.locale === "hy") ??
      translations.find((translation) => translation.locale === "ru") ??
      translations[0] ??
      null
    );
  }

  private mapTranslationsByLocale(
    translations: CategoryTranslation[],
  ): Partial<Record<SupportedCategoryLocale, string>> {
    const result: Partial<Record<SupportedCategoryLocale, string>> = {};
    translations.forEach((translation) => {
      const locale = translation.locale as SupportedCategoryLocale;
      if (this.supportedLocales.includes(locale)) {
        result[locale] = translation.title;
      }
    });
    return result;
  }

  private mapCategory(category: CategoryNode, locale: string): CategoryResponseItem {
    const translation = this.resolveTranslation(category.translations, locale);
    return {
      id: category.id,
      title: translation?.title ?? "",
      slug: translation?.slug ?? "",
      fullPath: translation?.fullPath ?? "",
      seoTitle: translation?.seoTitle ?? null,
      seoDescription: translation?.seoDescription ?? null,
      media: category.media,
      parentId: category.parentId,
      requiresSizes: category.requiresSizes,
      translations: this.mapTranslationsByLocale(category.translations),
    };
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
      media: Array.isArray(category.media) ? category.media.filter((item): item is string => typeof item === "string") : [],
      translations: category.translations,
      children: category.children.map((child) => ({
        id: child.id,
        parentId: child.parentId,
        requiresSizes: child.requiresSizes,
        media: Array.isArray(child.media) ? child.media.filter((item): item is string => typeof item === "string") : [],
        translations: child.translations,
      })),
    };
  }

  private normalizeLocale(locale?: string): string {
    return (locale ?? this.defaultLocale).trim().toLowerCase();
  }

  private normalizeTitle(title: string): string {
    return title.trim();
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeCategoryMedia(media: unknown): string[] {
    if (!Array.isArray(media)) {
      return [];
    }

    const normalized: string[] = [];
    for (const item of media) {
      if (typeof item !== "string") {
        continue;
      }
      const trimmed = item.trim();
      if (!trimmed) {
        continue;
      }
      const isDataImage = trimmed.startsWith("data:image/");
      const isHttpUrl = trimmed.startsWith("https://") || trimmed.startsWith("http://");
      const isRelativePath = trimmed.startsWith("/");
      if (!isDataImage && !isHttpUrl && !isRelativePath) {
        continue;
      }
      normalized.push(trimmed);
    }

    return [...new Set(normalized)];
  }

  private normalizeLocalizedTitles(
    translations?: Partial<Record<SupportedCategoryLocale, string>>,
  ): Partial<Record<SupportedCategoryLocale, string>> {
    if (!translations) {
      return {};
    }
    const normalized: Partial<Record<SupportedCategoryLocale, string>> = {};
    this.supportedLocales.forEach((locale) => {
      const value = translations[locale];
      if (typeof value !== "string") {
        return;
      }
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        normalized[locale] = trimmed;
      }
    });
    return normalized;
  }

  private buildCategoryTranslationsInput(args: {
    locale?: string;
    title?: string;
    translations?: Partial<Record<SupportedCategoryLocale, string>>;
  }): Partial<Record<SupportedCategoryLocale, string>> {
    const normalized = this.normalizeLocalizedTitles(args.translations);
    const legacyTitle = args.title?.trim();
    const normalizedLocale = this.normalizeLocale(args.locale) as SupportedCategoryLocale;
    if (legacyTitle && this.supportedLocales.includes(normalizedLocale)) {
      normalized[normalizedLocale] = legacyTitle;
    }
    return normalized;
  }

  /**
   * `toSlug` only keeps [a-z0-9]; Armenian-only titles become "" and break URLs / fullPath.
   */
  private stableSlugFromCategoryId(categoryId: string): string {
    const tail = categoryId.replace(/[^a-z0-9]/gi, "").toLowerCase();
    return tail.length > 0 ? `cat-${tail}` : "cat-category";
  }

  private slugFromTitleOrCategoryId(title: string, categoryId: string): string {
    const fromTitle = toSlug(title);
    return fromTitle.length > 0 ? fromTitle : this.stableSlugFromCategoryId(categoryId);
  }

  private collectDescendantIds(rootCategoryId: string, childMap: Map<string, string[]>): string[] {
    const queue = [rootCategoryId];
    const descendants: string[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) {
        continue;
      }

      descendants.push(currentId);
      const children = childMap.get(currentId) ?? [];
      queue.push(...children);
    }

    return descendants;
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

    const subtreeIds = this.collectDescendantIds(rootCategoryId, childMap);
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

  /**
   * Get categories for admin
   */
  async getCategories() {
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

    return {
      data: categories.map((category) =>
        this.mapCategory(
          {
            id: category.id,
            parentId: category.parentId,
            requiresSizes: category.requiresSizes,
            media: Array.isArray(category.media) ? category.media.filter((item): item is string => typeof item === "string") : [],
            translations: category.translations,
          },
          this.defaultLocale,
        ),
      ),
    };
  }

  /**
   * Create category
   */
  async createCategory(data: CategoryInput) {
    const locale = this.normalizeLocale(data.locale);
    const translationTitles = this.buildCategoryTranslationsInput({
      locale: data.locale,
      title: data.title,
      translations: data.translations,
    });
    const entries = Object.entries(translationTitles) as Array<[SupportedCategoryLocale, string]>;
    const primaryLocale = entries[0]?.[0] ?? (locale as SupportedCategoryLocale);
    const primaryTitle = entries[0]?.[1] ?? this.normalizeTitle(data.title);

    if (!primaryTitle) {
      throw this.buildProblemError(400, "Invalid title", "Category title cannot be empty");
    }

    if (data.parentId) {
      await this.ensureParentExists(data.parentId);
    }
    const normalizedMedia = this.normalizeCategoryMedia(data.media);

    const slugFromTitle = toSlug(primaryTitle);
    const provisionalSlug =
      slugFromTitle.length > 0
        ? slugFromTitle
        : `tmp-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    const category = await db.category.create({
      data: {
        parentId: data.parentId || undefined,
        requiresSizes: data.requiresSizes ?? false,
        media: normalizedMedia,
        published: true,
        translations: {
          create: {
            locale,
            title: primaryTitle,
            slug: provisionalSlug,
            fullPath: provisionalSlug,
            seoTitle: this.normalizeOptionalText(data.seoTitle),
            seoDescription: this.normalizeOptionalText(data.seoDescription),
          },
        },
      },
    });

    if (slugFromTitle.length === 0) {
      const fallback = this.stableSlugFromCategoryId(category.id);
      const createdTr = await db.categoryTranslation.findFirst({
        where: { categoryId: category.id, locale: primaryLocale },
      });
      if (createdTr) {
        await db.categoryTranslation.update({
          where: { id: createdTr.id },
          data: { slug: fallback, fullPath: fallback },
        });
      }
    }

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
          await db.categoryTranslation.update({
            where: { id: existing.id },
            data: {
              title: nextTitle,
              slug: this.slugFromTitleOrCategoryId(nextTitle, category.id),
            },
          });
          return;
        }
        const slug = this.slugFromTitleOrCategoryId(nextTitle, category.id);
        await db.categoryTranslation.create({
          data: {
            categoryId: category.id,
            locale: supportedLocale,
            title: nextTitle,
            slug,
            fullPath: slug,
            seoTitle: this.normalizeOptionalText(data.seoTitle),
            seoDescription: this.normalizeOptionalText(data.seoDescription),
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
      data: this.mapCategory(
        {
          id: reloaded.id,
          parentId: reloaded.parentId,
          requiresSizes: reloaded.requiresSizes,
          media: Array.isArray(reloaded.media) ? reloaded.media.filter((item): item is string => typeof item === "string") : [],
          translations: reloaded.translations,
        },
        locale,
      ),
    };
  }

  /**
   * Get category by ID with children
   */
  async getCategoryById(categoryId: string) {
    const category = await this.loadCategoryWithChildren(categoryId);

    if (!category) {
      return null;
    }

    return {
      ...this.mapCategory(
        {
          id: category.id,
          parentId: category.parentId,
          requiresSizes: category.requiresSizes,
          media: Array.isArray(category.media) ? category.media.filter((item): item is string => typeof item === "string") : [],
          translations: category.translations,
        },
        this.defaultLocale,
      ),
      children: category.children.map((child) =>
        this.mapCategory(
          {
            id: child.id,
            parentId: child.parentId,
            requiresSizes: child.requiresSizes,
            media: Array.isArray(child.media) ? child.media.filter((item): item is string => typeof item === "string") : [],
            translations: child.translations,
          },
          this.defaultLocale,
        ),
      ),
    };
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: string, data: CategoryUpdateInput) {
    const locale = this.normalizeLocale(data.locale);
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        translations: true,
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

    const normalizedTitle = data.title !== undefined ? this.normalizeTitle(data.title) : undefined;
    if (normalizedTitle !== undefined && normalizedTitle.length === 0) {
      throw this.buildProblemError(400, "Invalid title", "Category title cannot be empty");
    }

    const translationTitles = this.buildCategoryTranslationsInput({
      locale: data.locale,
      title: data.title,
      translations: data.translations,
    });
    const hasBulkTranslations = Object.keys(translationTitles).length > 0;
    const hasTranslationPayload =
      normalizedTitle !== undefined ||
      data.seoTitle !== undefined ||
      data.seoDescription !== undefined ||
      hasBulkTranslations;
    const normalizedSubcategoryIds =
      data.subcategoryIds !== undefined
        ? [...new Set(data.subcategoryIds.filter((id) => id && id !== categoryId))]
        : undefined;
    const normalizedMedia = data.media !== undefined ? this.normalizeCategoryMedia(data.media) : undefined;

    if (normalizedSubcategoryIds !== undefined) {
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

    const currentChildIds = new Set(category.children.map((child) => child.id));
    const removedChildIds =
      normalizedSubcategoryIds !== undefined
        ? [...currentChildIds].filter((childId) => !normalizedSubcategoryIds.includes(childId))
        : [];

    await db.$transaction(async (transaction) => {
      if (data.parentId !== undefined || data.requiresSizes !== undefined || normalizedMedia !== undefined) {
        await transaction.category.update({
          where: { id: categoryId },
          data: {
            parentId: data.parentId !== undefined ? data.parentId || null : undefined,
            requiresSizes: data.requiresSizes,
            media: normalizedMedia,
          },
        });
      }

      if (hasTranslationPayload) {
        const normalizedSeoTitle = this.normalizeOptionalText(data.seoTitle ?? undefined);
        const normalizedSeoDescription = this.normalizeOptionalText(data.seoDescription ?? undefined);
        const targetLocales = hasBulkTranslations
          ? this.supportedLocales.filter((supportedLocale) => translationTitles[supportedLocale])
          : [locale as SupportedCategoryLocale];

        if (targetLocales.length === 0) {
          throw this.buildProblemError(
            400,
            "Missing title",
            "At least one localized category title is required",
          );
        }

        for (const targetLocale of targetLocales) {
          const nextTitle = translationTitles[targetLocale];
          const existingTranslation = category.translations.find(
            (translation) => translation.locale === targetLocale,
          );
          if (!existingTranslation && !nextTitle) {
            continue;
          }

          if (existingTranslation) {
            await transaction.categoryTranslation.update({
              where: { id: existingTranslation.id },
              data: {
                title: nextTitle,
                slug:
                  nextTitle !== undefined
                    ? this.slugFromTitleOrCategoryId(nextTitle, categoryId)
                    : undefined,
                seoTitle: data.seoTitle !== undefined ? normalizedSeoTitle : undefined,
                seoDescription: data.seoDescription !== undefined ? normalizedSeoDescription : undefined,
              },
            });
            continue;
          }

          if (!nextTitle) {
            throw this.buildProblemError(
              400,
              "Missing title",
              `Category translation for locale '${targetLocale}' requires title when creating a new translation`,
            );
          }

          const slug = this.slugFromTitleOrCategoryId(nextTitle, categoryId);
          await transaction.categoryTranslation.create({
            data: {
              categoryId,
              locale: targetLocale,
              title: nextTitle,
              slug,
              fullPath: slug,
              seoTitle: normalizedSeoTitle,
              seoDescription: normalizedSeoDescription,
            },
          });
        }
      }

      if (normalizedSubcategoryIds !== undefined) {
        await transaction.category.updateMany({
          where: { parentId: categoryId },
          data: { parentId: null },
        });

        if (normalizedSubcategoryIds.length > 0) {
          await transaction.category.updateMany({
            where: { id: { in: normalizedSubcategoryIds } },
            data: { parentId: categoryId },
          });
        }
      }
    });

    const shouldRebuildCurrentSubtree =
      data.parentId !== undefined ||
      normalizedTitle !== undefined ||
      normalizedSubcategoryIds !== undefined;

    if (shouldRebuildCurrentSubtree) {
      await this.rebuildFullPathForSubtree(categoryId);
      for (const removedChildId of removedChildIds) {
        await this.rebuildFullPathForSubtree(removedChildId);
      }
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
      data: this.mapCategory(
        {
          id: updatedCategory.id,
          parentId: updatedCategory.parentId,
          requiresSizes: updatedCategory.requiresSizes,
          media: Array.isArray(updatedCategory.media) ? updatedCategory.media.filter((item): item is string => typeof item === "string") : [],
          translations: updatedCategory.translations,
        },
        locale,
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

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId: string) {
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
      throw this.buildProblemError(
        400,
        "Cannot delete category",
        `This category has ${childrenCount} child categor${childrenCount > 1 ? "ies" : "y"}. Please delete or move child categories first.`,
      );
    }

    // Check if category has products (using count for better performance)
    const productsCount = await db.product.count({
      where: {
        OR: [
          { primaryCategoryId: categoryId },
          { categoryIds: { has: categoryId } },
        ],
        deletedAt: null,
      },
    });

    if (productsCount > 0) {
      throw this.buildProblemError(
        400,
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



