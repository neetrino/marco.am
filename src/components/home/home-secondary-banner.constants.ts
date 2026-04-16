/**
 * Figma 307:2232 — pale panel beside gradient banner (`kam-idris…` frame).
 */

export const HOME_SECONDARY_BANNER_BG_HEX = '#d8e4f2';

export const HOME_SECONDARY_BANNER_RADIUS_PX = 16;

/** Space between gradient and secondary banner (row + column stack). */
export const HOME_BANNERS_ROW_GAP_PX = 16;

/**
 * md–lg: narrow first column (320px) so the secondary banner is wider on iPad.
 * lg+: `460px` + `1fr` (Figma). Values align with `HOME_GRADIENT_BANNER_MAX_WIDTH_*` in
 * `home-gradient-banner.constants.ts`. Below md, `grid-cols-1` stacks.
 */
export const HOME_BANNERS_TWO_COL_GRID_CLASS =
  'md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]';

/** Stacked layout — only when single column (`max-md`); beside gradient from `md+`. */
export const HOME_SECONDARY_BANNER_STACK_ASPECT_CLASS = 'max-md:aspect-[820/328]';

/** Figma 307:2237 — «BANNER», scaled with banner row. */
export const HOME_SECONDARY_BANNER_HEADLINE_FONT_SIZE_CLAMP =
  'clamp(1.08rem, 4vw, 46px)';

export const HOME_SECONDARY_BANNER_HEADLINE_LINE_HEIGHT_RATIO = '0.91';

/** Secondary CTA target — pill size from `home-banners-cta.constants`. */
export const HOME_SECONDARY_BANNER_CTA_HREF = '/products';

/** `margin-left` on yellow chip (px) — shift right; scaled with `HOME_BANNERS_CTA_*`. */
export const HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX = 23;

/** Visual nudge for CTA label only (`translateX`); does not move the yellow chip. */
export const HOME_SECONDARY_BANNER_CTA_LABEL_NUDGE_RIGHT_PX = 6;

/**
 * Armenian (`hy`) — desktop (`lg`): label `translateX` at `lg` (px). Positive = right. Tailwind `lg:translate-x-[…px]` must match.
 */
export const HOME_SECONDARY_BANNER_CTA_LABEL_TRANSLATE_X_HY_DESKTOP_PX = 14;

/**
 * Armenian (`hy`) — desktop: label size (px). Tailwind `lg:text-*` / `lg:leading-*` must match.
 */
export const HOME_SECONDARY_BANNER_CTA_LABEL_FONT_SIZE_HY_DESKTOP_PX = 15;

export const HOME_SECONDARY_BANNER_CTA_LABEL_LINE_HEIGHT_HY_DESKTOP_PX = 22;

/**
 * Armenian (`hy`) — secondary banner CTA on desktop (`lg` ≥ 1200px): narrower pill than `HOME_BANNERS_CTA_WIDTH_PX`.
 * Tailwind `lg:max-w-[…px]` in `HomeSecondaryBannerCta` must match.
 */
export const HOME_SECONDARY_BANNER_CTA_MAX_WIDTH_HY_DESKTOP_PX = 158;

/**
 * Armenian (`hy`) — desktop: left padding inside pill (px). Tailwind `lg:pl-[…px]` must match.
 */
export const HOME_SECONDARY_BANNER_CTA_PADDING_LEFT_HY_DESKTOP_PX = 26;

/**
 * Armenian (`hy`) — desktop (`lg`): extra `translateX` on yellow chip (px). Negative = left.
 * Applied on top of inline `margin-left: HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX` (23). Tailwind `lg:-translate-x-[…px]` must match absolute value.
 */
export const HOME_SECONDARY_BANNER_CTA_ICON_TRANSLATE_X_HY_DESKTOP_PX = -3;

/** Whole CTA row offset: positive X = right, negative Y = up. */
export const HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_X_PX = 19;

export const HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_Y_PX = -14;
