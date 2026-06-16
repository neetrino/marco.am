import { buildBaseCategorySlug } from "@/lib/services/admin/admin-categories.helpers";
import {
  buildCategoryTranslationsInput,
  normalizeCategoryLocale,
  normalizeCategoryMedia,
  normalizeCategoryTitle,
  normalizeOptionalText,
  sameSortedIds,
  toSortedUniqueIds,
  type CategoryUpdateInput,
  type ProblemError,
  type SupportedCategoryLocale,
} from "@/lib/services/admin/admin-categories.shared";
import type { PrismaTransactionClient } from "@/lib/types/prisma";

export type LoadedCategoryForUpdate = {
  id: string;
  parentId: string | null;
  translations: Array<{ id: string; locale: string }>;
  children: Array<{ id: string }>;
};

export type PreparedCategoryUpdate = {
  locale: string;
  normalizedTitle: string | undefined;
  translationTitles: Partial<Record<SupportedCategoryLocale, string>>;
  hasBulkTranslations: boolean;
  hasTranslationPayload: boolean;
  normalizedSubcategoryIds: string[] | undefined;
  normalizedMedia: string[] | undefined;
  parentChanged: boolean;
  subcategoriesChanged: boolean;
  removedChildIds: string[];
};

export function prepareCategoryUpdateData(args: {
  category: LoadedCategoryForUpdate;
  categoryId: string;
  data: CategoryUpdateInput;
  defaultLocale: string;
  supportedLocales: readonly SupportedCategoryLocale[];
  buildProblemError: (status: number, title: string, detail: string) => ProblemError;
}): PreparedCategoryUpdate {
  const locale = normalizeCategoryLocale(
    args.data.locale,
    args.defaultLocale,
    args.supportedLocales,
  );
  const normalizedTitle =
    args.data.title !== undefined ? normalizeCategoryTitle(args.data.title) : undefined;
  if (normalizedTitle !== undefined && normalizedTitle.length === 0) {
    throw args.buildProblemError(400, "Invalid title", "Category title cannot be empty");
  }

  const translationTitles = buildCategoryTranslationsInput({
    locale: args.data.locale,
    title: args.data.title,
    translations: args.data.translations,
    defaultLocale: args.defaultLocale,
    supportedLocales: args.supportedLocales,
  });
  const hasBulkTranslations = Object.keys(translationTitles).length > 0;
  const hasTranslationPayload =
    normalizedTitle !== undefined ||
    args.data.seoTitle !== undefined ||
    args.data.seoDescription !== undefined ||
    hasBulkTranslations;
  const normalizedSubcategoryIds =
    args.data.subcategoryIds !== undefined
      ? [...new Set(args.data.subcategoryIds.filter((id) => id && id !== args.categoryId))]
      : undefined;
  const normalizedMedia =
    args.data.media !== undefined ? normalizeCategoryMedia(args.data.media) : undefined;

  const currentChildIds = new Set(args.category.children.map((child) => child.id));
  const currentChildIdsSorted = toSortedUniqueIds([...currentChildIds]);
  const nextSubcategoryIdsSorted =
    normalizedSubcategoryIds !== undefined
      ? toSortedUniqueIds(normalizedSubcategoryIds)
      : undefined;
  const parentChanged =
    args.data.parentId !== undefined &&
    (args.data.parentId || null) !== args.category.parentId;
  const subcategoriesChanged =
    nextSubcategoryIdsSorted !== undefined &&
    !sameSortedIds(nextSubcategoryIdsSorted, currentChildIdsSorted);
  const removedChildIds =
    normalizedSubcategoryIds !== undefined
      ? [...currentChildIds].filter(
          (childId) => !normalizedSubcategoryIds.includes(childId),
        )
      : [];

  return {
    locale,
    normalizedTitle,
    translationTitles,
    hasBulkTranslations,
    hasTranslationPayload,
    normalizedSubcategoryIds,
    normalizedMedia,
    parentChanged,
    subcategoriesChanged,
    removedChildIds,
  };
}

