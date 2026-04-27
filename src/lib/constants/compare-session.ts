/** HttpOnly cookie for anonymous compare-list persistence. */
export const COMPARE_SESSION_COOKIE_NAME = "shop_compare_session";

/**
 * Optional header when cookies are unavailable (same opaque value as cookie).
 * Use lowercase; fetch normalizes header names.
 */
export const COMPARE_SESSION_HEADER_NAME = "x-compare-session";

/** Sliding session length for guest compare lists. */
export const COMPARE_SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

/** Max products per category within one compare list. */
export const COMPARE_MAX_PER_CATEGORY = 4;

/** Safety cap for total rows in one compare list (all categories). */
export const COMPARE_MAX_LIST_ITEMS = 48;

/**
 * @deprecated Prefer `COMPARE_MAX_PER_CATEGORY` / `COMPARE_MAX_LIST_ITEMS`.
 * Kept for docs and older error strings meaning “per-slot limit”.
 */
export const COMPARE_MAX_ITEMS = COMPARE_MAX_PER_CATEGORY;
