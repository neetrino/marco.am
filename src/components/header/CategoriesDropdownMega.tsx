'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { LanguagePreferenceContext } from '../../lib/language-context';
import type { Category } from './category-nav-types';
import { CategoryMegaSubcategoryPills } from './CategoryMegaSubcategoryPills';
import { CategoryDropdownPromoBanner } from './CategoryDropdownPromoBanner';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { headerCategoryNavFont } from './headerCategoryNavTypography';

function normalizeCategoryKey(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ');
}

function isTechAndElectronicsCategory(value: string): boolean {
  const normalized = normalizeCategoryKey(value);
  return normalized.includes('տեխնիկա') && normalized.includes('էլեկտրոն');
}

const HIDDEN_ROOT_CATEGORY_TITLES = new Set<string>([
  normalizeCategoryKey('Ջրի դիսպենսերներ'),
  normalizeCategoryKey('Կենցաղային տեխնիկա'),
  normalizeCategoryKey('Խոհանոցային տեխնիկա'),
  normalizeCategoryKey('Կահույքի պատրաստման պարագաներ'),
  normalizeCategoryKey('Խոշոր կենցաղային տեխնիկա'),
  normalizeCategoryKey('Աուդիո և վիդեո համակարգեր'),
]);

function isHiddenRootCategory(category: Category, lang: string): boolean {
  const presentation = resolveCategoryNavPresentation(category.slug, category.title, lang);
  const presentationTitleKey = normalizeCategoryKey(presentation.title);
  const apiTitleKey = normalizeCategoryKey(category.title);
  return HIDDEN_ROOT_CATEGORY_TITLES.has(presentationTitleKey) || HIDDEN_ROOT_CATEGORY_TITLES.has(apiTitleKey);
}

function childrenCount(category: Category): number {
  return category.children.length;
}

function shouldReplaceCategory(existing: Category, candidate: Category): boolean {
  const existingCount = childrenCount(existing);
  const candidateCount = childrenCount(candidate);
  if (existingCount === 0 && candidateCount > 0) {
    return true;
  }
  return candidateCount > existingCount;
}

function dedupeCategories(categories: Category[], lang: string): Category[] {
  const keyToIndex = new Map<string, number>();
  const result: Category[] = [];

  for (const category of categories) {
    const presentation = resolveCategoryNavPresentation(category.slug, category.title, lang);
    const key = normalizeCategoryKey(presentation.title);

    const existingIndex = keyToIndex.get(key);
    if (existingIndex === undefined) {
      keyToIndex.set(key, result.length);
      result.push(category);
      continue;
    }
    if (shouldReplaceCategory(result[existingIndex], category)) {
      result[existingIndex] = category;
    }
  }

  return result;
}

export function CategoriesDropdownMega({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const lang = useContext(LanguagePreferenceContext);
  const { t } = useTranslation();
  const categoriesWithExtra = useMemo(
    () => dedupeCategories(categories.filter((category) => !isHiddenRootCategory(category, lang)), lang),
    [categories, lang]
  );
  const [selectedSlug, setSelectedSlug] = useState<string>(() => categoriesWithExtra[0]?.slug ?? '');

  useEffect(() => {
    if (categoriesWithExtra.length === 0) {
      return;
    }
    setSelectedSlug((prev) =>
      prev && categoriesWithExtra.some((c) => c.slug === prev) ? prev : categoriesWithExtra[0].slug
    );
  }, [categoriesWithExtra]);

  const selected = categoriesWithExtra.find((c) => c.slug === selectedSlug) ?? categoriesWithExtra[0];
  if (!selected) {
    return null;
  }

  const preview = resolveCategoryNavPresentation(selected.slug, selected.title, lang);
  const isTechAndElectronics =
    isTechAndElectronicsCategory(preview.title) || isTechAndElectronicsCategory(selected.title);
  const showPromoBanner = !isTechAndElectronics;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col divide-y divide-marco-border overflow-hidden rounded-[13px] bg-marco-gray shadow-2xl md:flex-row md:divide-x md:divide-y-0">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[16px] overflow-y-auto rounded-t-[13px] bg-marco-gray py-6 pl-4 pr-2 md:h-full md:w-[400px] md:min-w-[400px] md:max-w-[400px] md:flex-none md:rounded-l-[13px] md:rounded-r-[13px] md:rounded-t-none md:py-[29px] md:pl-[25px] md:pr-[25px]">
        {categoriesWithExtra.map((category, index) => {
          const isSelected = category.slug === selectedSlug;
          const row = resolveCategoryNavPresentation(category.slug, category.title, lang);
          const RowLucide = row.icon.kind === 'lucide' ? row.icon.Icon : null;
          const titleParts = row.title.trim().split(/\s+/);
          const canSplitLastWord = index === 0 && titleParts.length > 1;
          const firstLineTitle = canSplitLastWord ? titleParts.slice(0, -1).join(' ') : row.title;
          const secondLineTitle = canSplitLastWord ? titleParts[titleParts.length - 1] : '';

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedSlug(category.slug)}
              className={`${headerCategoryNavFont.className} flex w-full min-w-0 items-center gap-1.5 rounded-[35px] px-[7px] py-0 text-left text-[14px] leading-[19px] tracking-[0.14px] transition-[opacity,background-color,color] duration-150 ${
                isSelected
                  ? 'bg-marco-yellow font-bold !text-[#050505] dark:!text-[#050505]'
                  : 'font-normal text-[#5d7285] hover:opacity-90'
              }`}
            >
              <span className="flex size-[42px] shrink-0 items-center justify-center p-[5px] text-marco-black">
                {row.icon.kind === 'figma' ? (
                  <img
                    src={row.icon.src}
                    alt=""
                    width={30}
                    height={30}
                    className="h-[30px] w-[30px] shrink-0 object-contain"
                    draggable={false}
                  />
                ) : (
                  RowLucide && (
                    <RowLucide size={30} className="shrink-0" strokeWidth={1.35} aria-hidden />
                  )
                )}
              </span>
              <span
                className={`min-w-0 flex-1 py-[7px] pr-1 ${
                  canSplitLastWord ? 'whitespace-normal leading-[18px]' : 'whitespace-nowrap'
                }`}
              >
                {canSplitLastWord ? (
                  <>
                    <span>{firstLineTitle}</span>
                    <span className="block">{secondLineTitle}</span>
                  </>
                ) : (
                  row.title
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-y-auto rounded-b-[13px] bg-white px-5 pb-5 pt-6 md:rounded-b-none md:rounded-r-[13px] md:pl-6 md:pr-5 md:pt-6">
        {showPromoBanner && (
          <CategoryDropdownPromoBanner
            badge={preview.promo.badge}
            headline={preview.promo.headline}
            subline={preview.promo.subline}
            href={`/products?category=${selected.slug}`}
            onNavigate={onClose}
            ctaLabel={t('common.buttons.shopNow')}
          />
        )}
        <CategoryMegaSubcategoryPills
          sectionTitle={preview.title.toUpperCase()}
          items={dedupeCategories(selected.children, lang)}
          lang={lang}
          productsWord={t('common.navigation.categoriesMegaMenu.productsWord')}
          emptyMessage={t('common.navigation.categoriesMegaMenu.emptySubcategories')}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}
