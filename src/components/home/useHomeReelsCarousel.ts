import { useCallback, useRef } from 'react';

import { REELS_SCROLL_FRACTION } from './home-reels.constants';

/**
 * Horizontal REELS strip: arrow buttons scroll the row.
 */
export function useHomeReelsCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByDirection = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const delta = el.clientWidth * REELS_SCROLL_FRACTION * direction;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  return {
    scrollerRef,
    scrollPrev: () => {
      scrollByDirection(-1);
    },
    scrollNext: () => {
      scrollByDirection(1);
    },
  };
}
