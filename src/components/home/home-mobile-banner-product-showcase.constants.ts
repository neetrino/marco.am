/**
 * Figma MARCO — mobile product showcase under app banner (`Group 9300`, node 314:2479).
 */

/** Figma frame `Group 9300` — width × height (design px). */
export const HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX = 522;

export const HOME_MOBILE_BANNER_SHOWCASE_CARD_HEIGHT_PX = 407.8818359375;

/**
 * Mobile: cap rendered width so the slate card is smaller than full content width (design 402px).
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CARD_MAX_WIDTH_PX = 360;

/** Figma `kam-idris` + overlay — `rounded-[20px]`. */
export const HOME_MOBILE_BANNER_SHOWCASE_RADIUS_PX = 20;

/** Same base + overlay recipe as `HomeGradientBanner`. */
export const HOME_MOBILE_BANNER_SHOWCASE_OVERLAY_OPACITY = 0.58;

export const HOME_MOBILE_BANNER_SHOWCASE_SURFACE_HEX = '#2f4b5d';

export const HOME_MOBILE_BANNER_SHOWCASE_IMAGE_PATH = '/assets/home/home-gradient-banner.jpg';

export const HOME_MOBILE_BANNER_SHOWCASE_BG_POSITION_X_PX = -64.382;

export const HOME_MOBILE_BANNER_SHOWCASE_BG_POSITION_Y_PX = -178.168;

export const HOME_MOBILE_BANNER_SHOWCASE_BG_SIZE_WIDTH_PERCENT = 120.455;

export const HOME_MOBILE_BANNER_SHOWCASE_BG_SIZE_HEIGHT_PERCENT = 160.875;

/**
 * Chair group width / card — Figma 314:2481 (`327.258` / `402`).
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_WIDTH_FRAC =
  327.2583312988281 / HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX;

/**
 * Top padding on the wrapper so the chair can sit above the photo card without covering the app banner.
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_MIN_PX = 96;

export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_MAX_PX = 120;

export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_VW = 26;

/** Positive — shifts chair + floor ellipse down into the photo (mobile showcase). */
export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_NUDGE_DOWN_PX = 121;

/**
 * Extra scale on top of `HERO_MOBILE_CHAIR_GROUP_SCALE` so the chair reads slightly larger in this block.
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_SCALE_MULTIPLIER = 1.38;

/** Bottom bar — Figma 314:2490. */
export const HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_X_PX = 22;

export const HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_BOTTOM_PX = 20;

export const HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_TOP_PX = 8;

/** Product name — Figma 314:2496. */
export const HOME_MOBILE_BANNER_SHOWCASE_LABEL_LINE_HEIGHT_PX = 23.8;

export const HOME_MOBILE_BANNER_SHOWCASE_LABEL_FONT_SIZE_PX = 16;

export const HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES =
  '(max-width: 768px) 85vw, 402px' as const;
