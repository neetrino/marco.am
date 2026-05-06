'use client';

import { ChevronRight } from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { LanguagePreferenceContext } from '../../lib/language-context';
import type { Category } from './category-nav-types';
import { CategoryMegaSubcategoryPills } from './CategoryMegaSubcategoryPills';
import { CategoryDropdownPromoBanner } from './CategoryDropdownPromoBanner';
import { dedupeCategories, normalizeCategoryKey, prepareRootCategoriesForNav } from './categoryNavList';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { headerCategoryNavFont } from './headerCategoryNavTypography';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../lib/utils/image-utils';

function isTechAndElectronicsCategory(value: string): boolean {
  const normalized = normalizeCategoryKey(value);
  return normalized.includes('տեխնիկա') && normalized.includes('էլեկտրոն');
}

/** Left mega-rail root category row — keep img attrs in sync with `h-[…] w-[…]` on the image. */
const MEGA_ROOT_ICON_INNER_PX = 34;
/** Lucide `size` inside `size-[48px]` icon wrap. */
const MEGA_ROOT_LUCIDE_PX = 34;

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

  const selected = categoriesWithExtra.find((c) => c.slug === selectedSlug) ?? categoriesWithExtra[0];
  if (!selected) {
    return null;
  }

  const preview = resolveCategoryNavPresentation(selected.slug, selected.title, lang);
  const isTechAndElectronics =
    isTechAndElectronicsCategory(preview.title) || isTechAndElectronicsCategory(selected.title);
  const showPromoBanner = !isTechAndElectronics;

  return (
    <div className="flex h-full max-h-full min-h-0 w-full min-w-0 flex-1 flex-col divide-y divide-marco-border overflow-hidden rounded-[13px] bg-white ring-1 ring-black/15 shadow-2xl md:min-h-0 md:flex-row md:divide-y-0">
      {/* Left rail: fixed width on md+; h-full + inner min-h-0 scroll region so category list always scrolls inside the panel (flex min-height:auto cannot steal height). */}
      <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-t-[13px] bg-marco-gray md:min-h-0 md:w-[400px] md:min-w-[400px] md:max-w-[400px] md:flex-none md:shrink-0 md:rounded-l-[13px] md:rounded-r-none md:rounded-t-none md:border-r-2 md:border-r-neutral-400">
        <nav
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden py-6 pl-4 pr-0 md:py-[29px] md:pl-[25px] md:pr-0"
          aria-label={t('common.navigation.categories')}
        >
          <div className="flex min-h-0 flex-1 basis-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-gutter:auto] touch-pan-y scroll-pb-header-mega-category-scroll-end pb-header-mega-category-scroll-end pr-0">
          <div className="flex flex-col gap-[18px] pr-2 md:pr-2.5">
          {categoriesWithExtra.map((category) => {
            const isSelected = category.slug === selectedSlug;
            const row = resolveCategoryNavPresentation(category.slug, category.title, lang);
            const RowLucide = row.icon.kind === 'lucide' ? row.icon.Icon : null;
            const categoryImage = toSafeImgAttributeSrc(category.media?.[0] ?? null);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedSlug(category.slug)}
                className={`${headerCategoryNavFont.className} flex w-full min-w-0 shrink-0 items-center gap-3 rounded-[40px] px-2 py-0 text-left text-[15px] leading-[21px] tracking-[0.15px] transition-[opacity,background-color,color] duration-150 ${
                  isSelected
                    ? 'bg-marco-yellow font-bold !text-[#050505] dark:!text-[#050505]'
                    : 'font-normal !text-[#050505] dark:!text-[#050505] hover:bg-white/35'
                }`}
              >
                <span className="flex size-[48px] shrink-0 items-center justify-center p-1.5 !text-[#050505] dark:!text-[#050505]">
                  {categoryImage ? (
                    <img
                      src={toDomSafeImgSrcString(categoryImage)}
                      alt=""
                      width={MEGA_ROOT_ICON_INNER_PX}
                      height={MEGA_ROOT_ICON_INNER_PX}
                      className="h-[34px] w-[34px] shrink-0 object-contain"
                      draggable={false}
                    />
                  ) : row.icon.kind === 'figma' ? (
                    <img
                      src={row.icon.src}
                      alt=""
                      width={MEGA_ROOT_ICON_INNER_PX}
                      height={MEGA_ROOT_ICON_INNER_PX}
                      className="h-[34px] w-[34px] shrink-0 object-contain brightness-0"
                      draggable={false}
                    />
                  ) : (
                    RowLucide && (
                      <RowLucide
                        size={MEGA_ROOT_LUCIDE_PX}
                        className="shrink-0 !text-[#050505] dark:!text-[#050505]"
                        strokeWidth={1.35}
                        aria-hidden
                      />
                    )
                  )}
                </span>
                <span className="min-w-0 flex-1 hyphens-auto py-2 pr-1 text-left [overflow-wrap:anywhere] break-words whitespace-normal">
                  {row.title}
                </span>
                <ChevronRight
                  className="size-[18px] shrink-0 self-center text-[#050505]/55 dark:text-[#050505]/55 md:size-5"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            );
          })}
          </div>
          </div>
        </nav>
      </div>

      {/* Right column: promo (fixed height) + scrollable subcategory list inside flex min-h-0. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden rounded-b-[13px] bg-white px-5 pb-5 pt-6 md:rounded-b-none md:rounded-r-[13px] md:border-r-2 md:border-r-neutral-400 md:pl-6 md:pr-5 md:pt-6">
        {showPromoBanner ? (
          <div className="shrink-0">
            <CategoryDropdownPromoBanner
              badge={preview.promo.badge}
              headline={preview.promo.headline}
              subline={preview.promo.subline}
              href={`/products?category=${selected.slug}`}
              onNavigate={onClose}
              ctaLabel={t('common.buttons.shopNow')}
            />
          </div>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <CategoryMegaSubcategoryPills
            sectionHeadingId={`mega-menu-subcats-${selected.id}`}
            sectionTitle={preview.title.toUpperCase()}
            items={dedupeCategories(selected.children, lang)}
            lang={lang}
            productsWord={t('common.navigation.categoriesMegaMenu.productsWord')}
            emptyMessage={t('common.navigation.categoriesMegaMenu.emptySubcategories')}
            onNavigate={onClose}
          />
        </div>
      </div>
    </div>
  );
}
