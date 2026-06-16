'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { LanguagePreferenceContext } from '../../lib/language-context';
import type { Category } from './category-nav-types';
import { CategoryMegaSubcategoryPills } from './CategoryMegaSubcategoryPills';
import { CategoryDropdownPromoBanner } from './CategoryDropdownPromoBanner';
import {
  normalizeCategoryKey,
  prepareMegaMenuSubcategoryGroups,
  prepareRootCategoriesForNav,
} from './categoryNavList';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { headerCategoryNavFont } from './headerCategoryNavTypography';
import { useMegaMenuBranch, useMegaMenuRoots } from './useMegaMenuCategories';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../lib/utils/image-utils';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

function isTechAndElectronicsCategory(value: string): boolean {
  const normalized = normalizeCategoryKey(value);
  return normalized.includes('տեխնիկա') && normalized.includes('էլեկտրոն');
}

/** Left mega-rail root category row — keep img attrs in sync with `h-[…] w-[…]` on the image. */
const MEGA_ROOT_ICON_INNER_PX = 34;
/** Lucide `size` inside `size-[48px]` icon wrap. */
const MEGA_ROOT_LUCIDE_PX = 34;

const MEGA_ROOT_ROW_CLASS =
  `${headerCategoryNavFont.className} flex w-full min-w-0 shrink-0 cursor-pointer items-center gap-3 rounded-[40px] px-2 py-0 text-left text-[13px] leading-[21px] tracking-[0.15px] transition-[background-color,color,opacity] duration-150`;

export function CategoriesDropdownMega({
  menuOpen,
  onClose,
}: {
  menuOpen: boolean;
  onClose: () => void;
}) {
  const lang = useContext(LanguagePreferenceContext);
  const { t } = useTranslation();
  const rootsQuery = useMegaMenuRoots(menuOpen, lang);
  const categoriesWithExtra = useMemo(
    () => prepareRootCategoriesForNav(rootsQuery.data ?? [], lang),
    [rootsQuery.data, lang],
  );
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const rightScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categoriesWithExtra.length === 0) {
      return;
    }
    setSelectedSlug((prev) =>
      prev && categoriesWithExtra.some((c) => c.slug === prev) ? prev : categoriesWithExtra[0].slug,
    );
  }, [categoriesWithExtra]);

  useEffect(() => {
    rightScrollRef.current?.scrollTo(0, 0);
  }, [selectedSlug]);

  const branchQuery = useMegaMenuBranch(menuOpen, selectedSlug || null, lang);
  const selectedBranch = branchQuery.data;
  const selected =
    categoriesWithExtra.find((category) => category.slug === selectedSlug) ?? categoriesWithExtra[0];

  const subcategoryGroups = useMemo(
    () => (selectedBranch ? prepareMegaMenuSubcategoryGroups(selectedBranch, lang) : []),
    [selectedBranch, lang],
  );

  if (rootsQuery.isLoading) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-[#5d7285] dark:text-zinc-300">
        {t('common.messages.loading')}
      </div>
    );
  }

  if (!selected) {
    return null;
  }

  const preview = resolveCategoryNavPresentation(selected.slug, selected.title, lang);
  const isTechAndElectronics =
    isTechAndElectronicsCategory(preview.title) || isTechAndElectronicsCategory(selected.title);
  const showPromoBanner = !isTechAndElectronics;
  const sectionProductCount = selectedBranch?.productCount ?? selected.productCount;

  return (
    <div className="flex h-full max-h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-white md:min-h-0 md:flex-row">
      <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden border-r border-black/[0.08] md:min-h-0 md:w-[400px] md:min-w-[400px] md:max-w-[400px] md:flex-none md:shrink-0 dark:border-white/10">
        <nav
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden py-6 pl-5 pr-0 md:py-[29px] md:pl-8 md:pr-0"
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
                    className={`${MEGA_ROOT_ROW_CLASS} ${
                      isSelected
                        ? 'bg-marco-yellow font-bold !text-[#383838] dark:!text-[#383838]'
                        : 'font-normal !text-[#383838] hover:bg-marco-gray/70 dark:!text-[#383838]'
                    }`}
                  >
                    <span className="flex size-[48px] shrink-0 items-center justify-center p-1.5 !text-[#383838] dark:!text-[#383838]">
                      {categoryImage ? (
                        <Image
                          src={toDomSafeImgSrcString(categoryImage)}
                          alt=""
                          width={MEGA_ROOT_ICON_INNER_PX}
                          height={MEGA_ROOT_ICON_INNER_PX}
                          className="h-[34px] w-[34px] shrink-0 object-contain"
                          draggable={false}
                          loading="lazy"
                          unoptimized={shouldBypassNextImageOptimizer(categoryImage)}
                        />
                      ) : row.icon.kind === 'figma' ? (
                        <Image
                          src={row.icon.src}
                          alt=""
                          width={MEGA_ROOT_ICON_INNER_PX}
                          height={MEGA_ROOT_ICON_INNER_PX}
                          className="h-[34px] w-[34px] shrink-0 object-contain brightness-0"
                          draggable={false}
                          loading="lazy"
                          unoptimized={shouldBypassNextImageOptimizer(row.icon.src)}
                        />
                      ) : (
                        RowLucide && (
                          <RowLucide
                            size={MEGA_ROOT_LUCIDE_PX}
                            className="shrink-0 !text-[#383838] dark:!text-[#383838]"
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
                      className="size-[18px] shrink-0 self-center text-[#383838]/55 dark:text-[#383838]/55 md:size-5"
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

      <div
        ref={rightScrollRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y bg-white px-5 pb-6 pt-4 md:px-8 md:pb-8 md:pt-5"
      >
        {showPromoBanner ? (
          <CategoryDropdownPromoBanner
            badge={preview.promo.badge}
            headline={preview.promo.headline}
            subline={preview.promo.subline}
            href={`/products?category=${selected.slug}`}
            onNavigate={onClose}
            ctaLabel={t('common.buttons.shopNow')}
          />
        ) : null}
        <CategoryMegaSubcategoryPills
          sectionHeadingId={`mega-menu-subcats-${selected.id}`}
          sectionTitle={preview.title.toUpperCase()}
          sectionProductCount={sectionProductCount}
          groups={subcategoryGroups}
          lang={lang}
          onNavigate={onClose}
          loading={branchQuery.isLoading && !selectedBranch}
        />
      </div>
    </div>
  );
}
