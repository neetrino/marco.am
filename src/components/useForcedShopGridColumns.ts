'use client';

import { useEffect, useState } from 'react';
import { getIsIpadOs } from '../lib/is-ipad-os';

/**
 * Shop grid lock on iPadOS and other coarse-pointer tablets:
 * - **2** columns: width 744–1023px (iPad, iPad mini).
 * - **3** columns: width ≥1024px (iPad Pro 12.9″ portrait, Pro 11″ landscape, etc.).
 * iPadOS is detected explicitly so Safari’s `(pointer: fine)` still locks the grid.
 * - **null**: phones (&lt;744), or non-tablet with **fine pointer** (desktop) — view-mode toggles stay.
 */
export function useForcedShopGridColumns(): 2 | 3 | null {
  const [cols, setCols] = useState<2 | 3 | null>(null);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 744) {
        setCols(null);
        return;
      }
      if (getIsIpadOs()) {
        setCols(w >= 1024 ? 3 : 2);
        return;
      }
      if (window.matchMedia('(pointer: fine)').matches) {
        setCols(null);
        return;
      }
      setCols(w >= 1024 ? 3 : 2);
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return cols;
}
