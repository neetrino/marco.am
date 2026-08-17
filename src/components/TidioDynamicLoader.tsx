'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { cleanupTidioArtifacts } from '@/lib/tidio/tidio-script-loader';

const TidioDeferredLoader = dynamic(
  () =>
    import('./TidioDeferredLoader').then((m) => ({
      default: m.TidioDeferredLoader,
    })),
  { ssr: false },
);

const PROFILE_PATH_PREFIX = '/profile';
const REEL_WATCH_PATH_PREFIXES = ['/reels/watch', '/reel/watch'] as const;

function isProfilePath(pathname: string): boolean {
  return pathname === PROFILE_PATH_PREFIX || pathname.startsWith(`${PROFILE_PATH_PREFIX}/`);
}

function isReelWatchPath(pathname: string): boolean {
  return REEL_WATCH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Client-only dynamic wrapper so the Tidio script is not in the main server RSC payload.
 * Chat is storefront-only — cleaned up on hide routes and when leaving the storefront layout.
 */
export function TidioDynamicLoader() {
  const pathname = usePathname();
  const shouldHideTidio = isProfilePath(pathname) || isReelWatchPath(pathname);

  useEffect(() => {
    if (shouldHideTidio) {
      cleanupTidioArtifacts();
    }

    return () => {
      cleanupTidioArtifacts();
    };
  }, [shouldHideTidio]);

  if (shouldHideTidio) {
    return null;
  }

  return <TidioDeferredLoader />;
}