export function buildCategoryUpdatePatch(
  data: CategoryUpdateInput,
  normalizedMedia: string[] | undefined,
): {
  parentId?: string | null;
  showInHeader?: boolean;
  requiresSizes?: boolean;
  media?: string[];
} | null {
  const needsPatch =
    data.parentId !== undefined ||
    data.showInHeader !== undefined ||
    data.requiresSizes !== undefined ||
    normalizedMedia !== undefined;
  if (!needsPatch) {
    return null;
  }

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
  return categoryUpdateData;
}

export async function upsertCategoryTranslations(
  tx: PrismaTransactionClient,
  args: {
    categoryId: string;
    data: CategoryUpdateInput;
    locale: string;
    hasBulkTranslations: boolean;
    translationTitles: Partial<Record<SupportedCategoryLocale, string>>;
    category: LoadedCategoryForUpdate;
    supportedLocales: readonly SupportedCategoryLocale[];
    buildProblemError: (status: number, title: string, detail: string) => ProblemError;
    buildUniqueCategorySlug: (
      baseSlug: string,
      locale: string,
      excludeCategoryId?: string,
    ) => Promise<string>;
  },
): Promise<void> {
  const normalizedSeoTitle = normalizeOptionalText(args.data.seoTitle ?? undefined);
  const normalizedSeoDescription = normalizeOptionalText(
    args.data.seoDescription ?? undefined,
  );
  const targetLocales = args.hasBulkTranslations
    ? args.supportedLocales.filter(
        (supportedLocale) => args.translationTitles[supportedLocale],
      )
    : [args.locale as SupportedCategoryLocale];

  if (targetLocales.length === 0) {
    throw args.buildProblemError(
      400,
      "Missing title",
      "At least one localized category title is required",
    );
  }

  for (const targetLocale of targetLocales) {
    const nextTitle = args.translationTitles[targetLocale];
    const existingTranslation = args.category.translations.find(
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
      if (args.data.seoTitle !== undefined) {
        translationUpdateData.seoTitle = normalizedSeoTitle;
      }
      if (args.data.seoDescription !== undefined) {
        translationUpdateData.seoDescription = normalizedSeoDescription;
      }

      await tx.categoryTranslation.update({
        where: { id: existingTranslation.id },
        data: translationUpdateData,
      });
      continue;
    }

    if (!nextTitle) {
      throw args.buildProblemError(
        400,
        "Missing title",
        `Category translation for locale '${targetLocale}' requires title when creating a new translation`,
      );
    }

    const slug = await args.buildUniqueCategorySlug(
      buildBaseCategorySlug(nextTitle),
      targetLocale,
      args.categoryId,
    );
    await tx.categoryTranslation.create({
      data: {
        categoryId: args.categoryId,
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

/**
 * Reconciles a parent's child set using a precise diff.
 *
 * Only children that were attached to this category and are absent from the new
 * set are detached; only genuinely new ids are attached. This avoids the
 * previous "detach every child to root, then re-attach" behavior, which
 * silently orphaned the whole subtree whenever a caller sent an incomplete or
 * stale `subcategoryIds` list — the root cause of the flattened taxonomy.
 */
export async function applySubcategoryAssignments(
  tx: PrismaTransactionClient,
  categoryId: string,
  normalizedSubcategoryIds: string[] | undefined,
): Promise<void> {
  if (normalizedSubcategoryIds === undefined) {
    return;
  }

  const nextChildIds = new Set(normalizedSubcategoryIds);
  const currentChildren = await tx.category.findMany({
    where: { parentId: categoryId, deletedAt: null },
    select: { id: true },
  });

  const idsToDetach = currentChildren
    .map((child) => child.id)
    .filter((id) => !nextChildIds.has(id));
  if (idsToDetach.length > 0) {
    await tx.category.updateMany({
      where: { id: { in: idsToDetach } },
      data: { parentId: null },
    });
  }

  const currentChildIds = new Set(currentChildren.map((child) => child.id));
  const idsToAttach = normalizedSubcategoryIds.filter((id) => !currentChildIds.has(id));
  if (idsToAttach.length > 0) {
    await tx.category.updateMany({
      where: { id: { in: idsToAttach } },
      data: { parentId: categoryId },
    });
  }
}
