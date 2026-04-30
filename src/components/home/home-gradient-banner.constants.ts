/**
 * Slate banner — flat raster fill (`home-gradient-banner-bg.png`), #2F4B5D fallback while loading.
 */

export const HOME_GRADIENT_BANNER_IMAGE_PATH = '/assets/home/home-gradient-banner-bg.png';

/** First banner — between compact 420 and legacy 560. */
export const HOME_GRADIENT_BANNER_MAX_WIDTH_PX = 460;

/** Two-column row (`md`–`lg`): gradient stays narrower so the secondary panel is larger on iPad. */
export const HOME_GRADIENT_BANNER_MAX_WIDTH_TABLET_PX = 320;

/** Align with `HomeAppBanner` — same inner container, flush start (no extra nudge). */
export const HOME_GRADIENT_BANNER_OFFSET_LEFT_PX = 0;

/** Pull gradient + secondary banner block slightly up toward app banner above. */
export const HOME_GRADIENT_BANNER_SECTION_MARGIN_TOP_PX = -5;

/** Fallback while the slate PNG loads — `rgb(47 75 93)`. */
export const HOME_GRADIENT_BANNER_SURFACE_BASE_HEX = '#2f4b5d';

/** Figma 101:4129 — headline fill. */
export const HOME_GRADIENT_BANNER_HEADLINE_COLOR_HEX = '#fadd1a';

/** Responsive headline — scaled down with banner size. */
export const HOME_GRADIENT_BANNER_HEADLINE_FONT_SIZE_CLAMP =
  'clamp(1.08rem, 4.2vw, 46px)';

export const HOME_GRADIENT_BANNER_HEADLINE_LINE_HEIGHT_RATIO = '0.91';

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

/**
 * Russian (`ru`) — banner 1 CTA label on desktop (`lg` ≥ 1200px): smaller than `HOME_BANNERS_CTA_LABEL_FONT_SIZE_PX`.
 * Tailwind classes in `HomeGradientBannerCta` must match these values.
 */
export const HOME_GRADIENT_BANNER_CTA_LABEL_FONT_SIZE_RU_DESKTOP_PX = 12;

export const HOME_GRADIENT_BANNER_CTA_LABEL_LINE_HEIGHT_RU_DESKTOP_PX = 18;

/**
 * Russian (`ru`) — desktop only: extra `translateX` on the black chip only (px). Negative = left.
 * Must match `lg:-translate-x-[…px]` in `HomeGradientBannerCta`.
 */
export const HOME_GRADIENT_BANNER_CTA_ICON_CIRCLE_NUDGE_LEFT_RU_DESKTOP_PX = 4;

/**
 * Russian (`ru`) — desktop (`lg`): extra label `translateX` vs non-`lg` (px). Negative = left.
 * Non-`lg` net = `LABEL_NUDGE_LEFT_PX` + `LABEL_NUDGE_LEFT_RU_EXTRA_PX`; `lg` adds this value.
 */
export const HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_RU_DESKTOP_EXTRA_PX = -1;

/**
 * Armenian (`hy`) — desktop (`lg`): added to `HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_PX` for label `translateX` (px). Positive = right.
 * Tailwind `lg:translate-x-[…px]` net = base (-6) + this value; literals in `HomeGradientBannerCta` must match.
 */
export const HOME_GRADIENT_BANNER_CTA_LABEL_NUDGE_LEFT_HY_DESKTOP_EXTRA_PX = 8;

/**
 * Armenian (`hy`) — desktop: extra `translateX` on black chip (px). Negative = left; keep tiny so the chip stays inside the pill.
 * Tailwind `lg:-translate-x-[…px]` in `HomeGradientBannerCta` must match absolute value when negative.
 */
export const HOME_GRADIENT_BANNER_CTA_ICON_CIRCLE_NUDGE_RIGHT_HY_DESKTOP_PX = -1;

/** CTA row nudge from bottom-left anchor: positive X = right, negative Y = up. */
export const HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_X_PX = 30;

export const HOME_GRADIENT_BANNER_CTA_ROW_OFFSET_Y_PX = -10;

/**
 * English (`en`) — banner 1 «Buy now» pill on desktop (`lg` ≥ 1200px): `max-width` (px).
 * Must match `lg:max-w-[…px]` on the CTA `Link` in `HomeGradientBannerCta` (Tailwind JIT).
 */
export const HOME_GRADIENT_BANNER_CTA_MAX_WIDTH_EN_DESKTOP_PX = 162;

/** Slightly taller than 56/32 — a bit more visual mass. */
export const HOME_GRADIENT_BANNER_ASPECT_RATIO = '56 / 34';

export const HOME_GRADIENT_BANNER_RADIUS_PX = 16;
