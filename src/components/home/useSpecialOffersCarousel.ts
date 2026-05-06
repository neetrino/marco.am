import { useCallback, useEffect, useRef, useState } from 'react';

import { bindPointerDragHorizontalScroll } from './horizontalRailWheelScroll';
import { useSpecialOffersRailSlotWidth } from './useSpecialOffersRailSlotWidth';

function getActivePageIndex(el: HTMLDivElement, pageCount: number): number {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 0) {
    return 0;
  }
  const ratio = el.scrollLeft / maxScroll;
  if (pageCount <= 1) {
    return 0;
  }
  return Math.min(pageCount - 1, Math.floor(ratio * pageCount));
}

export interface UseSpecialOffersCarouselOptions {
  /** When false, scroller is unmounted — clear measured slot width. */
  isRailVisible: boolean;
  /** Pagination dots / scroll segments (2 on `md+`, 3 on `max-md`). */
  paginationPageCount: number;
}

/**
 * Horizontal special-offers strip: arrow scroll, pagination synced to scroll segments.
 */
export function useSpecialOffersCarousel(options: UseSpecialOffersCarouselOptions) {
  const { isRailVisible, paginationPageCount } = options;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const railSlotWidthPx = useSpecialOffersRailSlotWidth(scrollerRef, isRailVisible);

  const syncActivePage = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    setActivePage(getActivePageIndex(el, paginationPageCount));
  }, [paginationPageCount]);

  const scrollToPage = useCallback(
    (page: number) => {
      const el = scrollerRef.current;
      if (!el) {
        return;
      }
      const maxPage = paginationPageCount - 1;
      const clamped = Math.max(0, Math.min(maxPage, page));
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      if (maxPage <= 0) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      const left = (maxScroll * clamped) / maxPage;
      el.scrollTo({ left, behavior: 'smooth' });
    },
    [paginationPageCount],
  );

  useEffect(() => {
    if (!isRailVisible) {
      return;
    }
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    syncActivePage();
    el.addEventListener('scroll', syncActivePage, { passive: true });
    const ro = new ResizeObserver(syncActivePage);
    ro.observe(el);
    const unbindDrag = bindPointerDragHorizontalScroll(el);

    return () => {
      el.removeEventListener('scroll', syncActivePage);
      ro.disconnect();
      unbindDrag();
    };
  }, [isRailVisible, syncActivePage]);

  const scrollByDirection = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const maxPage = paginationPageCount - 1;
    if (maxPage <= 0) {
      return;
    }
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    if (maxScroll <= 0) {
      return;
    }
    const currentPage = Math.round((el.scrollLeft / maxScroll) * maxPage);
    scrollToPage(currentPage + direction);
  }, [paginationPageCount, scrollToPage]);

  return {
    scrollerRef,
    railSlotWidthPx,
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
