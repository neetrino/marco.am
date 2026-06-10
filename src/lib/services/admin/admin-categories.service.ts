import { db } from "@white-shop/db";
import { invalidateCategoryPublicCaches } from "@/lib/services/read-through-json-cache";
import {
  normalizeProductCategoryLinks,
  toProductCategoriesSet,
  type CategoryGraph,
} from "@/lib/services/product-category-links.service";
import { buildBaseCategorySlug, collectDescendantIds } from "@/lib/services/admin/admin-categories.helpers";
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
  showInHeader: boolean;
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
  showInHeader: boolean;
  requiresSizes: boolean;
  productCount: number;
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
  showInHeader?: boolean;
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
  showInHeader?: boolean;
  requiresSizes?: boolean;
  media?: unknown;
  subcategoryIds?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
};

type SupportedCategoryLocale = "hy" | "en" | "ru";
type CategoryMoveDirection = "up" | "down";
type CategoryMoveScope = "roots" | "subcategories";
const MAX_CATEGORY_TREE_DEPTH = 64;
const LEGACY_AUTO_SLUG_PATTERN = /^cat-[a-z0-9]+$/;

function toSortedUniqueIds(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

function sameSortedIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}

class AdminCategoriesService {
  private readonly defaultLocale = "en";
  private readonly supportedLocales: SupportedCategoryLocale[] = ["hy", "en", "ru"];
  private didRepairLegacyCategorySlugs = false;

