'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { LanguagePreferenceContext } from '../../lib/language-context';
import type { Category } from './category-nav-types';
import { CategoryMegaSubcategoryPills } from './CategoryMegaSubcategoryPills';
import { CategoryDropdownPromoBanner } from './CategoryDropdownPromoBanner';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { headerCategoryNavFont } from './headerCategoryNavTypography';

const EXTRA_BOTTOM_CATEGORY: Category = {
  id: '__extra-climate__',
  slug: '__extra-climate__',
  title: 'Օդորակիչներ և տաքացուցիչներ',
  fullPath: 'Օդորակիչներ և տաքացուցիչներ',
  children: [],
};

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
    () => [...categories, EXTRA_BOTTOM_CATEGORY],
    [categories]
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

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col divide-y divide-marco-border overflow-hidden rounded-[13px] bg-marco-gray shadow-2xl md:flex-row md:divide-x md:divide-y-0">
      <div className="flex min-h-0 w-full shrink-0 flex-col gap-[16px] overflow-y-auto rounded-t-[13px] bg-marco-gray py-6 pl-4 pr-2 md:h-full md:w-[360px] md:min-w-[360px] md:max-w-[360px] md:rounded-l-[13px] md:rounded-r-[13px] md:rounded-t-none md:py-[29px] md:pl-[25px] md:pr-[25px]">
        {categoriesWithExtra.map((category) => {
          const isSelected = category.slug === selectedSlug;
          const row = resolveCategoryNavPresentation(category.slug, category.title, lang);
          const RowLucide = row.icon.kind === 'lucide' ? row.icon.Icon : null;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedSlug(category.slug)}
              className={`${headerCategoryNavFont.className} flex w-full min-w-0 items-center rounded-[35px] px-[7px] py-0 text-left text-base leading-[22px] tracking-[0.16px] transition-[opacity,background-color,color] duration-150 ${
                isSelected
                  ? 'bg-marco-yellow font-bold text-marco-black'
                  : 'font-normal text-[#5d7285] hover:opacity-90'
              }`}
            >
              <span className="flex size-[52px] shrink-0 items-center justify-center p-[7px] text-marco-black">
                {row.icon.kind === 'figma' ? (
                  <img
                    src={row.icon.src}
                    alt=""
                    width={38}
                    height={38}
                    className="h-[38px] w-[38px] shrink-0 object-contain"
                    draggable={false}
                  />
                ) : (
                  RowLucide && (
                    <RowLucide size={38} className="shrink-0" strokeWidth={1.35} aria-hidden />
                  )
                )}
              </span>
              <span className="min-w-0 flex-1 py-[7px] pr-1">{row.title}</span>
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-y-auto rounded-b-[13px] bg-white px-5 pb-5 pt-6 md:rounded-b-none md:rounded-r-[13px] md:pl-6 md:pr-5 md:pt-6">
        <CategoryDropdownPromoBanner
          badge={preview.promo.badge}
          headline={preview.promo.headline}
          subline={preview.promo.subline}
          href={`/products?category=${selected.slug}`}
          onNavigate={onClose}
          ctaLabel={t('common.buttons.shopNow')}
        />
        <CategoryMegaSubcategoryPills
          sectionTitle={preview.title.toUpperCase()}
          items={selected.children}
          lang={lang}
          productsWord={t('common.navigation.categoriesMegaMenu.productsWord')}
          emptyMessage={t('common.navigation.categoriesMegaMenu.emptySubcategories')}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}
