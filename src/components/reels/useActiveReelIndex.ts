'use client';

import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

import { REELS_FEED_SLIDE_ID_PREFIX } from './reels-vertical-feed.constants';

export function clampReelIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  if (!Number.isFinite(index)) {
    return 0;
  }
  return Math.max(0, Math.min(length - 1, Math.round(index)));
}

export function useActiveReelIndex(args: {
  containerRef: RefObject<HTMLDivElement | null>;
  initialIndex: number;
  itemCount: number;
  /** Defaults to `reel-slide-` (reels watch feed). Use a distinct prefix if another snap feed can mount. */
  slideIdPrefix?: string;
}): number {
  const slidePrefix = args.slideIdPrefix ?? REELS_FEED_SLIDE_ID_PREFIX;

  const [activeIndex, setActiveIndex] = useState(() =>
    clampReelIndex(args.initialIndex, args.itemCount),
  );

  useEffect(() => {
    setActiveIndex(clampReelIndex(args.initialIndex, args.itemCount));
  }, [args.initialIndex, args.itemCount]);

  useLayoutEffect(() => {
    const id = `${slidePrefix}${clampReelIndex(args.initialIndex, args.itemCount)}`;
    const el = document.getElementById(id);
    el?.scrollIntoView({ block: 'start' });
  }, [args.initialIndex, args.itemCount, slidePrefix]);

  useEffect(() => {
    const container = args.containerRef.current;
    if (!container) {
      return;
    }

    let rafId: number | null = null;
    const syncActiveIndex = () => {
      const ratio = container.scrollTop / Math.max(container.clientHeight, 1);
      setActiveIndex(clampReelIndex(ratio, args.itemCount));
      rafId = null;
    };
    const onScroll = () => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(syncActiveIndex);
    };

    syncActiveIndex();
    container.addEventListener('scroll', onScroll, { passive: true });
    const resizeObserver = new ResizeObserver(syncActiveIndex);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [args.containerRef, args.itemCount]);

  return activeIndex;
}
