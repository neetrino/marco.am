'use client';

import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { LanguagePreferenceContext } from '../../lib/language-context';
import type { Category } from './category-nav-types';
import { CategoryMegaSubcategoryPills } from './CategoryMegaSubcategoryPills';
import { CategoryDropdownPromoBanner } from './CategoryDropdownPromoBanner';
import { dedupeCategories, normalizeCategoryKey, prepareRootCategoriesForNav } from './categoryNavList';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { headerCategoryNavFont } from './headerCategoryNavTypography';

function isTechAndElectronicsCategory(value: string): boolean {
  const normalized = normalizeCategoryKey(value);
  return normalized.includes('տեխնիկա') && normalized.includes('էլեկտրոն');
}

const SCROLL_EDGE_EPS = 3;

function readCategoryListNeedsScroll(el: HTMLDivElement) {
  const { scrollHeight, clientHeight } = el;
  return { needsScroll: scrollHeight - clientHeight > SCROLL_EDGE_EPS };
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
    () => prepareRootCategoriesForNav(categories, lang),
    [categories, lang],
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

  const categoryListRef = useRef<HTMLDivElement>(null);
  const [listScroll, setListScroll] = useState({ needsScroll: false });

  const syncListScrollEdges = useCallback(() => {
    const el = categoryListRef.current;
    if (!el) {
      return;
    }
    setListScroll(readCategoryListNeedsScroll(el));
  }, []);

  useLayoutEffect(() => {
    syncListScrollEdges();
  }, [categoriesWithExtra, syncListScrollEdges]);

  useEffect(() => {
    const el = categoryListRef.current;
    if (!el) {
      return;
    }
    const ro = new ResizeObserver(syncListScrollEdges);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [categoriesWithExtra, syncListScrollEdges]);

  const selected = categoriesWithExtra.find((c) => c.slug === selectedSlug) ?? categoriesWithExtra[0];
  if (!selected) {
    return null;
  }

  const preview = resolveCategoryNavPresentation(selected.slug, selected.title, lang);
  const isTechAndElectronics =
    isTechAndElectronicsCategory(preview.title) || isTechAndElectronicsCategory(selected.title);
  const showPromoBanner = !isTechAndElectronics;

  return (
    <div className="flex h-full max-h-full min-h-0 w-full min-w-0 flex-1 flex-col divide-y divide-marco-border overflow-hidden rounded-[13px] bg-marco-gray shadow-2xl md:min-h-0 md:flex-row md:divide-x md:divide-y-0">
      {/* Left rail: fixed width on md+; h-full + inner min-h-0 scroll region so category list always scrolls inside the panel (flex min-height:auto cannot steal height). */}
      <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-t-[13px] bg-marco-gray md:min-h-0 md:w-[400px] md:min-w-[400px] md:max-w-[400px] md:flex-none md:shrink-0 md:rounded-l-[13px] md:rounded-r-[13px] md:rounded-t-none">
        <nav
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden py-6 pl-4 pr-2 md:py-[29px] md:pl-[25px] md:pr-[25px]"
          aria-label={t('common.navigation.categories')}
        >
          <div
            ref={categoryListRef}
            className={`flex min-h-0 flex-1 basis-0 flex-col gap-[16px] overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] touch-pan-y scroll-pb-header-mega-category-scroll-end pb-header-mega-category-scroll-end ${
              listScroll.needsScroll ? 'pr-10 md:pr-12' : ''
            }`}
          >
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
                className={`${headerCategoryNavFont.className} flex w-full min-w-0 shrink-0 items-center gap-1.5 rounded-[35px] px-[7px] py-0 text-left text-[14px] leading-[19px] tracking-[0.14px] transition-[opacity,background-color,color] duration-150 ${
                  isSelected
                    ? 'bg-marco-yellow font-bold !text-[#050505] dark:!text-[#050505]'
                    : 'font-normal !text-[#050505] dark:!text-[#050505] hover:opacity-90'
                }`}
              >
                <span className="flex size-[42px] shrink-0 items-center justify-center p-[5px] !text-[#050505] dark:!text-[#050505]">
                  {row.icon.kind === 'figma' ? (
                    <img
                      src={row.icon.src}
                      alt=""
                      width={30}
                      height={30}
                      className="h-[30px] w-[30px] shrink-0 object-contain brightness-0"
                      draggable={false}
                    />
                  ) : (
                    RowLucide && (
                      <RowLucide
                        size={30}
                        className="shrink-0 !text-[#050505] dark:!text-[#050505]"
                        strokeWidth={1.35}
                        aria-hidden
                      />
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
        </nav>
      </div>

      {/* No column scroll here: only the root (left) list scrolls; avoids nested scroll areas. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden rounded-b-[13px] bg-white px-5 pb-5 pt-6 md:rounded-b-none md:rounded-r-[13px] md:pl-6 md:pr-5 md:pt-6">
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
