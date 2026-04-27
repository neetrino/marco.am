'use client';

import { useEffect } from 'react';

const TIDIO_SRC = 'https://code.tidio.co/9ovkfmgncuyhg4kaemwvkdbvp5r7njec.js';
const SCRIPT_ID = 'tidio-widget-js';

/**
 * Defers Tidio until idle (or cap) so initial main-thread and network stay focused on LCP / INP.
 */
export function TidioDeferredLoader() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) {
      return;
    }

    let cancelled = false;

    const inject = () => {
      if (cancelled || document.getElementById(SCRIPT_ID)) {
        return;
      }
      const el = document.createElement('script');
      el.id = SCRIPT_ID;
      el.src = TIDIO_SRC;
      el.async = true;
      document.body.appendChild(el);
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const fallbackTimer = window.setTimeout(inject, 12_000);

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(
        () => {
          window.clearTimeout(fallbackTimer);
          inject();
        },
        { timeout: 10_000 },
      );
      return () => {
        cancelled = true;
        window.clearTimeout(fallbackTimer);
        win.cancelIdleCallback?.(idleId);
      };
    }

    const earlyTimer = window.setTimeout(() => {
      window.clearTimeout(fallbackTimer);
      inject();
    }, 2800);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(earlyTimer);
    };
  }, []);

  return null;
}
