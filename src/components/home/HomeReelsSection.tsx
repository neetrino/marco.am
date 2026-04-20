'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { useTranslation } from '../../lib/i18n-client';
import {
  REELS_MOBILE_CIRCLE_SIZE_PX,
  REELS_MOBILE_TILE_BASIS_CSS,
  REELS_LABEL_FONT_SIZE_PX,
  REELS_LABEL_LINE_HEIGHT_PX,
  REELS_TITLE_INSET_LEFT_PX,
  REELS_TITLE_INSET_LEFT_MOBILE_PX,
  REELS_TITLE_TO_RAIL_GAP_PX,
  REELS_CAROUSEL_NAV_INSET_RIGHT_MOBILE_PX,
  REELS_CAROUSEL_NAV_INSET_RIGHT_PX,
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX,
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  REELS_RAIL_TO_PAGINATION_GAP_DESKTOP_PX,
  REELS_RAIL_TO_PAGINATION_GAP_MOBILE_PX,
  REELS_PAGINATION_DOT_GAP_DESKTOP_PX,
  REELS_PAGINATION_DOT_GAP_MOBILE_PX,
  REELS_PAGINATION_DOT_SIZE_PX,
  REELS_PAGINATION_PAGE_COUNT_DESKTOP,
  REELS_PAGINATION_PAGE_COUNT_MOBILE,
  REELS_TITLE_FONT_SIZE_CLAMP,
  REELS_TITLE_FONT_SIZE_CLAMP_MOBILE,
  REELS_TITLE_LETTER_SPACING_PX,
  REELS_TITLE_LINE_HEIGHT,
  REELS_TITLE_LINE_HEIGHT_MOBILE,
  REELS_MOBILE_RAIL_BLEED_LEFT_PX,
  REELS_MOBILE_TITLE_NUDGE_RIGHT_PX,
  REELS_TITLE_TEXT_TO_BAR_GAP_PX,
  REELS_TITLE_BAR_THICKNESS_PX,
  REELS_TITLE_BAR_EXTEND_LEFT_PX,
  REELS_TITLE_BAR_EXTEND_RIGHT_PX,
} from './home-reels.constants';
import { HOME_PAGE_SECTION_SHELL_CLASS } from './home-page-section-shell.constants';
import { useHomeReelsCarousel } from './useHomeReelsCarousel';
import { useIsMaxMd } from './use-is-max-md';
import { getReelsItemHref } from '../../lib/reels/reels-url';
import type { PublicReelItem } from '../../lib/schemas/reels-management.schema';

const montserratReels = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

/**
 * When a label is exactly two whitespace-separated words, mobile stacks them vertically.
 */
function getReelLabelTwoWordParts(
  label: string,
): { first: string; second: string } | null {
  const parts = label.trim().split(/\s+/);
  if (parts.length !== 2) {
    return null;
  }
  return { first: parts[0], second: parts[1] };
}

const reelsTitleCssVars = {
  ['--reels-mobile-circle' as string]: `${REELS_MOBILE_CIRCLE_SIZE_PX}px`,
  ['--reels-title-fs-mobile' as string]: REELS_TITLE_FONT_SIZE_CLAMP_MOBILE,
  ['--reels-title-fs-desktop' as string]: REELS_TITLE_FONT_SIZE_CLAMP,
  ['--reels-title-lh-mobile' as string]: REELS_TITLE_LINE_HEIGHT_MOBILE,
  ['--reels-title-lh-desktop' as string]: REELS_TITLE_LINE_HEIGHT,
  ['--reels-title-inset-mobile' as string]: `${REELS_TITLE_INSET_LEFT_MOBILE_PX}px`,
  ['--reels-title-inset-desktop' as string]: `${REELS_TITLE_INSET_LEFT_PX}px`,
  ['--reels-mobile-title-nudge-x' as string]: `${REELS_MOBILE_TITLE_NUDGE_RIGHT_PX}px`,
  ['--reels-mobile-rail-bleed-left' as string]: `${REELS_MOBILE_RAIL_BLEED_LEFT_PX}px`,
  ['--reels-nav-btn-w' as string]: `${REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX}px`,
  ['--reels-nav-btn-h' as string]: `${REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX}px`,
  ['--reels-nav-btn-w-mobile' as string]: `${REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX}px`,
  ['--reels-nav-btn-h-mobile' as string]: `${REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX}px`,
  ['--reels-nav-inset-mobile' as string]: `${REELS_CAROUSEL_NAV_INSET_RIGHT_MOBILE_PX}px`,
  ['--reels-nav-inset-desktop' as string]: `${REELS_CAROUSEL_NAV_INSET_RIGHT_PX}px`,
} as const;

const reelsTitleLetterSpacingStyle = {
  letterSpacing: `${REELS_TITLE_LETTER_SPACING_PX}px`,
} as const;

const reelsLabelStyle = {
  fontSize: `${REELS_LABEL_FONT_SIZE_PX}px`,
  lineHeight: `${REELS_LABEL_LINE_HEIGHT_PX}px`,
} as const;

const SECTION_CONTAINER_CLASS = HOME_PAGE_SECTION_SHELL_CLASS;

