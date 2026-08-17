'use client';

import { useEffect } from 'react';

import { cleanupTidioArtifacts } from '@/lib/tidio/tidio-script-loader';

const LATE_WIDGET_CLEANUP_DELAYS_MS = [300, 1500] as const;

/**
 * Ensures Tidio online chat never appears in admin.
 * Soft navigations from the storefront can leave widget DOM behind.
 */
export function AdminTidioGuard() {
  useEffect(() => {
    cleanupTidioArtifacts();

    const timers = LATE_WIDGET_CLEANUP_DELAYS_MS.map((delayMs) =>
      window.setTimeout(cleanupTidioArtifacts, delayMs),
    );

    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      cleanupTidioArtifacts();
    };
  }, []);

  return null;
}
