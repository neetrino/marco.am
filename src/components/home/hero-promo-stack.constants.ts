/**
 * Figma MARCO — stacked layers 101:4019 (white), 101:4020 (gray), 101:4021 (blue) + chair 101:4023.
 * Vertical span from top of 101:4019 (y=679) to bottom of 101:4021 in design px.
 */

/** Matches Figma `rounded-[36px]` on rectangles 101:4019–101:4021 */
export const HERO_PROMO_STACK_RADIUS_PX = 36;

/** Design px — bottom of blue layer minus top of white layer */
export const HERO_PROMO_STACK_SPAN_PX = 804.42236328125 + 480.998046875 - 679;

/** White — 101:4019 */
export const HERO_PROMO_STACK_WHITE_TOP_PX = 0;
export const HERO_PROMO_STACK_WHITE_HEIGHT_PX = 475;

/** Gray — 101:4020 */
export const HERO_PROMO_STACK_GRAY_TOP_PX = 737 - 679;
export const HERO_PROMO_STACK_GRAY_HEIGHT_PX = 477;

/** Blue — 101:4021 */
export const HERO_PROMO_STACK_BLUE_TOP_PX = 804.42236328125 - 679;
export const HERO_PROMO_STACK_BLUE_HEIGHT_PX = 480.998046875;

function toPercent(part: number): number {
  return (part / HERO_PROMO_STACK_SPAN_PX) * 100;
}

/** CSS percentage strings for `top` / `height` inside the stack container */
export const HERO_PROMO_STACK_WHITE_STYLE = {
  top: `${toPercent(HERO_PROMO_STACK_WHITE_TOP_PX)}%`,
  height: `${toPercent(HERO_PROMO_STACK_WHITE_HEIGHT_PX)}%`,
} as const;

export const HERO_PROMO_STACK_GRAY_STYLE = {
  top: `${toPercent(HERO_PROMO_STACK_GRAY_TOP_PX)}%`,
  height: `${toPercent(HERO_PROMO_STACK_GRAY_HEIGHT_PX)}%`,
} as const;

export const HERO_PROMO_STACK_BLUE_STYLE = {
  top: `${toPercent(HERO_PROMO_STACK_BLUE_TOP_PX)}%`,
  height: `${toPercent(HERO_PROMO_STACK_BLUE_HEIGHT_PX)}%`,
} as const;

/** Chair image — 101:4023; width vs stack width 631 */
export const HERO_PROMO_CHAIR_WIDTH_RATIO = 563.1322631835938 / 631;

/** Chair bounding height vs stack span (Figma frame height) */
export const HERO_PROMO_CHAIR_HEIGHT_RATIO = 563.1322631835938 / HERO_PROMO_STACK_SPAN_PX;

/** Figma 101:4024 Group 3 — width matches ellipse; height includes ellipse + handle */
export const HERO_PROMO_FLOOR_GROUP_WIDTH_PX = 403.66119384765625;
export const HERO_PROMO_FLOOR_GROUP_HEIGHT_PX = 165.08383178710938;

/** Group 3 vs stack frame */
export const HERO_PROMO_CHAIR_SHADOW_WIDTH_RATIO = HERO_PROMO_FLOOR_GROUP_WIDTH_PX / 631;
export const HERO_PROMO_FLOOR_GROUP_HEIGHT_RATIO =
  HERO_PROMO_FLOOR_GROUP_HEIGHT_PX / HERO_PROMO_STACK_SPAN_PX;

/** Ellipse 101:4025 height share inside Group 3 */
export const HERO_PROMO_SHADOW_IN_GROUP_HEIGHT_RATIO = 147.012 / HERO_PROMO_FLOOR_GROUP_HEIGHT_PX;

/**
 * Handle 101:4026 — centered on ellipse; top offset within Group 3 (design px).
 * Sits on the horizontal “line” of the oval (Figma y 630.12 vs Group 3 top 502.41).
 */
