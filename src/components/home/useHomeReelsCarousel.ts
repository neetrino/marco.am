import { useCallback, useEffect, useRef, useState } from 'react';

import { REELS_SCROLL_FRACTION } from './home-reels.constants';

/**
 * Horizontal REELS strip: syncs a two-dot pager with scroll position and exposes arrow scroll.
 */
export function useHomeReelsCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const syncFromScroller = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    const overflow = maxScroll > 1;
    setHasOverflow(overflow);
    if (!overflow) {
      setActivePageIndex(0);
      return;
    }
    const ratio = el.scrollLeft / maxScroll;
    setActivePageIndex(ratio < 0.5 ? 0 : 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    syncFromScroller();
    el.addEventListener('scroll', syncFromScroller, { passive: true });
    const ro = new ResizeObserver(() => {
      syncFromScroller();
    });
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', syncFromScroller);
      ro.disconnect();
    };
  }, [syncFromScroller]);

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
    activePageIndex,
    hasOverflow,
    scrollPrev: () => {
      scrollByDirection(-1);
    },
    scrollNext: () => {
      scrollByDirection(1);
    },
  };
}
