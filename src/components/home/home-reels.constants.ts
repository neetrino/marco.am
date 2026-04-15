/** REELS rail — circle thumbnail size. */
export const REELS_CIRCLE_SIZE_PX = 128;

/** Mobile — circle size; three columns still fit via `REELS_MOBILE_TILE_BASIS_CSS`. */
export const REELS_MOBILE_CIRCLE_SIZE_PX = 88;

/** Horizontal gap between reel tiles (circles). */
export const REELS_ITEM_GAP_PX = 44;

/**
 * Mobile (`max-md`): gap between reel tiles; paired with `REELS_MOBILE_TILE_BASIS_CSS` (three columns).
 */
export const REELS_MOBILE_ITEM_GAP_PX = 8;

/** Mobile rail: exactly this many tiles visible across the scroller width (`max-md`). */
export const REELS_MOBILE_VISIBLE_COLUMN_COUNT = 3;

/**
 * Flex-basis for each mobile reel tile — `(100% − (n−1)×gap) / n` so only `n` circles fit per view.
 * Set on scroller as `--reels-mobile-tile-basis` for `HomeReelsSection` links.
 */
export const REELS_MOBILE_TILE_BASIS_CSS = `calc((100% - ${(REELS_MOBILE_VISIBLE_COLUMN_COUNT - 1) * REELS_MOBILE_ITEM_GAP_PX}px) / ${REELS_MOBILE_VISIBLE_COLUMN_COUNT})`;

/** Minimum column width for each tile (label uses nowrap; column can grow). */
export const REELS_COLUMN_MIN_WIDTH_PX = 148;

/** Portion of viewport width to scroll per arrow tap (horizontal strip). */
export const REELS_SCROLL_FRACTION = 0.9;

/** Title (Montserrat Bold) — desktop (`md+`). */
export const REELS_TITLE_FONT_SIZE_CLAMP = 'clamp(18px, 3.75vw, 36px)';

/** Title — mobile: larger than desktop minimum for readability. */
export const REELS_TITLE_FONT_SIZE_CLAMP_MOBILE = 'clamp(24px, 6.5vw, 36px)';

/** Tight headline line height — desktop. */
export const REELS_TITLE_LINE_HEIGHT = '1.05';

/** Mobile: tighter line box so the yellow bar sits closer to the letters. */
export const REELS_TITLE_LINE_HEIGHT_MOBILE = '0.92';

/** Vertical gap (px) between the title glyphs and the yellow bar below. */
export const REELS_TITLE_TEXT_TO_BAR_GAP_PX = 8;

/** Thickness of the yellow bar (matches former `border-b-4`). */
export const REELS_TITLE_BAR_THICKNESS_PX = 4;

/**
 * How far the yellow bar extends past the title box (px). Asymmetric: shorter on the left.
 */
export const REELS_TITLE_BAR_EXTEND_LEFT_PX = -1;
export const REELS_TITLE_BAR_EXTEND_RIGHT_PX = 19;

/** Label (Montserrat Regular). */
export const REELS_LABEL_FONT_SIZE_PX = 14;

/** Label line height. */
export const REELS_LABEL_LINE_HEIGHT_PX = 21;

/** Figma — title tracking. */
export const REELS_TITLE_LETTER_SPACING_PX = -0.6;

/** Nudge title + accent bar slightly right from section alignment (`md+`). */
export const REELS_TITLE_INSET_LEFT_PX = 40;

/** Mobile: title flush with section content (no extra inset). */
export const REELS_TITLE_INSET_LEFT_MOBILE_PX = 0;

/**
 * Mobile (`max-md`): horizontal nudge for the REELS title + yellow bar only (`translateX`).
 * Does not move the prev/next arrows, reel rail, or dot pagination — adjust those separately.
 */
export const REELS_MOBILE_TITLE_NUDGE_RIGHT_PX = 6;

/**
 * Mobile (`max-md`): negative margin-left on the reel scroller — pulls the first circle
 * slightly toward the viewport edge (tighter than section padding alone).
 */
export const REELS_MOBILE_RAIL_BLEED_LEFT_PX = 6;

/** Vertical space between the REELS heading row and the circle rail. */
export const REELS_TITLE_TO_RAIL_GAP_PX = 32;

/** Inset prev/next controls from the section’s right edge (`md+`). */
export const REELS_CAROUSEL_NAV_INSET_RIGHT_PX = 13;

/** Mobile: inset from the right edge — lower = arrows further right. */
export const REELS_CAROUSEL_NAV_INSET_RIGHT_MOBILE_PX = 3;

/**
 * Prev/next carousel controls — compact pill (ratio ~1.28). Desktop (`md+`).
 */
export const REELS_CAROUSEL_NAV_BUTTON_WIDTH_PX = 30;
export const REELS_CAROUSEL_NAV_BUTTON_HEIGHT_PX = 24;

/** Prev/next on mobile — slightly larger than desktop controls. */
export const REELS_CAROUSEL_NAV_BUTTON_WIDTH_MOBILE_PX = 44;
export const REELS_CAROUSEL_NAV_BUTTON_HEIGHT_MOBILE_PX = 34;

/** Space between the reel rail and dot pagination. */
export const REELS_RAIL_TO_PAGINATION_GAP_PX = 20;

/** Dot pagination — scroll range split into this many segments (synced with `useHomeReelsCarousel`). */
export const REELS_PAGINATION_PAGE_COUNT = 3;

/** Dot pagination affordance. */
export const REELS_PAGINATION_DOT_SIZE_PX = 8;
export const REELS_PAGINATION_DOT_GAP_PX = 6;

/** Default destination for reel tiles until category slugs are wired. */
export const REELS_ITEM_HREF = '/products' as const;

export const REELS_ITEMS = [
  {
    imageSrc: '/images/home/reels/reel-1.png',
    labelKey: 'reels_item_washing_machines' as const,
  },
  {
    imageSrc: '/images/home/reels/reel-2.png',
    labelKey: 'reels_item_vacuum_cleaners' as const,
  },
  {
    imageSrc: '/images/home/reels/reel-3.png',
    labelKey: 'reels_item_small_appliances' as const,
  },
  {
    imageSrc: '/images/home/reels/reel-4.png',
    labelKey: 'reels_item_smart_tv' as const,
  },
  {
    imageSrc: '/images/home/reels/reel-5.png',
    labelKey: 'reels_item_refrigerators' as const,
  },
  {
    imageSrc: '/images/home/reels/reel-6.png',
    labelKey: 'reels_item_air_conditioners' as const,
  },
] as const;
