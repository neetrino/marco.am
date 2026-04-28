/**
 * Mobile bottom navigation — MARCO Figma (node 352:2693).
 * Bar background is white; yellow applies only to the active tab pill.
 */

/** Primary destinations shown in `MobileBottomNav` — omit from `HeaderMobileDrawer` to avoid duplication. */
export const MOBILE_FLOOR_NAV_HREFS = ['/', '/wishlist', '/cart', '/profile'] as const;

export const MOBILE_NAV_BOX_SHADOW = '0 -4px 14px rgba(138, 138, 138, 0.07)';
export const MOBILE_NAV_ACTIVE_PILL_BG = '#facc15';
export const MOBILE_NAV_ACTIVE_FOREGROUND = '#020619';
export const MOBILE_NAV_INACTIVE_ICON = '#a2a2a2';
/** iOS-style home indicator (Figma “iphone status”). */
export const MOBILE_NAV_HOME_INDICATOR_BG = '#c8c8c8';
export const MOBILE_NAV_TOP_CORNER_RADIUS_PX = 24;

/**
 * Space reserved above the fixed bar so content clears it (row + home indicator + bottom inset).
 */
export const MOBILE_NAV_LAYOUT_PADDING_BOTTOM =
  'calc(4.875rem + max(0.5rem, env(safe-area-inset-bottom, 0px)))';

/**
 * Tidio (and similar) `bottom` offset on viewports where `MobileBottomNav` is shown (`lg:hidden`).
 * Matches layout padding plus a small gap so the chat bubble does not cover the profile tab.
 */
export const MOBILE_NAV_OVERLAY_WIDGET_BOTTOM =
  'calc(4.875rem + max(0.5rem, env(safe-area-inset-bottom, 0px)) + 12px)';
