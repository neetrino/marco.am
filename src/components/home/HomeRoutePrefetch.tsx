'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * After first paint, prefetch likely next routes so in-app navigation feels instant.
 */
export function HomeRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    const run = () => {
      router.prefetch('/products');
      router.prefetch('/cart');
      router.prefetch('/reels');
    };
    const w = typeof window !== 'undefined' ? window : null;
    if (!w) {
      return;
    }
    if ('requestIdleCallback' in w) {
      const id = w.requestIdleCallback(run, { timeout: 2500 });
      return () => w.cancelIdleCallback(id);
    }
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, [router]);

  return null;
}
