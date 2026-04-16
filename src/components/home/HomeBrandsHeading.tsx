import { ChevronLeft, ChevronRight } from 'lucide-react';

import { t } from '../../lib/i18n';
import type { LanguageCode } from '../../lib/language';
import {
  FEATURED_PRODUCTS_TITLE_BAR_THICKNESS_PX,
  FEATURED_PRODUCTS_TITLE_BAR_WIDTH_PERCENT,
  FEATURED_PRODUCTS_TITLE_LETTER_SPACING_PX,
  FEATURED_PRODUCTS_TITLE_TEXT_TO_BAR_GAP_PX,
} from '../featured-products-tabs.constants';
import { HOME_BRANDS_HEADING_TITLE_INSET_LEFT_PX } from './home-brands.constants';

const ROUND_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 transition-colors hover:border-marco-yellow hover:bg-marco-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

const NAV_ICON_CLASS = 'h-3 w-3 shrink-0 text-marco-black max-md:h-5 max-md:w-5';

const titleLetterSpacingStyle = {
  letterSpacing: `${FEATURED_PRODUCTS_TITLE_LETTER_SPACING_PX}px`,
} as const;

const titleBarPaddingStyle = {
  paddingBottom: `${FEATURED_PRODUCTS_TITLE_TEXT_TO_BAR_GAP_PX + FEATURED_PRODUCTS_TITLE_BAR_THICKNESS_PX}px`,
} as const;

const titleBarStyle = {
  left: 0,
  width: `${FEATURED_PRODUCTS_TITLE_BAR_WIDTH_PERCENT}%`,
  height: `${FEATURED_PRODUCTS_TITLE_BAR_THICKNESS_PX}px`,
} as const;

type HomeBrandsHeadingProps = {
  language: LanguageCode;
  onPrev: () => void;
  onNext: () => void;
};

/**
 * «ԲՐԵՆԴՆԵՐ» row — matches Figma 101:4077 (Montserrat bar + round chevrons).
 */
export function HomeBrandsHeading({ language, onPrev, onNext }: HomeBrandsHeadingProps) {
  const title = t(language, 'home.brands.title');

  return (
    <div className="flex flex-row flex-wrap items-end justify-between gap-4">
      <div className="min-w-0" style={{ paddingLeft: `${HOME_BRANDS_HEADING_TITLE_INSET_LEFT_PX}px` }}>
        <h2
          id="home-brands-heading"
          className="font-bold uppercase text-marco-black [font-size:var(--fp-title-fs)] [line-height:var(--fp-title-lh)]"
          style={titleLetterSpacingStyle}
        >
          <span className="relative inline-block whitespace-nowrap" style={titleBarPaddingStyle}>
            {title}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 bg-marco-yellow"
              style={titleBarStyle}
            />
          </span>
        </h2>
      </div>
      <div className="flex shrink-0 flex-row gap-2">
        <button
          type="button"
          onClick={onPrev}
          className={`${ROUND_NAV_BUTTON_CLASS} h-[var(--fp-nav-btn-h-mobile)] w-[var(--fp-nav-btn-w-mobile)] md:h-[var(--fp-nav-btn-h)] md:w-[var(--fp-nav-btn-w)]`}
          aria-controls="home-brands-rail"
          aria-label={t(language, 'home.brands.carousel_prev_aria')}
        >
          <ChevronLeft className={NAV_ICON_CLASS} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onNext}
          className={`${ROUND_NAV_BUTTON_CLASS} h-[var(--fp-nav-btn-h-mobile)] w-[var(--fp-nav-btn-w-mobile)] md:h-[var(--fp-nav-btn-h)] md:w-[var(--fp-nav-btn-w)]`}
          aria-controls="home-brands-rail"
          aria-label={t(language, 'home.brands.carousel_next_aria')}
        >
          <ChevronRight className={NAV_ICON_CLASS} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