/** Mobile: shift REELS heading + yellow bar only; rail and pagination are not translated. */
const REELS_MOBILE_TITLE_NUDGE_CLASS =
  'max-md:translate-x-[var(--reels-mobile-title-nudge-x)]';

/** Pill: default white + gray border; hover filled marco-yellow (like former primary/black fill). */
const REELS_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 transition-colors hover:border-marco-yellow hover:bg-marco-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-black';

const reelsPaginationDotStyle = {
  width: REELS_PAGINATION_DOT_SIZE_PX,
  height: REELS_PAGINATION_DOT_SIZE_PX,
} as const;

/** Dark chevrons; readable on yellow hover fill */
const REELS_NAV_ICON_CLASS =
  'h-3 w-3 shrink-0 text-marco-black max-md:h-5 max-md:w-5';

/**
 * REELS: circular category thumbnails in a centered row with arrow scroll.
 */
export type HomeReelsSectionProps = {
  items: PublicReelItem[];
};

export function HomeReelsSection({ items }: HomeReelsSectionProps) {
  const { t } = useTranslation();
  const isMaxMd = useIsMaxMd();
  const reelsPageCount = isMaxMd
    ? REELS_PAGINATION_PAGE_COUNT_MOBILE
    : REELS_PAGINATION_PAGE_COUNT_DESKTOP;
  const reelsDotGapPx = isMaxMd
    ? REELS_PAGINATION_DOT_GAP_MOBILE_PX
    : REELS_PAGINATION_DOT_GAP_DESKTOP_PX;
  const reelsRailToPaginationGapPx = isMaxMd
    ? REELS_RAIL_TO_PAGINATION_GAP_MOBILE_PX
    : REELS_RAIL_TO_PAGINATION_GAP_DESKTOP_PX;
  const { scrollerRef, scrollPrev, scrollNext, activePage, scrollToPage } =
    useHomeReelsCarousel({ pageCount: reelsPageCount });

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
          <div
            className={`min-w-0 max-md:[padding-left:var(--reels-title-inset-mobile)] md:[padding-left:var(--reels-title-inset-desktop)] ${REELS_MOBILE_TITLE_NUDGE_CLASS}`}
          >
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
          <div className="flex shrink-0 flex-row gap-2 max-md:[margin-right:var(--reels-nav-inset-mobile)] md:[margin-right:var(--reels-nav-inset-desktop)]">
            <button
              type="button"
              onClick={scrollPrev}
              className={`${REELS_NAV_BUTTON_CLASS} h-[var(--reels-nav-btn-h-mobile)] w-[var(--reels-nav-btn-w-mobile)] md:h-[var(--reels-nav-btn-h)] md:w-[var(--reels-nav-btn-w)]`}
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
              className={`${REELS_NAV_BUTTON_CLASS} h-[var(--reels-nav-btn-h-mobile)] w-[var(--reels-nav-btn-w-mobile)] md:h-[var(--reels-nav-btn-h)] md:w-[var(--reels-nav-btn-w)]`}
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
          className="flex min-w-0 flex-row flex-nowrap justify-start gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] max-md:[margin-left:calc(-1*var(--reels-mobile-rail-bleed-left))] md:gap-11 md:ml-0 md:[padding-left:var(--reels-title-inset-desktop)] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: 'x mandatory',
            ['--reels-mobile-tile-basis' as string]: REELS_MOBILE_TILE_BASIS_CSS,
          }}
        >
          {items.map((item, index) => {
            const label = item.title;
            const twoWordParts = getReelLabelTwoWordParts(label);
            return (
              <Link
                key={item.id}
                href={getReelsItemHref(index)}
                title={label}
                className="flex max-md:min-w-0 max-md:flex-[0_0_var(--reels-mobile-tile-basis)] shrink-0 snap-start flex-col items-center gap-2.5 text-center md:min-w-[148px]"
              >
                <div
                  className="relative mx-auto shrink-0 overflow-hidden rounded-full border border-marco-border bg-marco-gray max-md:h-[var(--reels-mobile-circle)] max-md:w-[var(--reels-mobile-circle)] md:mx-0 md:h-32 md:w-32"
                >
                  <img
                    src={item.posterUrl}
                    alt={label}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <span
                  className={`w-full max-w-full font-medium text-marco-text md:whitespace-nowrap ${
                    twoWordParts ? 'max-md:leading-snug' : 'max-md:truncate'
                  }`}
                  style={reelsLabelStyle}
                >
                  {twoWordParts ? (
                    <>
                      <span className="hidden md:inline">{label}</span>
                      <span className="flex flex-col items-center md:hidden">
                        <span>{twoWordParts.first}</span>
                        <span>{twoWordParts.second}</span>
                      </span>
                    </>
                  ) : (
                    label
                  )}
                </span>
              </Link>
            );
          })}
        </div>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-marco-muted">{t('home.reels_title')}</p>
        ) : null}

        <div
          className="flex flex-row items-center justify-center"
          style={{
            marginTop: `${reelsRailToPaginationGapPx}px`,
            gap: `${reelsDotGapPx}px`,
          }}
          role="group"
          aria-label={t('home.reels_pagination_aria')}
        >
          {Array.from({ length: reelsPageCount }, (_, page) => (
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
