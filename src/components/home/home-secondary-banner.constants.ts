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
/** Secondary CTA target — pill size from `home-banners-cta.constants`. */
export const HOME_SECONDARY_BANNER_CTA_HREF = '/products';

/**
 * Secondary banner only — `HomeFloorBannerSlackCtaLink` `--slack-stop-pad` on hover/focus (px).
 * Inset from the pill’s inline-start where the slack chip settles; larger = final hover position nudges right.
 * Rest position is unchanged.
 */
export const HOME_SECONDARY_BANNER_CTA_SLACK_HOVER_END_INSET_INLINE_START_PX = 10;
/** `margin-left` on yellow chip (px); lower = chip sits closer to the pill’s inline-end. */
export const HOME_SECONDARY_BANNER_CTA_ICON_MARGIN_LEFT_PX = 8;

/** Visual nudge for CTA label only (`translateX`); does not move the yellow chip. */
export const HOME_SECONDARY_BANNER_CTA_LABEL_NUDGE_RIGHT_PX = 6;
/** Whole CTA row offset: positive X = right, negative Y = up. */
export const HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_X_PX = 19;

export const HOME_SECONDARY_BANNER_CTA_ROW_OFFSET_Y_PX = -14;
