import { useCallback, useEffect, useRef, useState } from 'react';

import { SPECIAL_OFFERS_SCROLL_FRACTION } from './home-special-offers.constants';

function getActivePageIndex(el: HTMLDivElement): 0 | 1 {
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 0) {
    return 0;
  }
  return el.scrollLeft / maxScroll < 0.5 ? 0 : 1;
}

/**
 * Horizontal special-offers strip: arrow scroll and two-step pagination (Figma).
 */
export function useSpecialOffersCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState<0 | 1>(0);

  const syncActivePage = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    setActivePage(getActivePageIndex(el));
  }, []);

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

  const scrollByDirection = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const delta = el.clientWidth * SPECIAL_OFFERS_SCROLL_FRACTION * direction;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const scrollToPage = useCallback((page: 0 | 1) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = page === 0 ? 0 : maxScroll;
    el.scrollTo({ left, behavior: 'smooth' });
  }, []);

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
