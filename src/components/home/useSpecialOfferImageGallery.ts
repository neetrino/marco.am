'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Snap-scroll gallery: syncs active index from scroll position and supports programmatic scroll.
 */
export function useSpecialOfferImageGallery(imageCount: number) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || imageCount === 0) {
      return;
    }
    const w = el.clientWidth;
    if (w === 0) {
      return;
    }
    const next = Math.round(el.scrollLeft / w);
    const clamped = Math.max(0, Math.min(imageCount - 1, next));
    setActiveIndex(clamped);
  }, [imageCount]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    el.addEventListener('scroll', syncIndexFromScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', syncIndexFromScroll);
    };
  }, [syncIndexFromScroll]);

  const goToIndex = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const w = el.clientWidth;
    el.scrollTo({ left: index * w, behavior: 'smooth' });
  }, []);

  return { scrollerRef, activeIndex, goToIndex };
}
