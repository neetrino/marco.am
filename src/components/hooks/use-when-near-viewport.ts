'use client';

import { useEffect, useState, type RefObject } from 'react';

type UseWhenNearViewportOptions = {
  /** IntersectionObserver rootMargin, e.g. `200px 0px` to prefetch before visible */
  readonly rootMargin?: string;
  readonly threshold?: number;
};

/**
 * Fires once when the target element intersects the viewport (optionally early via rootMargin).
 */
export function useWhenNearViewport(
  ref: RefObject<Element | null>,
  options?: UseWhenNearViewportOptions,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) {
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { root: null, rootMargin: options?.rootMargin ?? '0px', threshold: options?.threshold ?? 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, visible, options?.rootMargin, options?.threshold]);

  return visible;
}
