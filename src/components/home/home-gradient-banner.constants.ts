/**
 * Gradient + photo banner — user spec (560×370, 56/37, #2F4B5D overlay).
 */

export const HOME_GRADIENT_BANNER_IMAGE_PATH = '/assets/home/home-gradient-banner.jpg';

export const HOME_GRADIENT_BANNER_MAX_WIDTH_PX = 560;

/** Align with `HomeAppBanner` — same inner container, flush start (no extra nudge). */
export const HOME_GRADIENT_BANNER_OFFSET_LEFT_PX = 0;

/** Figma 101:4129 — headline fill. */
export const HOME_GRADIENT_BANNER_HEADLINE_COLOR_HEX = '#fadd1a';

/** Responsive headline — smaller cap than original 110px; sits higher via banner layout. */
export const HOME_GRADIENT_BANNER_HEADLINE_FONT_SIZE_CLAMP =
  'clamp(1.25rem, 5.5vw, 56px)';

export const HOME_GRADIENT_BANNER_HEADLINE_LINE_HEIGHT_RATIO = '0.91';

/**
 * Visual shift for CTA label only (`translateX`); pill padding matches hero so the arrow chip stays right.
 */
export const HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX = -6;

/** CTA row nudge from bottom-left anchor: positive X = right, negative Y = up. */
export const HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_X_PX = 30;

export const HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_Y_PX = -10;

/** Matches `aspect-ratio: 56/37` with width 560px → height 370px. */
export const HOME_GRADIENT_BANNER_ASPECT_RATIO = '56 / 37';

export const HOME_GRADIENT_BANNER_RADIUS_PX = 20;

/** Overlay opacity so the photo stays visible under the slate tint (solid #2F4B5D would hide it). */
export const HOME_GRADIENT_BANNER_OVERLAY_OPACITY = 0.58;

export const HOME_GRADIENT_BANNER_BG_POSITION_X_PX = -64.382;

export const HOME_GRADIENT_BANNER_BG_POSITION_Y_PX = -178.168;

export const HOME_GRADIENT_BANNER_BG_SIZE_WIDTH_PERCENT = 120.455;

export const HOME_GRADIENT_BANNER_BG_SIZE_HEIGHT_PERCENT = 160.875;
