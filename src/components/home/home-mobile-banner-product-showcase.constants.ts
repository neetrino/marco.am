/**
 * Figma MARCO — mobile product showcase under app banner (`Group 9300`, node 314:2479).
 */

/** Figma frame `Group 9300` — width × height (design px). */
export const HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX = 522;

export const HOME_MOBILE_BANNER_SHOWCASE_CARD_HEIGHT_PX = 372;

/**
 * Mobile: cap rendered width so the slate card is smaller than full content width (design 402px).
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CARD_MAX_WIDTH_PX = 402;

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
  372 / HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX;

/**
 * Top padding on the wrapper so the chair can sit above the photo card without covering the app banner.
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_MIN_PX = 52;

export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_MAX_PX = 52;

export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_BLEED_TOP_VW = 14;

/** Positive — shifts chair + floor ellipse down into the photo (mobile showcase). */
export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_NUDGE_DOWN_PX = 29;

/**
 * Extra scale on top of `HERO_MOBILE_CHAIR_GROUP_SCALE` for the mobile showcase sofa.
 * Reduced slightly so the sofa sits lighter above the bottom nav area.
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CHAIR_SCALE_MULTIPLIER = 1.08;

/** Bottom bar — Figma 314:2490. */
export const HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_X_PX = 22;

export const HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_BOTTOM_PX = 20;

export const HOME_MOBILE_BANNER_SHOWCASE_FOOTER_PAD_TOP_PX = 8;

export const HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES =
  '(max-width: 768px) 85vw, 402px' as const;
