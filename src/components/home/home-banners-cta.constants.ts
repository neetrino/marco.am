/**
 * CTA pills on gradient + secondary home banners — slightly smaller than `HERO_MOBILE_SLATE_CTA_*` in `hero.constants`.
 */

export const HOME_BANNERS_CTA_HEIGHT_PX = 48;

export const HOME_BANNERS_CTA_WIDTH_PX = 170;

/**
 * English (`en`) — desktop (`lg` ≥ 1200px): narrower pill than `HOME_BANNERS_CTA_WIDTH_PX` (trim from right).
 * Tailwind `lg:max-w-[…px]` on gradient + secondary banner CTAs must match.
 */
export const HOME_BANNERS_CTA_MAX_WIDTH_EN_DESKTOP_PX = 154;

export const HOME_BANNERS_CTA_ICON_CIRCLE_PX = 36;

export const HOME_BANNERS_CTA_PILL_RADIUS_PX = HOME_BANNERS_CTA_HEIGHT_PX / 2;

export const HOME_BANNERS_CTA_PADDING_LEFT_PX = 34;

/**
 * Hover slack chip stops this many px from the pill’s inner inline-start (`0` = flush to cap).
 */
export const HOME_BANNERS_CTA_SLACK_HOVER_END_INSET_PX = 0;

/**
 * Extra left travel (px) after compensating track padding — clears subpixels / chip margins.
 */
export const HOME_BANNERS_CTA_SLACK_TRAVEL_MICRO_PX = 4;

/**
 * Label shifts this many px toward inline-end only during slack hover/focus (LTR = right),
 * same duration/easing as the chip trail.
 */
export const HOME_BANNERS_CTA_SLACK_LABEL_SHIFT_ON_HOVER_PX = 11;

/** Trail + chip horizontal motion + matching label/chip color transitions (ms). */
export const HOME_BANNERS_CTA_SLACK_MOTION_DURATION_MS = 520;

/**
 * Easing for slack motion — strong ease-out so the chip settles softly at the far cap.
 * Used as `--slack-ease` on `HomeFloorBannerSlackCtaLink`.
 */
export const HOME_BANNERS_CTA_SLACK_MOTION_EASING_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)' as const;

export const HOME_BANNERS_CTA_PADDING_RIGHT_PX = 0;

export const HOME_BANNERS_CTA_LABEL_ICON_GAP_PX = 6;

export const HOME_BANNERS_CTA_ARROW_ICON_PX = 18;

/** Overlap of icon circle into label area (same idea as hero slate CTA). */
export const HOME_BANNERS_CTA_ICON_PULL_LEFT_PX = 2;

/** Label — slightly smaller on mobile so long localized CTAs fit more comfortably. */
export const HOME_BANNERS_CTA_LABEL_FONT_SIZE_PX = 13;

export const HOME_BANNERS_CTA_LABEL_LINE_HEIGHT_PX = 20;
