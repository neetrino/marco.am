'use client';

import { useCallback, useLayoutEffect, useRef, type Ref } from 'react';

import { HOME_PRODUCT_MOBILE_RAIL_PAGE_WIDTH_CSS_VAR } from './home-special-offers.constants';

function assignRef<T>(ref: Ref<T | null> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref && typeof ref === 'object' && 'current' in ref) {
    (ref as { current: T | null }).current = value;
  }
}

/**
 * Measures the horizontal scrollport in `useLayoutEffect` and sets {@link HOME_PRODUCT_MOBILE_RAIL_PAGE_WIDTH_CSS_VAR}
 * so each snap page is exactly one viewport wide (avoids %-in-flex rounding and the next slide peeking in).
 */
export function useHomeMobileProductRailScrollport(
  enabled: boolean,
  forwardedRef: Ref<HTMLDivElement | null>,
): (node: HTMLDivElement | null) => void {
  const localRef = useRef<HTMLDivElement | null>(null);

  const setScrollerRef = useCallback(
    (node: HTMLDivElement | null) => {
      localRef.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }
    const el = localRef.current;
    if (!el) {
      return;
    }

    const apply = (): void => {
      const w = el.clientWidth;
      if (w > 0) {
        el.style.setProperty(HOME_PRODUCT_MOBILE_RAIL_PAGE_WIDTH_CSS_VAR, `${w}px`);
      }
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      el.style.removeProperty(HOME_PRODUCT_MOBILE_RAIL_PAGE_WIDTH_CSS_VAR);
    };
  }, [enabled]);

  return setScrollerRef;
}
