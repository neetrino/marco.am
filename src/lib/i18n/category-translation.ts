import categoryTitleMap from '../../../shared/db/scripts/category-title-translations.json';
import type { ApiLocale } from '@/lib/i18n/api-locale';
import { normalizeApiLocale } from '@/lib/i18n/api-locale';

const IMPORT_SUFFIX = ' (import)';
const ARMENIAN_REGEX = /[\u0531-\u058F]/;

type LocaleTriple = { hy: string; en: string; ru: string };

const TITLE_MAP = categoryTitleMap as Record<string, LocaleTriple>;

export type CategoryTranslationRow = {
  locale: string;
  title: string;
  slug: string;
  fullPath?: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

function normalizeCategorySourceTitle(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.endsWith(IMPORT_SUFFIX)) {
    return trimmed.slice(0, -IMPORT_SUFFIX.length).trim();
  }
  return trimmed;
}

function isArmenianText(value: string): boolean {
  return ARMENIAN_REGEX.test(value);
}

function buildLocaleFallbackOrder(lang: string): readonly ApiLocale[] {
  const normalized = normalizeApiLocale(lang) ?? 'en';
  if (normalized === 'hy') {
    return ['hy', 'ru', 'en'];
  }
  if (normalized === 'ru') {
    return ['ru', 'hy', 'en'];
  }
  return ['en', 'hy', 'ru'];
}

function lookupMappedTitle(sourceHyTitle: string, lang: ApiLocale): string | null {
  const mapped = TITLE_MAP[normalizeCategorySourceTitle(sourceHyTitle)];
  if (!mapped) {
    return null;
  }
  return mapped[lang] ?? null;
}

/**
 * Resolves a category translation row for storefront display.
 * Uses DB translations with locale fallback, then the static title map keyed by Armenian title.
 */
export function resolveCategoryTranslation<T extends CategoryTranslationRow>(
  translations: readonly T[],
  lang: string,
): T | null {
  if (translations.length === 0) {
    return null;
  }

  const targetLocale = normalizeApiLocale(lang) ?? 'en';
  const fallbackOrder = buildLocaleFallbackOrder(targetLocale);

  let matched: T | undefined;
  for (const locale of fallbackOrder) {
    const row = translations.find((item) => item.locale === locale);
    if (row) {
      matched = row;
      break;
    }
  }
  matched ??= translations[0];

  const hyRow =
    translations.find((item) => item.locale === 'hy') ??
    translations.find((item) => isArmenianText(item.title));

  const slugRow =
    matched.slug.trim().length > 0
      ? matched
      : hyRow && hyRow.slug.trim().length > 0
        ? hyRow
        : matched;

  let title = matched.title;
  const hySourceTitle = hyRow?.title ?? (isArmenianText(matched.title) ? matched.title : '');

  if (targetLocale !== 'hy' && hySourceTitle) {
    const mappedTitle = lookupMappedTitle(hySourceTitle, targetLocale);
    if (mappedTitle) {
      title = mappedTitle;
    } else if (isArmenianText(title) && targetLocale === 'en') {
      const enRow = translations.find((item) => item.locale === 'en');
      if (enRow && !isArmenianText(enRow.title)) {
        title = enRow.title;
      }
    } else if (isArmenianText(title) && targetLocale === 'ru') {
      const ruRow = translations.find((item) => item.locale === 'ru');
      if (ruRow && !isArmenianText(ruRow.title)) {
        title = ruRow.title;
      }
    }
  }

  return {
    ...matched,
    title,
    slug: slugRow.slug,
    fullPath: slugRow.fullPath ?? matched.fullPath ?? '',
  };
}
