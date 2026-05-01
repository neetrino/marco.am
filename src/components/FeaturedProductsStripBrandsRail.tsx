'use client';

import Link from 'next/link';
import type { Ref } from 'react';

import { t } from '../lib/i18n';
import type { LanguageCode } from '../lib/language';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';
import {
  SPECIAL_OFFERS_CTA_LINK_CLASS,
  SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
} from './home/home-special-offers.constants';
import {
  HOME_BRANDS_AFTER_CTA_MARGIN_TOP_MOBILE_PX,
  HOME_BRANDS_AFTER_CTA_MARGIN_TOP_PX,
  HOME_BRANDS_BLOCK_PADDING_BOTTOM_DESKTOP_PX,
  HOME_BRANDS_BLOCK_PADDING_BOTTOM_MOBILE_PX,
  HOME_BRANDS_GRID_TO_DOTS_GAP_MOBILE_PX,
  HOME_BRANDS_GRID_TO_DOTS_GAP_PX,
  HOME_BRANDS_TITLE_TO_RAIL_GAP_PX,
} from './home/home-brands.constants';
import { HomeBrandsHeading } from './home/HomeBrandsHeading';
import { HomeBrandsSlide } from './home/HomeBrandsSlide';

const footerDotStyle = {
  width: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
  height: SPECIAL_OFFERS_PAGINATION_DOT_SIZE_PX,
} as const;

export type FeaturedProductsStripBrandsRailProps = {
  readonly language: LanguageCode;
  readonly isMaxMd: boolean;
  readonly homeBrandPartners: HomeBrandPartnerPublicItem[] | null;
  readonly homeBrandPartnersSectionTitle?: string | null;
  readonly brandsRailRef: Ref<HTMLDivElement>;
  readonly brandsActivePage: number;
  readonly brandsPaginationPageCount: number;
  readonly paginationDotGapPx: number;
  readonly brandsDotsToCtaGapPx: number;
  readonly scrollBrandsToPage: (page: number) => void;
};

export function FeaturedProductsStripBrandsRail({
  language,
  isMaxMd,
  homeBrandPartners,
  homeBrandPartnersSectionTitle,
  brandsRailRef,
  brandsActivePage,
  brandsPaginationPageCount,
  paginationDotGapPx,
  brandsDotsToCtaGapPx,
  scrollBrandsToPage,
}: FeaturedProductsStripBrandsRailProps) {
  return (
    <div
      className="w-full"
      style={{
        marginTop: `${
          isMaxMd
            ? HOME_BRANDS_AFTER_CTA_MARGIN_TOP_MOBILE_PX
            : HOME_BRANDS_AFTER_CTA_MARGIN_TOP_PX
        }px`,
        paddingBottom: `${isMaxMd ? HOME_BRANDS_BLOCK_PADDING_BOTTOM_MOBILE_PX : HOME_BRANDS_BLOCK_PADDING_BOTTOM_DESKTOP_PX}px`,
      }}
    >
      <HomeBrandsHeading
        language={language}
        onPrev={() => scrollBrandsToPage(brandsActivePage - 1)}
        onNext={() => scrollBrandsToPage(brandsActivePage + 1)}
        sectionTitle={homeBrandPartnersSectionTitle ?? undefined}
      />
      <div
        ref={brandsRailRef}
        id="home-brands-rail"
        className="w-full overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ marginTop: `${HOME_BRANDS_TITLE_TO_RAIL_GAP_PX}px` }}
        aria-label={t(language, 'home.brands.rail_aria')}
      >
        <HomeBrandsSlide partners={homeBrandPartners} />
      </div>

      <div
        className="flex flex-row items-center justify-center"
        style={{
          marginTop: `${isMaxMd ? HOME_BRANDS_GRID_TO_DOTS_GAP_MOBILE_PX : HOME_BRANDS_GRID_TO_DOTS_GAP_PX}px`,
          gap: `${paginationDotGapPx}px`,
        }}
        role="tablist"
        aria-label={t(language, 'home.brands.rail_aria')}
      >
        {Array.from({ length: brandsPaginationPageCount }, (_, i) => (
          <button
            key={`brands-footer-dot-${i}`}
            type="button"
            role="tab"
            aria-selected={i === brandsActivePage}
            aria-label={`${t(language, 'home.special_offers_carousel_page')} ${i + 1}`}
            onClick={() => scrollBrandsToPage(i)}
            className={`rounded-full transition-colors duration-200 ${
              i === brandsActivePage
                ? 'bg-[#181111] dark:!bg-[#ffca03]'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            style={footerDotStyle}
          />
        ))}
      </div>

      <div className="flex justify-center" style={{ marginTop: brandsDotsToCtaGapPx }}>
        <Link href="/brands" className={SPECIAL_OFFERS_CTA_LINK_CLASS}>
          {t(language, 'home.special_offers.cta')}
        </Link>
      </div>
    </div>
  );
}
