/**
 * Slate banner — flat raster fill (`home-gradient-banner-bg.webp`), #2F4B5D fallback while loading.
 */

export const HOME_GRADIENT_BANNER_IMAGE_PATH = '/assets/home/home-gradient-banner-bg.webp';
/** Align with `HomeAppBanner` — same inner container, flush start (no extra nudge). */
export const HOME_GRADIENT_BANNER_OFFSET_LEFT_PX = 0;

/** Pull gradient + secondary banner block slightly up toward app banner above. */
export const HOME_GRADIENT_BANNER_SECTION_MARGIN_TOP_PX = -5;

/** Fallback while the slate PNG loads — `rgb(47 75 93)`. */
export const HOME_GRADIENT_BANNER_SURFACE_BASE_HEX = '#2f4b5d';
/**
 * Visual shift for CTA label only (`translateX`); pill padding matches hero so the arrow chip stays right.
 */
export const HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX = -6;

/**
 * Russian (`ru`) — extra `translateX` on the label (px). Negative moves text left; slightly less than before.
 */
export const HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_RU_EXTRA_PX = -11;

/**
 * Russian (`ru`) — extra pull on the black arrow chip toward the left (px), added to `HOME_BANNERS_CTA_ICON_PULL_LEFT_PX`.
 */
export const HOME_GRADIENT_BANNER_CTA_ICON_PULL_LEFT_RU_EXTRA_PX = 8;

/**
 * Gradient (left) banner CTA only — slack chip inset from the pill’s inline-end at rest (px).
 * `0` keeps the chip flush to the pill cap; secondary CTAs omit this prop so their slack stays flush.
 */
export const HOME_GRADIENT_BANNER_CTA_SLACK_REST_INSET_INLINE_END_PX = 0;

/** Gradient (left) banner CTA only — slack stop inset from inline-start on hover end (px). */
export const HOME_GRADIENT_BANNER_CTA_SLACK_HOVER_END_INSET_INLINE_START_PX = 12;

/** Russian (`ru`) — black circle + glyph slightly smaller than default banner CTA. */
export const HOME_GRADIENT_BANNER_CTA_ICON_CIRCLE_RU_PX = 34;

export const HOME_GRADIENT_BANNER_CTA_ARROW_ICON_RU_PX = 17;
/** CTA row nudge from bottom-left anchor: positive X = right, negative Y = up. */
export const HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_X_PX = 30;

export const HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_Y_PX = -10;
/** Slightly taller than 56/32 — a bit more visual mass. */
export const HOME_GRADIENT_BANNER_ASPECT_RATIO = '56 / 34';

export const HOME_GRADIENT_BANNER_RADIUS_PX = 16;