export const HERO_PROMO_SLIDER_HANDLE_TOP_PCT =
  ((630.1226348876953 - 502.4148254394531) / HERO_PROMO_FLOOR_GROUP_HEIGHT_PX) * 100;

export const HERO_PROMO_SLIDER_HANDLE_WIDTH_PCT =
  (37.376033782958984 / HERO_PROMO_FLOOR_GROUP_WIDTH_PX) * 100;

/**
 * **Floor shadow (101:4025) + handle (101:4026) only.** Larger = group sits higher on the card.
 * Chair position is `HERO_PROMO_CHAIR_BOTTOM_OFFSET_PCT` — decoupled so the ellipse can move without moving the chair.
 */
export const HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT = 28;

/**
 * Distance from container bottom to chair image box bottom (percent of container height).
 * Previously 7 + 16; kept fixed when tuning `HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT`.
 */
export const HERO_PROMO_CHAIR_BOTTOM_OFFSET_PCT = 30;

/** Nudge chair + floor arc (shadow + handle) upward vs percent-based layout (px). */
export const HERO_PROMO_CHAIR_NUDGE_UP_PX = 6;

/**
 * Scales chair + floor overlay vs Figma (1 = design). Lower = smaller asset, more margin inside the stack.
 */
export const HERO_PROMO_CHAIR_GROUP_SCALE = 0.88;

/** Container `aspect-ratio` — Figma stack width × vertical span */
export const HERO_PROMO_STACK_CONTAINER_ASPECT_W = 631;
export const HERO_PROMO_STACK_CONTAINER_ASPECT_H = HERO_PROMO_STACK_SPAN_PX;

/** Figma 305:2147 / stack frame — max link width matches design (px) */
export const HERO_PROMO_STACK_LINK_MAX_WIDTH_PX = HERO_PROMO_STACK_CONTAINER_ASPECT_W;

const BLUE_TOP_PCT = toPercent(HERO_PROMO_STACK_BLUE_TOP_PX);
const BLUE_HEIGHT_PCT = toPercent(HERO_PROMO_STACK_BLUE_HEIGHT_PX);

const chairScale = HERO_PROMO_CHAIR_GROUP_SCALE;
const fgHeightPct = HERO_PROMO_FLOOR_GROUP_HEIGHT_RATIO * chairScale * 100;
const fgWidthPct = HERO_PROMO_CHAIR_SHADOW_WIDTH_RATIO * chairScale * 100;
const fgTopFromStackTopPct = 100 - HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT - fgHeightPct;

const handleTopFromStackTopPct =
  fgTopFromStackTopPct + (HERO_PROMO_SLIDER_HANDLE_TOP_PCT / 100) * fgHeightPct;

/** Handle knob is square; size follows width as % of floor group → % of stack width. */
const handleSizePct = (HERO_PROMO_SLIDER_HANDLE_WIDTH_PCT / 100) * fgWidthPct;

const handleCenterFromStackTopPct = handleTopFromStackTopPct + handleSizePct / 2;

/**
 * Vertical center of the CTA pill inside the blue layer (% of blue height from blue top).
 * Midpoint between the slider handle center and the bottom of the stack frame.
 */
export const HERO_PROMO_STACK_CTA_CENTER_FROM_BLUE_TOP_PCT =
  ((handleCenterFromStackTopPct + 100) / 2 - BLUE_TOP_PCT) / BLUE_HEIGHT_PCT * 100;

/** Matches Tailwind `right-6` before `HERO_PROMO_STACK_CTA_RIGHT_EXTRA_PX`. */
export const HERO_PROMO_STACK_CTA_RIGHT_BASE_REM = 1.5;

/** Added to the base right inset so the CTA sits slightly left for optical balance. */
export const HERO_PROMO_STACK_CTA_RIGHT_EXTRA_PX = 3;

/** Added inside `translateY(calc(-50% + …))` to nudge the CTA slightly down. */
export const HERO_PROMO_STACK_CTA_NUDGE_DOWN_PX = 7;
