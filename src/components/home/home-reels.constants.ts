/** Figma MARCO 214:1057 — REELS rail (circle size & scroll step). */
export const REELS_CIRCLE_SIZE_PX = 145;

/** Portion of viewport width to scroll per arrow tap (horizontal strip). */
export const REELS_SCROLL_FRACTION = 0.9;

/** Figma — title (Montserrat Bold); scales down on narrow viewports. */
export const REELS_TITLE_FONT_SIZE_CLAMP = 'clamp(28px, 5.5vw, 54px)';

/** Tight headline line height (Figma 32px / 54px). */
export const REELS_TITLE_LINE_HEIGHT = '1.05';

/** Figma — label (Montserrat Regular). */
export const REELS_LABEL_FONT_SIZE_PX = 18;

/** Figma — label line height. */
export const REELS_LABEL_LINE_HEIGHT_PX = 28;

/** Figma — title tracking. */
export const REELS_TITLE_LETTER_SPACING_PX = -0.6;

/** Yellow accent bar under title (≈ w-20). */
export const REELS_TITLE_ACCENT_WIDTH_REM = 5;

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
