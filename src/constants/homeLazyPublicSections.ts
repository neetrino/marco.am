/**
 * Home sections that load when near the viewport: treat fetched payload as fresh
 * for the whole session so remounting or scrolling back does not hit the network again.
 */
export const HOME_LAZY_PUBLIC_SECTION_STALE_MS = Number.POSITIVE_INFINITY;