  private buildProblemError(status: number, title: string, detail: string): ProblemError {
    const typeByStatus = {
      400: "https://api.shop.am/problems/bad-request",
      404: "https://api.shop.am/problems/not-found",
      422: "https://api.shop.am/problems/unprocessable-entity",
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

  private mapCategory(
    category: CategoryNode,
    locale: string,
    productCountByCategoryId?: Map<string, number>,
  ): CategoryResponseItem {
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
      showInHeader: category.showInHeader,
      requiresSizes: category.requiresSizes,
      productCount: productCountByCategoryId?.get(category.id) ?? 0,
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

  private normalizeLocale(locale?: string): string {
    const normalized = (locale ?? this.defaultLocale).trim().toLowerCase();
    if (normalized === "ka") {
      return "en";
    }
    return this.supportedLocales.includes(normalized as SupportedCategoryLocale)
      ? normalized
      : this.defaultLocale;
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

  private async ensureLegacyCategorySlugsRepaired(): Promise<void> {
    if (this.didRepairLegacyCategorySlugs) {
      return;
    }
    this.didRepairLegacyCategorySlugs = true;

    const legacyTranslations = await db.categoryTranslation.findMany({
      where: {
        slug: {
          startsWith: "cat-",
        },
      },
      select: {
        id: true,
        categoryId: true,
        locale: true,
        title: true,
        slug: true,
      },
    });
    const candidates = legacyTranslations.filter((translation) =>
      LEGACY_AUTO_SLUG_PATTERN.test(translation.slug),
    );
    if (candidates.length === 0) {
      return;
    }

    const touchedCategoryIds = new Set<string>();
    for (const translation of candidates) {
      const nextSlug = await this.buildUniqueCategorySlug(
        buildBaseCategorySlug(translation.title),
        translation.locale,
        translation.categoryId,
      );
      if (nextSlug === translation.slug) {
        continue;
      }
      await db.categoryTranslation.update({
        where: { id: translation.id },
        data: { slug: nextSlug },
      });
      touchedCategoryIds.add(translation.categoryId);
    }

    if (touchedCategoryIds.size === 0) {
      return;
    }
    for (const categoryId of touchedCategoryIds) {
      await this.rebuildFullPathForSubtree(categoryId);
    }
    await invalidateCategoryPublicCaches();
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

  private isAncestorInGraph(
    ancestorId: string,
    descendantId: string,
    categoryGraph: CategoryGraph,
  ): boolean {
    let currentId: string | null = descendantId;
    let guard = 0;
    while (currentId && guard < MAX_CATEGORY_TREE_DEPTH) {
      guard += 1;
      const category = categoryGraph.get(currentId);
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

  private deriveExplicitCategoryIds(
    categoryIds: string[],
    categoryGraph: CategoryGraph,
  ): string[] {
    const uniqueValidIds = [...new Set(categoryIds)].filter((id) => categoryGraph.has(id));
    return uniqueValidIds.filter(
      (id) =>
        !uniqueValidIds.some(
          (otherId) => otherId !== id && this.isAncestorInGraph(id, otherId, categoryGraph),
        ),
    );
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
      const explicitCategoryIds = this.deriveExplicitCategoryIds(product.categoryIds, categoryGraph);
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
    await this.ensureLegacyCategorySlugsRepaired();
    const locale = this.normalizeLocale(localeInput);
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
    const categoryIdSet = new Set(categoryIds);
    const products = await db.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        primaryCategoryId: true,
        categoryIds: true,
      },
    });
    const directProductCountByCategoryId = new Map<string, number>(
      categoryIds.map((categoryId) => [categoryId, 0]),
    );

    for (const product of products) {
      const referencedCategoryIds = new Set(
        [product.primaryCategoryId, ...product.categoryIds].filter(
          (categoryId): categoryId is string =>
            typeof categoryId === "string" && categoryIdSet.has(categoryId),
        ),
      );
      referencedCategoryIds.forEach((categoryId) => {
        directProductCountByCategoryId.set(
          categoryId,
          (directProductCountByCategoryId.get(categoryId) ?? 0) + 1,
        );
      });
    }

    return {
      data: categories.map((category) =>
        this.mapCategory(
          {
            id: category.id,
            parentId: category.parentId,
            requiresSizes: category.requiresSizes,
            showInHeader: category.showInHeader,
            media: Array.isArray(category.media) ? category.media.filter((item): item is string => typeof item === "string") : [],
            translations: category.translations,
          },
          locale,
          directProductCountByCategoryId,
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
    const primaryTitle = entries[0]?.[1] ?? this.normalizeTitle(data.title);

    if (!primaryTitle) {
      throw this.buildProblemError(400, "Invalid title", "Category title cannot be empty");
    }

    if (data.parentId) {
      await this.ensureParentExists(data.parentId);
    }
    const normalizedMedia = this.normalizeCategoryMedia(data.media);

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
            seoTitle: this.normalizeOptionalText(data.seoTitle),
            seoDescription: this.normalizeOptionalText(data.seoDescription),
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
          showInHeader: reloaded.showInHeader,
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
  async getCategoryById(categoryId: string, localeInput?: string) {
    const locale = this.normalizeLocale(localeInput);
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
          showInHeader: category.showInHeader,
          media: Array.isArray(category.media) ? category.media.filter((item): item is string => typeof item === "string") : [],
          translations: category.translations,
        },
        locale,
      ),
      children: category.children.map((child) =>
        this.mapCategory(
          {
            id: child.id,
            parentId: child.parentId,
            requiresSizes: child.requiresSizes,
            showInHeader: child.showInHeader,
            media: Array.isArray(child.media) ? child.media.filter((item): item is string => typeof item === "string") : [],
            translations: child.translations,
          },
          locale,
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
    const currentChildIdsSorted = toSortedUniqueIds([...currentChildIds]);
    const nextSubcategoryIdsSorted =
      normalizedSubcategoryIds !== undefined ? toSortedUniqueIds(normalizedSubcategoryIds) : undefined;
    const parentChanged =
      data.parentId !== undefined && (data.parentId || null) !== category.parentId;
    const subcategoriesChanged =
      nextSubcategoryIdsSorted !== undefined &&
      !sameSortedIds(nextSubcategoryIdsSorted, currentChildIdsSorted);
    const removedChildIds =
      normalizedSubcategoryIds !== undefined
        ? [...currentChildIds].filter((childId) => !normalizedSubcategoryIds.includes(childId))
        : [];

    await db.$transaction(async (transaction) => {
      if (
        data.parentId !== undefined ||
        data.showInHeader !== undefined ||
        data.requiresSizes !== undefined ||
        normalizedMedia !== undefined
      ) {
        const categoryUpdateData: {
          parentId?: string | null;
          showInHeader?: boolean;
          requiresSizes?: boolean;
          media?: string[];
        } = {};
        if (data.parentId !== undefined) {
          categoryUpdateData.parentId = data.parentId || null;
        }
        if (data.showInHeader !== undefined) {
          categoryUpdateData.showInHeader = data.showInHeader;
        }
        if (data.requiresSizes !== undefined) {
          categoryUpdateData.requiresSizes = data.requiresSizes;
        }
        if (normalizedMedia !== undefined) {
          categoryUpdateData.media = normalizedMedia;
        }

        await transaction.category.update({
          where: { id: categoryId },
          data: categoryUpdateData,
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
            const translationUpdateData: {
              title?: string;
              seoTitle?: string | null;
              seoDescription?: string | null;
            } = {};
            if (nextTitle !== undefined) {
              translationUpdateData.title = nextTitle;
            }
            if (data.seoTitle !== undefined) {
              translationUpdateData.seoTitle = normalizedSeoTitle;
            }
            if (data.seoDescription !== undefined) {
              translationUpdateData.seoDescription = normalizedSeoDescription;
            }

            await transaction.categoryTranslation.update({
              where: { id: existingTranslation.id },
              data: translationUpdateData,
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

          const slug = await this.buildUniqueCategorySlug(
            buildBaseCategorySlug(nextTitle),
            targetLocale,
            categoryId,
          );
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
      parentChanged ||
      normalizedTitle !== undefined ||
      subcategoriesChanged;

    if (shouldRebuildCurrentSubtree) {
      await this.rebuildFullPathForSubtree(categoryId);
      for (const removedChildId of removedChildIds) {
        await this.rebuildFullPathForSubtree(removedChildId);
      }
    }

    const shouldReindexProductCategoryLinks =
      parentChanged || subcategoriesChanged;
    if (shouldReindexProductCategoryLinks) {
      await this.reindexProductCategoryLinksForCategoryTreeChange([
        categoryId,
        ...(normalizedSubcategoryIds ?? []),
        ...removedChildIds,
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
      data: this.mapCategory(
        {
          id: updatedCategory.id,
          parentId: updatedCategory.parentId,
          requiresSizes: updatedCategory.requiresSizes,
          showInHeader: updatedCategory.showInHeader,
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



