'use client';

import { useLayoutEffect, useState } from 'react';
import { getShouldHideHeaderSocialLinks } from '../../lib/is-ipad-os';

/**
 * Large iPad class (iPad Pro–sized layout): hide header social icons. SSR false; updates on resize.
 */
export function useShouldHideHeaderSocialLinks(): boolean {
  const [hide, setHide] = useState(false);

  useLayoutEffect(() => {
    const sync = () => {
      setHide(getShouldHideHeaderSocialLinks());
    };
    sync();
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('resize', sync);
    };
  }, []);

  return hide;
}
