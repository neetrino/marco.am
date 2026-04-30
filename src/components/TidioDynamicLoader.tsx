'use client';

import dynamic from 'next/dynamic';

const TidioDeferredLoader = dynamic(
  () =>
    import('./TidioDeferredLoader').then((m) => ({
      default: m.TidioDeferredLoader,
    })),
  { ssr: false },
);

/**
 * Client-only dynamic wrapper so the Tidio script is not in the main server RSC payload.
 */
export function TidioDynamicLoader() {
  return <TidioDeferredLoader />;
}
