'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getUseMobileHeaderChrome } from '../../lib/is-ipad-os';
import { HEADER_COMPACT_PRIMARY_NAV_MAX_WIDTH_PX, isHeaderRow2TabletLike } from './header.constants';

/**
 * Viewport width, tablet/iPad mobile chrome, compact top bar, row-2 tablet styling flags.
 */
export function useHeaderLayoutMetrics() {
  const [viewportWidth, setViewportWidth] = useState<number | null>(() =>
    typeof window !== 'undefined' ? window.innerWidth : null
  );

  const [mobileHeaderChrome, setMobileHeaderChrome] = useState(() =>
    typeof window !== 'undefined' ? getUseMobileHeaderChrome() : false
  );

  const [compactPrimaryNav, setCompactPrimaryNav] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    if (getUseMobileHeaderChrome()) {
      return true;
    }
    return window.innerWidth <= HEADER_COMPACT_PRIMARY_NAV_MAX_WIDTH_PX;
  });

  const desktopTopRowInnerRef = useRef<HTMLDivElement | null>(null);
  const desktopTopRowMeasureRef = useRef<HTMLDivElement | null>(null);

  const headerMobileLike = mobileHeaderChrome;

  const row2TabletLike = useMemo(() => {
    if (headerMobileLike) {
      return false;
    }
    return isHeaderRow2TabletLike(viewportWidth, false);
  }, [headerMobileLike, viewportWidth]);

  useLayoutEffect(() => {
    const syncViewportAndChrome = () => {
      setViewportWidth(window.innerWidth);
      setMobileHeaderChrome(getUseMobileHeaderChrome());
    };

    syncViewportAndChrome();
    window.addEventListener('resize', syncViewportAndChrome);
    return () => {
      window.removeEventListener('resize', syncViewportAndChrome);
    };
  }, []);

  useLayoutEffect(() => {
    if (viewportWidth === null) {
      return;
    }

    const evaluateCompactPrimaryNav = () => {
      const w = window.innerWidth;
      if (getUseMobileHeaderChrome()) {
        setCompactPrimaryNav(true);
        return;
      }
      if (w <= HEADER_COMPACT_PRIMARY_NAV_MAX_WIDTH_PX) {
        setCompactPrimaryNav(true);
        return;
      }
      const row = desktopTopRowInnerRef.current ?? desktopTopRowMeasureRef.current;
      if (!row) {
        setCompactPrimaryNav(false);
        return;
      }
      setCompactPrimaryNav(row.scrollWidth > row.clientWidth + 1);
    };

    evaluateCompactPrimaryNav();

    window.addEventListener('resize', evaluateCompactPrimaryNav);
    const observer = new ResizeObserver(evaluateCompactPrimaryNav);
    const row = desktopTopRowInnerRef.current ?? desktopTopRowMeasureRef.current;
    if (row) {
      observer.observe(row);
    }

    return () => {
      window.removeEventListener('resize', evaluateCompactPrimaryNav);
      observer.disconnect();
    };
  }, [viewportWidth, mobileHeaderChrome]);

  return {
    viewportWidth,
    compactPrimaryNav,
    desktopTopRowInnerRef,
    desktopTopRowMeasureRef,
    headerMobileLike,
    row2TabletLike,
  };
}
