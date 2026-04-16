/**
 * Home promotional banner — image sources and layout tokens (reference: MARCO promo block).
 */

/** Figma 305:2146 — yellow panel mask ("Mask group 1"), design size in px */
export const PROMO_PANEL_FIGMA_WIDTH_PX = 1651;
export const PROMO_PANEL_FIGMA_HEIGHT_PX = 925;

/** Yellow brick texture — `public/assets/hero/hero-yellow-brick-wall.png`; applied in `.home-promo-panel` (globals.css) */
export const PROMO_PANEL_MASK_IMAGE_SRC =
  '/assets/hero/hero-yellow-brick-wall.png' as const;

/** Featured armchair — Pexels (allowed in next.config.js) */
export const PROMO_FEATURED_IMAGE_SRC =
  'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800' as const;

/** Right card 1 — interior / product mood */
export const PROMO_SIDE_CARD_A_BG_SRC =
  'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600' as const;

/** Right card 2 — free delivery banner art (`promo-side-card-free-delivery.png`) */
export const PROMO_SIDE_CARD_B_BANNER_SRC =
  '/assets/hero/promo-side-card-free-delivery.png' as const;

/** Top + horizontal only; bottom padding is set on the panel for CTA/chat clearance */
export const PROMO_SECTION_PADDING_CLASS = 'pt-5 px-5 sm:pt-7 sm:px-7 md:pt-8 md:px-8 lg:pt-10 lg:px-10' as const;

export const PROMO_LARGE_CARD_MIN_HEIGHT_CLASS = 'min-h-[280px] sm:min-h-[320px] lg:min-h-[360px]' as const;

export const PROMO_SMALL_CARD_MIN_HEIGHT_CLASS = 'min-h-[200px] sm:min-h-[220px] lg:min-h-[240px]' as const;

/**
 * `HomePromoPromoCardTwo` — rounded rectangle with concave circular bite at top-right.
 * `clipPathUnits="objectBoundingBox"` (0–1); corner radius ~5.5%; bite circle radius ~35% (center outside TR).
 */
export const PROMO_CARD_TWO_CLIP_PATH_D =
  'M0,0.055A0.055,0.055,0,0,1,0.055,0L0.884,0A0.35,0.35,0,0,1,1,0.137L1,0.945A0.055,0.055,0,0,1,0.945,1L0.055,1A0.055,0.055,0,0,1,0,0.945L0,0.055Z' as const;
