'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { useTranslation } from '../../lib/i18n-client';
import {
  REELS_CIRCLE_SIZE_PX,
  REELS_COLUMN_MIN_WIDTH_PX,
  REELS_ITEM_GAP_PX,
  REELS_ITEMS,
  REELS_ITEM_HREF,
  REELS_LABEL_FONT_SIZE_PX,
  REELS_LABEL_LINE_HEIGHT_PX,
  REELS_TITLE_ACCENT_WIDTH_REM,
  REELS_TITLE_INSET_LEFT_PX,
  REELS_TITLE_TO_RAIL_GAP_PX,
  REELS_CAROUSEL_NAV_INSET_RIGHT_PX,
  REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
  REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  REELS_TITLE_FONT_SIZE_CLAMP,
  REELS_TITLE_LETTER_SPACING_PX,
  REELS_TITLE_LINE_HEIGHT,
} from './home-reels.constants';
import { useHomeReelsCarousel } from './useHomeReelsCarousel';

const montserratReels = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

const reelsTitleStyle = {
  fontSize: REELS_TITLE_FONT_SIZE_CLAMP,
  lineHeight: REELS_TITLE_LINE_HEIGHT,
  letterSpacing: `${REELS_TITLE_LETTER_SPACING_PX}px`,
} as const;

const reelsLabelStyle = {
  fontSize: `${REELS_LABEL_FONT_SIZE_PX}px`,
  lineHeight: `${REELS_LABEL_LINE_HEIGHT_PX}px`,
} as const;

const SECTION_CONTAINER_CLASS =
  'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

const reelsNavButtonStyle = {
  width: REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX,
  height: REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX,
} as const;

const REELS_NAV_BUTTON_CLASS =
  'flex shrink-0 items-center justify-center overflow-visible rounded-full border border-gray-200 bg-white p-0 text-marco-black transition-colors hover:bg-marco-yellow';

const REELS_NAV_ICON_CLASS = 'h-3.5 w-3.5 shrink-0';

/**
 * REELS: circular category thumbnails in a centered row with arrow scroll.
 */
export function HomeReelsSection() {
  const { t } = useTranslation();
  const { scrollerRef, scrollPrev, scrollNext } = useHomeReelsCarousel();

  return (
    <section
      className={`bg-white py-8 sm:py-10 ${montserratReels.className}`}
      aria-labelledby="home-reels-heading"
    >
      <div className={SECTION_CONTAINER_CLASS}>
        <div
          className="flex flex-row flex-wrap items-end justify-between gap-4"
          style={{ marginBottom: `${REELS_TITLE_TO_RAIL_GAP_PX}px` }}
        >
          <div
            className="min-w-0"
            style={{ paddingLeft: `${REELS_TITLE_INSET_LEFT_PX}px` }}
          >
            <h2
              id="home-reels-heading"
              className="font-bold uppercase text-marco-black"
              style={reelsTitleStyle}
            >
              {t('home.reels_title')}
            </h2>
            <div
              className="mt-2 h-1 bg-marco-yellow"
              style={{ width: `${REELS_TITLE_ACCENT_WIDTH_REM}rem` }}
              aria-hidden
            />
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
                strokeWidth={2.5}
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
                strokeWidth={2.5}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex min-w-0 flex-row flex-nowrap justify-center overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            gap: `${REELS_ITEM_GAP_PX}px`,
            scrollSnapType: 'x mandatory',
          }}
        >
          {REELS_ITEMS.map((item) => {
            const label = t(`home.${item.labelKey}`);
            return (
              <Link
                key={item.labelKey}
                href={REELS_ITEM_HREF}
                className="flex shrink-0 snap-start flex-col items-center gap-2.5 text-center"
                style={{ minWidth: REELS_COLUMN_MIN_WIDTH_PX }}
              >
                <div
                  className="relative shrink-0 overflow-hidden rounded-full bg-marco-gray"
                  style={{
                    width: REELS_CIRCLE_SIZE_PX,
                    height: REELS_CIRCLE_SIZE_PX,
                  }}
                >
                  <Image
                    src={item.imageSrc}
                    alt={label}
                    width={REELS_CIRCLE_SIZE_PX}
                    height={REELS_CIRCLE_SIZE_PX}
                    className="h-full w-full object-cover object-center"
                    sizes={`${REELS_CIRCLE_SIZE_PX}px`}
                  />
                </div>
                <span
                  className="whitespace-nowrap font-normal text-marco-black"
                  style={reelsLabelStyle}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
