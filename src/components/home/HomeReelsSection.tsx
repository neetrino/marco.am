'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { useTranslation } from '../../lib/i18n-client';
import {
  REELS_CIRCLE_SIZE_PX,
  REELS_MOBILE_CIRCLE_SIZE_PX,
  REELS_MOBILE_TILE_BASIS_CSS,
  REELS_ITEMS,
  REELS_ITEM_HREF,
  REELS_LABEL_FONT_SIZE_PX,
  REELS_LABEL_LINE_HEIGHT_PX,
  REELS_TITLE_INSET_LEFT_PX,
  REELS_TITLE_INSET_LEFT_MOBILE_PX,
  REELS_TITLE_TO_RAIL_GAP_PX,
  REELS_CAROUSEL_NAV_INSET_RIGHT_PX,
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  REELS_RAIL_TO_PAGINATION_GAP_PX,
  REELS_PAGINATION_DOT_GAP_PX,
  REELS_PAGINATION_DOT_SIZE_PX,
  REELS_PAGINATION_PAGE_COUNT,
  REELS_TITLE_FONT_SIZE_CLAMP,
  REELS_TITLE_FONT_SIZE_CLAMP_MOBILE,
  REELS_TITLE_LETTER_SPACING_PX,
  REELS_TITLE_LINE_HEIGHT,
  REELS_TITLE_LINE_HEIGHT_MOBILE,
  REELS_MOBILE_SECTION_NUDGE_RIGHT_PX,
  REELS_TITLE_TEXT_TO_BAR_GAP_PX,
  REELS_TITLE_BAR_THICKNESS_PX,
  REELS_TITLE_BAR_EXTEND_LEFT_PX,
  REELS_TITLE_BAR_EXTEND_RIGHT_PX,
} from './home-reels.constants';
import { useHomeReelsCarousel } from './useHomeReelsCarousel';

const montserratReels = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

const reelsTitleCssVars = {
  ['--reels-title-fs-mobile' as string]: REELS_TITLE_FONT_SIZE_CLAMP_MOBILE,
  ['--reels-title-fs-desktop' as string]: REELS_TITLE_FONT_SIZE_CLAMP,
  ['--reels-title-lh-mobile' as string]: REELS_TITLE_LINE_HEIGHT_MOBILE,
  ['--reels-title-lh-desktop' as string]: REELS_TITLE_LINE_HEIGHT,
  ['--reels-title-inset-mobile' as string]: `${REELS_TITLE_INSET_LEFT_MOBILE_PX}px`,
  ['--reels-title-inset-desktop' as string]: `${REELS_TITLE_INSET_LEFT_PX}px`,
  ['--reels-mobile-section-nudge-x' as string]: `${REELS_MOBILE_SECTION_NUDGE_RIGHT_PX}px`,
} as const;

const reelsTitleLetterSpacingStyle = {
  letterSpacing: `${REELS_TITLE_LETTER_SPACING_PX}px`,
} as const;

const reelsLabelStyle = {
  fontSize: `${REELS_LABEL_FONT_SIZE_PX}px`,
  lineHeight: `${REELS_LABEL_LINE_HEIGHT_PX}px`,
} as const;

const SECTION_CONTAINER_CLASS =
  'w-full max-w-7xl mx-auto max-md:translate-x-[var(--reels-mobile-section-nudge-x)] px-4 sm:px-6 lg:px-8';

const reelsNavButtonStyle = {
  width: REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  height: REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
} as const;

/** Pill: default white + gray border; hover filled marco-yellow (like former primary/black fill). */
const REELS_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 transition-colors hover:border-marco-yellow hover:bg-marco-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

const reelsPaginationDotStyle = {
  width: REELS_PAGINATION_DOT_SIZE_PX,
  height: REELS_PAGINATION_DOT_SIZE_PX,
} as const;

/** Dark chevrons; readable on yellow hover fill */
const REELS_NAV_ICON_CLASS = 'h-3 w-3 shrink-0 text-marco-black';

/**
 * REELS: circular category thumbnails in a centered row with arrow scroll.
 */
