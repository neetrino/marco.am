'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

const DESKTOP_FILTERS_MEDIA_QUERY = '(min-width: 744px)';

function subscribeDesktopFiltersMedia(listener: () => void): () => void {
  const media = window.matchMedia(DESKTOP_FILTERS_MEDIA_QUERY);
  media.addEventListener('change', listener);
  return () => {
    media.removeEventListener('change', listener);
  };
}

function getDesktopFiltersShouldMount(): boolean {
  return window.matchMedia(DESKTOP_FILTERS_MEDIA_QUERY).matches;
}

/** Server and first hydrated paint — avoids SSR/client HTML mismatch. */
function getDesktopFiltersServerSnapshot(): boolean {
  return false;
}

type ProductsDesktopFiltersMountProps = {
  readonly children: ReactNode;
};

export function ProductsDesktopFiltersMount({ children }: ProductsDesktopFiltersMountProps) {
  const shouldMount = useSyncExternalStore(
    subscribeDesktopFiltersMedia,
    getDesktopFiltersShouldMount,
    getDesktopFiltersServerSnapshot,
  );

  if (!shouldMount) {
    return null;
  }

  return <>{children}</>;
}
