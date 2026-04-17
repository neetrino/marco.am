"use client";

import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        `script[src="${TURNSTILE_SCRIPT_SRC}"]`
      );
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () =>
          reject(new Error("Turnstile script failed to load"))
        );
        return;
      }
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Turnstile script failed to load"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

type TurnstileWidgetProps = {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
};

/**
 * Renders Cloudflare Turnstile when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set.
 * Parent should remount (new `key`) after successful submit to issue a fresh challenge.
 */
export function ContactTurnstileWidget({
  siteKey,
  onTokenChange,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!siteKey.trim()) {
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        await loadTurnstileScript();
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onTokenChangeRef.current(token),
          "expired-callback": () => onTokenChangeRef.current(null),
          "error-callback": () => onTokenChangeRef.current(null),
        });
      } catch {
        onTokenChangeRef.current(null);
      }
    })();

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* ignore */
        }
      }
    };
  }, [siteKey]);

  if (!siteKey.trim()) {
    return null;
  }

  return <div ref={containerRef} className="min-h-[65px]" />;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}
