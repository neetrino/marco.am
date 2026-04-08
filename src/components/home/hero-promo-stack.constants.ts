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
 * **Tune chair height (vs blue layer):** raise this number = chair + floor shadow move up together.
 * Uses % of the stacked-card container height (~16px per 5% at lg width). Try 12–22.
 */
export const HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT = 16;

/** Figma baseline lift from stack bottom; keep in sync with `HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT`. */
const HERO_PROMO_CHAIR_BASE_BOTTOM_OFFSET_PCT = 7;

/**
 * Distance from container bottom to chair image box bottom (base + floor offset).
 * Percent of container height (same coordinate space as layer `top` / `height`).
 */
export const HERO_PROMO_CHAIR_BOTTOM_OFFSET_PCT =
  HERO_PROMO_CHAIR_BASE_BOTTOM_OFFSET_PCT + HERO_PROMO_FLOOR_GROUP_BOTTOM_OFFSET_PCT;

/** Container `aspect-ratio` — Figma stack width × vertical span */
export const HERO_PROMO_STACK_CONTAINER_ASPECT_W = 631;
export const HERO_PROMO_STACK_CONTAINER_ASPECT_H = HERO_PROMO_STACK_SPAN_PX;
