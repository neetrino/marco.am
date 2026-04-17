/** HttpOnly cookie for anonymous wishlist persistence (session-scoped). */
export const WISHLIST_SESSION_COOKIE_NAME = "shop_wishlist_session";

/**
 * Optional header when cookies are unavailable (same opaque value as cookie).
 * Use lowercase; fetch normalizes header names.
 */
export const WISHLIST_SESSION_HEADER_NAME = "x-wishlist-session";

/** Sliding session length for guest wishlists. */
export const WISHLIST_SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

/** Hard cap to limit abuse of anonymous wishlist rows. */
export const WISHLIST_MAX_ITEMS = 200;
