import type { CategoryGraph } from "@/lib/services/product-category-links.service";

export type SupportedCategoryLocale = "hy" | "en" | "ru";
export type CategoryMoveDirection = "up" | "down";
export type CategoryMoveScope = "roots" | "subcategories";

export type CategoryTranslation = {
  id: string;
  locale: string;
  title: string;
  slug: string;
  fullPath: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type CategoryNode = {
  id: string;
  parentId: string | null;
  showInHeader: boolean;
  requiresSizes: boolean;
  media: string[];
  translations: CategoryTranslation[];
};

export type CategoryResponseItem = {
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

export type ProblemError = {
  status: number;
  type: string;
  title: string;
  detail: string;
};

export type CategoryInput = {
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

export type CategoryUpdateInput = {
  title?: string;
  locale?: string;
  translations?: Partial<Record<SupportedCategoryLocale, string>>;
  parentId?: string | null;
  showInHeader?: boolean;
  requiresSizes?: boolean;
  media?: unknown;
  subcategoryIds?: string[];
  /** Required when a hierarchy edit would detach categories or promote to root. */
  confirmHierarchyChanges?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export function toSortedUniqueIds(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

export function sameSortedIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((id, index) => id === right[index]);
}

export function normalizeCategoryLocale(
  locale: string | undefined,
  defaultLocale: string,
  supportedLocales: readonly SupportedCategoryLocale[],
): string {
  const normalized = (locale ?? defaultLocale).trim().toLowerCase();
  if (normalized === "ka") {
    return "en";
  }
  return supportedLocales.includes(normalized as SupportedCategoryLocale)
    ? normalized
    : defaultLocale;
}

export function normalizeCategoryTitle(title: string): string {
  return title.trim();
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeCategoryMedia(media: unknown): string[] {
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

export function normalizeLocalizedTitles(
  translations: Partial<Record<SupportedCategoryLocale, string>> | undefined,
  supportedLocales: readonly SupportedCategoryLocale[],
): Partial<Record<SupportedCategoryLocale, string>> {
  if (!translations) {
    return {};
  }
  const normalized: Partial<Record<SupportedCategoryLocale, string>> = {};
  supportedLocales.forEach((locale) => {
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

export function buildCategoryTranslationsInput(args: {
  locale?: string;
  title?: string;
  translations?: Partial<Record<SupportedCategoryLocale, string>>;
  defaultLocale: string;
  supportedLocales: readonly SupportedCategoryLocale[];
}): Partial<Record<SupportedCategoryLocale, string>> {
  const normalized = normalizeLocalizedTitles(args.translations, args.supportedLocales);
  const legacyTitle = args.title?.trim();
  const normalizedLocale = normalizeCategoryLocale(
    args.locale,
    args.defaultLocale,
    args.supportedLocales,
  ) as SupportedCategoryLocale;
  if (legacyTitle && args.supportedLocales.includes(normalizedLocale)) {
    normalized[normalizedLocale] = legacyTitle;
  }
  return normalized;
}

export function resolveCategoryTranslation(
  translations: CategoryTranslation[],
  locale: string,
  defaultLocale: string,
): CategoryTranslation | null {
  const normalizedLocale = locale.trim().toLowerCase();
  return (
    translations.find((translation) => translation.locale === normalizedLocale) ??
    translations.find((translation) => translation.locale === defaultLocale) ??
    translations.find((translation) => translation.locale === "hy") ??
    translations.find((translation) => translation.locale === "ru") ??
    translations[0] ??
    null
  );
}

export function mapTranslationsByLocale(
  translations: CategoryTranslation[],
  supportedLocales: readonly SupportedCategoryLocale[],
): Partial<Record<SupportedCategoryLocale, string>> {
  const result: Partial<Record<SupportedCategoryLocale, string>> = {};
  translations.forEach((translation) => {
    const locale = translation.locale as SupportedCategoryLocale;
    if (supportedLocales.includes(locale)) {
      result[locale] = translation.title;
    }
  });
  return result;
}

export function mapCategory(
  category: CategoryNode,
  locale: string,
  defaultLocale: string,
  supportedLocales: readonly SupportedCategoryLocale[],
  productCountByCategoryId?: Map<string, number>,
): CategoryResponseItem {
  const translation = resolveCategoryTranslation(category.translations, locale, defaultLocale);
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
    translations: mapTranslationsByLocale(category.translations, supportedLocales),
  };
}

export function isAncestorInGraph(
  ancestorId: string,
  descendantId: string,
  categoryGraph: CategoryGraph,
  maxDepth: number,
): boolean {
  let currentId: string | null = descendantId;
  let guard = 0;
  while (currentId && guard < maxDepth) {
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

export function deriveExplicitCategoryIds(
  categoryIds: string[],
  categoryGraph: CategoryGraph,
  maxDepth: number,
): string[] {
  const uniqueValidIds = [...new Set(categoryIds)].filter((id) => categoryGraph.has(id));
  return uniqueValidIds.filter(
    (id) =>
      !uniqueValidIds.some(
        (otherId) => otherId !== id && isAncestorInGraph(id, otherId, categoryGraph, maxDepth),
      ),
  );
}
