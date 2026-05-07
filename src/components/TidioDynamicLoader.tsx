'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TidioDeferredLoader = dynamic(
  () =>
    import('./TidioDeferredLoader').then((m) => ({
      default: m.TidioDeferredLoader,
    })),
  { ssr: false },
);

const ADMIN_PATH_PREFIX = '/supersudo';
const PROFILE_PATH_PREFIX = '/profile';
const REEL_WATCH_PATH_PREFIXES = ['/reels/watch', '/reel/watch'] as const;

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_PATH_PREFIX || pathname.startsWith(`${ADMIN_PATH_PREFIX}/`);
}

function isProfilePath(pathname: string): boolean {
  return pathname === PROFILE_PATH_PREFIX || pathname.startsWith(`${PROFILE_PATH_PREFIX}/`);
}

function isReelWatchPath(pathname: string): boolean {
  return REEL_WATCH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function cleanupTidioArtifacts(): void {
  const selectors = [
    '#tidio-widget-js',
    '#marco-tidio-mobile-offset',
    '#tidio',
    '#tidio-chat',
    '#tidio-chat-iframe',
    'iframe[src*="tidio.co"]',
    '[id^="tidio-"]',
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const tidioWindow = window as Window & {
    tidioChat?: unknown;
    tidioChatApi?: unknown;
    tidioChatReady?: unknown;
  };
  delete tidioWindow.tidioChat;
  delete tidioWindow.tidioChatApi;
  delete tidioWindow.tidioChatReady;
}

/**
 * Client-only dynamic wrapper so the Tidio script is not in the main server RSC payload.
 */
export function TidioDynamicLoader() {
  const pathname = usePathname();
  const isAdmin = isAdminPath(pathname);
  const isProfile = isProfilePath(pathname);
  const isReelWatch = isReelWatchPath(pathname);
  const shouldHideTidio = isAdmin || isProfile || isReelWatch;

  useEffect(() => {
    if (!shouldHideTidio) {
      return;
    }
    cleanupTidioArtifacts();
  }, [shouldHideTidio]);

  if (shouldHideTidio) {
    return null;
  }

  return <TidioDeferredLoader />;
}
