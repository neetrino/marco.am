/**
 * Figma MARCO — mobile product showcase under app banner (`Group 9300`, node 314:2479).
 * Photo fill layer — node 314:2480 (`kam-idris-_HqHX3LBN18-unsplash 1`).
 */

/** Figma frame `Group 9300` — width × height (design px). */
export const HOME_MOBILE_BANNER_SHOWCASE_CARD_WIDTH_PX = 522;

export const HOME_MOBILE_BANNER_SHOWCASE_CARD_HEIGHT_PX = 372;

/** Figma `kam-idris` + overlay — `rounded-[20px]`. */
export const HOME_MOBILE_BANNER_SHOWCASE_RADIUS_PX = 20;

/** Same base + overlay recipe as `HomeGradientBanner`. */
export const HOME_MOBILE_BANNER_SHOWCASE_OVERLAY_OPACITY = 0.58;

export const HOME_MOBILE_BANNER_SHOWCASE_SURFACE_HEX = '#2f4b5d';

export const HOME_MOBILE_BANNER_SHOWCASE_IMAGE_PATH = '/assets/home/home-gradient-banner.jpg';

/** Figma 314:2480 dev — reference %; image layer uses `cover` in code to avoid visible bands. */
export const HOME_MOBILE_BANNER_SHOWCASE_BG_SIZE_WIDTH_PERCENT = 120.46;

export const HOME_MOBILE_BANNER_SHOWCASE_BG_SIZE_HEIGHT_PERCENT = 160.88;

/** Figma 314:2480 dev — `left` / `top` on the image (% of container). */
export const HOME_MOBILE_BANNER_SHOWCASE_BG_POSITION_X_PERCENT = -11.5;

export const HOME_MOBILE_BANNER_SHOWCASE_BG_POSITION_Y_PERCENT = -48.15;

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

/**
 * Russian (`ru`): shift the yellow CTA slightly left and down (mobile showcase, above bottom nav).
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CTA_RU_NUDGE_X_PX = -6;
export const HOME_MOBILE_BANNER_SHOWCASE_CTA_RU_NUDGE_Y_PX = 5;

/**
 * Russian — label `translateX` uses `HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX - N`; lower N = text further right (was 17).
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CTA_RU_LABEL_NUDGE_SUBTRACT_PX = 16;

/**
 * Armenian (`hy`): shift the yellow CTA slightly left and down in the bottom bar (mobile showcase).
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CTA_HY_NUDGE_X_PX = -8;
export const HOME_MOBILE_BANNER_SHOWCASE_CTA_HY_NUDGE_Y_PX = 6;

/**
 * English (`en`): shift the yellow CTA left and down in the bottom bar (mobile showcase, above bottom nav).
 */
export const HOME_MOBILE_BANNER_SHOWCASE_CTA_EN_NUDGE_X_PX = -10;
export const HOME_MOBILE_BANNER_SHOWCASE_CTA_EN_NUDGE_Y_PX = 8;

/**
 * English (`en`) — white sofa copy block (`showcaseLabelStyle`); default row is `translate(14px, 6px)`.
 */
export const HOME_MOBILE_BANNER_SHOWCASE_LABEL_EN_TRANSLATE_X_PX = 32;
export const HOME_MOBILE_BANNER_SHOWCASE_LABEL_EN_TRANSLATE_Y_PX = 14;

export const HOME_MOBILE_BANNER_SHOWCASE_IMAGE_SIZES =
  '(max-width: 768px) 100vw, 896px' as const;