export function HomeReelsSection() {
  const { t } = useTranslation();
  const { scrollerRef, scrollPrev, scrollNext, activePage, scrollToPage } =
    useHomeReelsCarousel();

  const fullTitle = t('home.reels_title');

  const reelsPaginationAriaKeys = [
    'reels_pagination_go_first',
    'reels_pagination_go_second',
    'reels_pagination_go_third',
  ] as const;

  return (
    <section
      className={`bg-white py-8 sm:py-10 ${montserratReels.className}`}
      style={reelsTitleCssVars}
      aria-labelledby="home-reels-heading"
    >
      <div className={SECTION_CONTAINER_CLASS}>
        <div
          className="flex flex-row flex-wrap items-end justify-between gap-4"
          style={{ marginBottom: `${REELS_TITLE_TO_RAIL_GAP_PX}px` }}
        >
          <div className="min-w-0 max-md:[padding-left:var(--reels-title-inset-mobile)] md:[padding-left:var(--reels-title-inset-desktop)]">
            <h2
              id="home-reels-heading"
              className="font-bold uppercase text-marco-black max-md:[font-size:var(--reels-title-fs-mobile)] max-md:[line-height:var(--reels-title-lh-mobile)] md:[font-size:var(--reels-title-fs-desktop)] md:[line-height:var(--reels-title-lh-desktop)]"
              style={reelsTitleLetterSpacingStyle}
            >
              <span
                className="relative inline-block whitespace-nowrap"
                style={{
                  paddingBottom: `${REELS_TITLE_TEXT_TO_BAR_GAP_PX + REELS_TITLE_BAR_THICKNESS_PX}px`,
                }}
              >
                {fullTitle}
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 bg-marco-yellow"
                  style={{
                    left: `${-REELS_TITLE_BAR_EXTEND_LEFT_PX}px`,
                    width: `calc(100% + ${REELS_TITLE_BAR_EXTEND_LEFT_PX + REELS_TITLE_BAR_EXTEND_RIGHT_PX}px)`,
                    height: `${REELS_TITLE_BAR_THICKNESS_PX}px`,
                  }}
                />
              </span>
            </h2>
          </div>
          <div
            className="flex shrink-0 flex-row gap-2"
            style={{ marginRight: `${REELS_CAROUSEL_NAV_INSET_RIGHT_PX}px` }}
          >
            <button
              type="button"
              onClick={scrollPrev}
              className={REELS_NAV_BUTTON_CLASS}
              style={reelsNavButtonStyle}
              aria-label={t('home.reels_prev_aria')}
            >
              <ChevronLeft
                className={REELS_NAV_ICON_CLASS}
                strokeWidth={2}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              className={REELS_NAV_BUTTON_CLASS}
              style={reelsNavButtonStyle}
              aria-label={t('home.reels_next_aria')}
            >
              <ChevronRight
                className={REELS_NAV_ICON_CLASS}
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex min-w-0 flex-row flex-nowrap justify-start gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:justify-center md:gap-11 [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: 'x mandatory',
            ['--reels-mobile-tile-basis' as string]: REELS_MOBILE_TILE_BASIS_CSS,
          }}
        >
          {REELS_ITEMS.map((item) => {
            const label = t(`home.${item.labelKey}`);
            return (
              <Link
                key={item.labelKey}
                href={REELS_ITEM_HREF}
                title={label}
                className="flex max-md:min-w-0 max-md:flex-[0_0_var(--reels-mobile-tile-basis)] shrink-0 snap-start flex-col items-center gap-2.5 text-center md:min-w-[148px]"
              >
                <div
                  className="relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full border border-marco-border bg-marco-gray md:mx-0 md:h-32 md:w-32"
                >
                  <Image
                    src={item.imageSrc}
                    alt={label}
                    width={REELS_CIRCLE_SIZE_PX}
                    height={REELS_CIRCLE_SIZE_PX}
                    className="h-full w-full object-cover object-center"
                    sizes={`(max-width: 767px) ${REELS_MOBILE_CIRCLE_SIZE_PX}px, ${REELS_CIRCLE_SIZE_PX}px`}
                  />
                </div>
                <span
                  className="w-full max-w-full font-medium text-marco-text max-md:truncate md:whitespace-nowrap"
                  style={reelsLabelStyle}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>

        <div
          className="flex flex-row items-center justify-center"
          style={{
            marginTop: `${REELS_RAIL_TO_PAGINATION_GAP_PX}px`,
            gap: `${REELS_PAGINATION_DOT_GAP_PX}px`,
          }}
          role="group"
          aria-label={t('home.reels_pagination_aria')}
        >
          {Array.from({ length: REELS_PAGINATION_PAGE_COUNT }, (_, page) => (
            <button
              key={page}
              type="button"
              className={`rounded-full p-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black ${
                activePage === page ? 'bg-marco-black' : 'bg-marco-border'
              }`}
              style={reelsPaginationDotStyle}
              aria-current={activePage === page ? 'page' : undefined}
              aria-label={t(`home.${reelsPaginationAriaKeys[page]}`)}
              onClick={() => {
                scrollToPage(page);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
