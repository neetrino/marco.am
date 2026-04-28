'use client';

import { useEffect } from 'react';
import { MOBILE_NAV_OVERLAY_WIDGET_BOTTOM } from './mobile-bottom-nav.constants';

const TIDIO_SRC = 'https://code.tidio.co/9ovkfmgncuyhg4kaemwvkdbvp5r7njec.js';
const SCRIPT_ID = 'tidio-widget-js';
const HOST_OFFSET_STYLE_ID = 'marco-tidio-mobile-offset';

type TidioChatApi = {
  adjustStyles: (css: string) => void;
};

function getTidioChatApi(): TidioChatApi | undefined {
  return (window as Window & { tidioChatApi?: TidioChatApi }).tidioChatApi;
}

/**
 * Lifts the Tidio launcher above the fixed mobile bottom nav (Tailwind `lg` = 1024px).
 * @see https://help.tidio.com/hc/en-us/articles/5464851341724-Widget-Position
 */
function tidioMobileBottomCss(): string {
  const bottom = MOBILE_NAV_OVERLAY_WIDGET_BOTTOM;
  return `@media (max-width: 1023px) { #tidio, #tidio-chat, #tidio-chat-iframe { bottom: ${bottom} !important; } }`;
}

function syncHostPageTidioOffsetStyle(): void {
  const css = tidioMobileBottomCss();
  let el = document.getElementById(HOST_OFFSET_STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = HOST_OFFSET_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function applyTidioMobileBottomOffset(): void {
  syncHostPageTidioOffsetStyle();
  const api = getTidioChatApi();
  if (!api?.adjustStyles) {
    return;
  }
  api.adjustStyles(tidioMobileBottomCss());
}

/**
 * Defers Tidio until idle (or cap) so initial main-thread and network stay focused on LCP / INP.
 */
export function TidioDeferredLoader() {
  useEffect(() => {
    const onTidioReady = () => {
      applyTidioMobileBottomOffset();
      window.setTimeout(applyTidioMobileBottomOffset, 300);
      window.setTimeout(applyTidioMobileBottomOffset, 900);
      window.setTimeout(applyTidioMobileBottomOffset, 2500);
    };
    document.addEventListener('tidioChat-ready', onTidioReady);
    applyTidioMobileBottomOffset();

    return () => {
      document.removeEventListener('tidioChat-ready', onTidioReady);
      document.getElementById(HOST_OFFSET_STYLE_ID)?.remove();
    };
  }, []);

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
