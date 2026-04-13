/** REELS rail — circle thumbnail size. */
export const REELS_CIRCLE_SIZE_PX = 128;

/** Horizontal gap between reel tiles (circles). */
export const REELS_ITEM_GAP_PX = 44;

/** Minimum column width for each tile (label uses nowrap; column can grow). */
export const REELS_COLUMN_MIN_WIDTH_PX = 148;

/** Portion of viewport width to scroll per arrow tap (horizontal strip). */
export const REELS_SCROLL_FRACTION = 0.9;

/** Title (Montserrat Bold); compact vs full Figma spec. */
export const REELS_TITLE_FONT_SIZE_CLAMP = 'clamp(18px, 3.75vw, 36px)';

/** Tight headline line height. */
export const REELS_TITLE_LINE_HEIGHT = '1.05';

/** Label (Montserrat Regular). */
export const REELS_LABEL_FONT_SIZE_PX = 14;

/** Label line height. */
export const REELS_LABEL_LINE_HEIGHT_PX = 21;

/** Figma — title tracking. */
export const REELS_TITLE_LETTER_SPACING_PX = -0.6;

/** Yellow accent bar under title. */
export const REELS_TITLE_ACCENT_WIDTH_REM = 4.75;

/** Nudge title + accent bar slightly right from section alignment. */
export const REELS_TITLE_INSET_LEFT_PX = 40;

/** Vertical space between the REELS heading row and the circle rail. */
export const REELS_TITLE_TO_RAIL_GAP_PX = 32;

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
