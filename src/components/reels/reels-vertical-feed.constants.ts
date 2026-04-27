/**
 * Viewport-based slide height under global Header (+ mobile bottom nav inset on small screens).
 * Tuned for `src/app/layout.tsx` (sticky header + `MOBILE_NAV_LAYOUT_PADDING_BOTTOM`).
 */
export const REELS_FEED_SCROLL_CONTAINER_CLASS =
  'h-full overflow-y-auto snap-y snap-mandatory overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export const REELS_FEED_SLIDE_ID_PREFIX = 'reel-slide-';

/** Home modal preview feed — distinct ids from `/reels/watch` (`reel-slide-*`). */
export const HOME_REEL_PREVIEW_SLIDE_ID_PREFIX = 'home-reel-preview-';
