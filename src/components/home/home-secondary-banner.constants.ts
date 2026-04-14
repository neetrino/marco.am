/**
 * Figma 307:2232 — pale panel beside gradient banner (`kam-idris…` frame).
 */

export const HOME_SECONDARY_BANNER_BG_HEX = '#d8e4f2';

export const HOME_SECONDARY_BANNER_RADIUS_PX = 20;

/** Same height as gradient column when full-width in design (945×370). */
export const HOME_SECONDARY_BANNER_ASPECT_RATIO = '945 / 370';

/** Space between gradient and secondary banner (row + column stack). */
export const HOME_BANNERS_ROW_GAP_PX = 16;

/** Figma 307:2237 — «BANNER», reduced vs full-bleed 110px spec. */
export const HOME_SECONDARY_BANNER_HEADLINE_FONT_SIZE_CLAMP =
  'clamp(1.25rem, 5vw, 56px)';

export const HOME_SECONDARY_BANNER_HEADLINE_LINE_HEIGHT_RATIO = '0.91';

/** Secondary CTA target — dimensions match `HERO_MOBILE_SLATE_CTA_*` in `HomeSecondaryBannerCta`. */
export const HOME_SECONDARY_BANNER_CTA_HREF = '/products';

/** `margin-left` on yellow chip (px) — shift right as requested. */
export const HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX = 23;

/** Visual nudge for CTA label only (`translateX`); does not move the yellow chip. */
export const HOME_SECONDARY_BANNER_CTA_LABEL_NUDGE_RIGHT_PX = 6;

/** Whole CTA row offset: positive X = right, negative Y = up. */
export const HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_X_PX = 16;

export const HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_Y_PX = -14;
