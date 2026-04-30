'use client';

import { Star } from 'lucide-react';

import {
  SPECIAL_OFFERS_REVIEW_COUNT_FONT_SIZE_PX,
  SPECIAL_OFFERS_STAR_GAP_PX,
  SPECIAL_OFFERS_STAR_SIZE_PX,
  SPECIAL_OFFERS_STAR_STROKE_WIDTH,
  SPECIAL_OFFERS_STAR_TO_REVIEW_COUNT_GAP_PX,
  SPECIAL_OFFERS_TITLE_TO_STARS_MARGIN_TOP_PX,
} from './home-special-offers.constants';

const STAR_COUNT = 5;

interface SpecialOfferCardStarsProps {
  reviewCount?: number;
  detailsPending?: boolean;
}

/**
 * Figma `101:3637` — outlined yellow stars, optional `(n)` reviews; row sits below title with fixed offset.
 */
export function SpecialOfferCardStars({ reviewCount, detailsPending = false }: SpecialOfferCardStarsProps) {
  if (detailsPending) {
    return (
      <div
        className="flex min-h-0 w-full min-w-0 items-center"
        style={{ marginTop: SPECIAL_OFFERS_TITLE_TO_STARS_MARGIN_TOP_PX }}
        aria-busy="true"
      >
        <div className="h-4 w-24 rounded-md bg-gray-200/90 dark:bg-white/10" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 w-full min-w-0 items-center"
      style={{ marginTop: SPECIAL_OFFERS_TITLE_TO_STARS_MARGIN_TOP_PX }}
    >
      <div
        className="flex shrink-0 items-center"
        style={{ gap: SPECIAL_OFFERS_STAR_GAP_PX }}
        aria-hidden
      >
        {Array.from({ length: STAR_COUNT }).map((_, i) => (
          <Star
            key={i}
            absoluteStrokeWidth
            size={SPECIAL_OFFERS_STAR_SIZE_PX}
            strokeWidth={SPECIAL_OFFERS_STAR_STROKE_WIDTH}
            className="shrink-0 fill-none text-marco-yellow"
            aria-hidden
          />
        ))}
      </div>
      {typeof reviewCount === 'number' && reviewCount >= 0 ? (
        <span
          className="min-w-0 shrink font-normal leading-[15px] text-gray-400"
          style={{
            marginLeft: SPECIAL_OFFERS_STAR_TO_REVIEW_COUNT_GAP_PX,
            fontSize: SPECIAL_OFFERS_REVIEW_COUNT_FONT_SIZE_PX,
          }}
        >
          ({reviewCount})
        </span>
      ) : null}
    </div>
  );
}
