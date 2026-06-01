/** First paint: ~3 rows on the widest grid (5 columns). */
export const REELS_PAGE_INITIAL_RENDER_BATCH_SIZE = 15;

/** Additional tiles per idle frame after the first batch. */
export const REELS_PAGE_RENDER_BATCH_SIZE = 12;

export const REELS_PAGE_RENDER_BATCH_DELAY_MS = 16;

/** Progressive paint when the feed is larger than a typical phone viewport. */
export const REELS_PAGE_PROGRESSIVE_RENDER_THRESHOLD = 12;

/** Eager poster load for the first visible row across breakpoints. */
export const REELS_PAGE_PRIORITY_TILE_COUNT = 5;

/** Only mount `<video>` for the active slide and immediate neighbors. */
export const REELS_FEED_VIDEO_WINDOW_RADIUS = 1;
