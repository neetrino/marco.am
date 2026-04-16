/**
 * Mobile bottom navigation — MARCO Figma (node 352:2852).
 * Bar background is white; yellow applies only to the active tab pill.
 */
export const MOBILE_NAV_BOX_SHADOW = '0 -4px 14px rgba(138, 138, 138, 0.07)';
export const MOBILE_NAV_ACTIVE_PILL_BG = '#facc15';
export const MOBILE_NAV_ACTIVE_FOREGROUND = '#020619';
export const MOBILE_NAV_INACTIVE_ICON = '#a2a2a2';

/**
 * Space reserved above the fixed bar so content clears it (matches row + bottom inset).
 * Uses max() to mirror the nav’s own safe-area padding.
 */
export const MOBILE_NAV_LAYOUT_PADDING_BOTTOM =
  'calc(3.875rem + max(0.5rem, env(safe-area-inset-bottom, 0px)))';
