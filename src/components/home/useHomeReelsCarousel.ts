import { useCallback, useEffect, useRef, useState } from 'react';

import { REELS_SCROLL_FRACTION } from './home-reels.constants';

function getReelsActivePageIndex(el: HTMLDivElement, pageCount: number): number {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 0) {
    return 0;
  }
  const ratio = el.scrollLeft / maxScroll;
  const n = pageCount;
  const idx = Math.min(n - 1, Math.floor(ratio * n));
  return idx;
}

export type UseHomeReelsCarouselOptions = {
  pageCount: number;
};

/**
 * Horizontal REELS strip: arrow scroll, pagination synced to scroll (`pageCount` segments).
 */
export function useHomeReelsCarousel({ pageCount }: UseHomeReelsCarouselOptions) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  const syncActivePage = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    setActivePage(getReelsActivePageIndex(el, pageCount));
  }, [pageCount]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    syncActivePage();
    el.addEventListener('scroll', syncActivePage, { passive: true });
    const ro = new ResizeObserver(syncActivePage);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', syncActivePage);
      ro.disconnect();
    };
  }, [syncActivePage]);

  useEffect(() => {
    syncActivePage();
  }, [pageCount, syncActivePage]);

  const scrollByDirection = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const delta = el.clientWidth * REELS_SCROLL_FRACTION * direction;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const scrollToPage = useCallback(
    (page: number) => {
      const el = scrollerRef.current;
      if (!el) {
        return;
      }
      const maxPage = pageCount - 1;
      const clamped = Math.max(0, Math.min(maxPage, page));
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      if (maxPage === 0) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      const left = (maxScroll * clamped) / maxPage;
      el.scrollTo({ left, behavior: 'smooth' });
    },
    [pageCount],
  );

  return {
    scrollerRef,
    activePage,
    scrollToPage,
    scrollPrev: () => {
      scrollByDirection(-1);
    },
    scrollNext: () => {
      scrollByDirection(1);
    },
  };
}
