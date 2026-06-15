'use client';

import { useEffect, useState, type ReactNode } from 'react';

const DESKTOP_FILTERS_MEDIA_QUERY = '(min-width: 744px)';

type ProductsDesktopFiltersMountProps = {
  readonly children: ReactNode;
};

export function ProductsDesktopFiltersMount({ children }: ProductsDesktopFiltersMountProps) {
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_FILTERS_MEDIA_QUERY);
    const sync = () => {
      setShouldMount(media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  if (!shouldMount) {
    return null;
  }

  return <>{children}</>;
}
