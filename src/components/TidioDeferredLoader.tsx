'use client';

import { useEffect, useState } from 'react';
import { MOBILE_NAV_OVERLAY_WIDGET_BOTTOM } from './mobile-bottom-nav.constants';
import {
  installTidioFontPreloadGuard,
  loadTidioScript,
  TIDIO_ACTIVATION_EVENTS,
  TIDIO_IDLE_FALLBACK_MS,
} from '@/lib/tidio/tidio-script-loader';

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

function useTidioActivation(): boolean {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) {
      return;
    }

    const activate = (): void => {
      setShouldLoad(true);
    };

    const timer = window.setTimeout(activate, TIDIO_IDLE_FALLBACK_MS);
    TIDIO_ACTIVATION_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, activate, { once: true, passive: true });
    });

    return () => {
      window.clearTimeout(timer);
      TIDIO_ACTIVATION_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, activate);
      });
    };
  }, [shouldLoad]);

  return shouldLoad;
}

/**
 * Loads Tidio only after deliberate user input (not scroll) or a long idle fallback
 * so Mulish (lazy chunk) does not extend initial Finish metrics.
 */
export function TidioDeferredLoader() {
  const shouldLoad = useTidioActivation();

  useEffect(() => {
    const removeGuard = installTidioFontPreloadGuard();
    return removeGuard;
  }, []);

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }

    void import('@/fonts/mulish-font').then(({ applyMulishFontVariable }) => {
      applyMulishFontVariable();
    });

    loadTidioScript();

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
  }, [shouldLoad]);

  return null;
}
