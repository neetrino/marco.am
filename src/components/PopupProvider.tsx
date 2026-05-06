'use client';

import { useEffect, useMemo, useState } from 'react';
import { POPUP_EVENT_NAME, type PopupRequestDetail } from './popup-service';

interface QueuedPopupRequest extends PopupRequestDetail {
  id: string;
}

const SUCCESS_ALERT_PATTERN = /success|saved|deleted|updated|added|completed|հաջող|կատարված/i;
const ERROR_ALERT_PATTERN =
  /error|failed|invalid|problem|cannot|can't|unable|required|not found|սխալ|խնդիր|չհաջող|չի կարող/i;

function buildPopupId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function dispatchToast(message: string, type: 'success' | 'error', duration?: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  const event = new CustomEvent('show-toast', {
    detail: { message, type, duration },
  });
  window.dispatchEvent(event);
}

export function PopupProvider() {
  const [queue, setQueue] = useState<QueuedPopupRequest[]>([]);
  const [inputValue, setInputValue] = useState('');

  const activeRequest = useMemo(() => queue[0] ?? null, [queue]);

  useEffect(() => {
    const onPopupRequest = (event: Event) => {
      const customEvent = event as CustomEvent<PopupRequestDetail>;
      if (!customEvent.detail) {
        return;
      }

      setQueue((prev) => [
        ...prev,
        {
          ...customEvent.detail,
          id: buildPopupId(),
        },
      ]);
    };

    window.addEventListener(POPUP_EVENT_NAME, onPopupRequest);
    return () => window.removeEventListener(POPUP_EVENT_NAME, onPopupRequest);
  }, []);

  useEffect(() => {
    if (!activeRequest) {
      return;
    }
    if (activeRequest.kind === 'prompt') {
      setInputValue(activeRequest.defaultValue ?? '');
      return;
    }
    setInputValue('');
  }, [activeRequest]);

  useEffect(() => {
    const nativeAlert = window.alert.bind(window);
    window.alert = (message?: unknown) => {
      const text = String(message ?? '').trim();
      if (!text) {
        return;
      }

      if (SUCCESS_ALERT_PATTERN.test(text)) {
        dispatchToast(text, 'success');
        return;
      }

      if (ERROR_ALERT_PATTERN.test(text)) {
        dispatchToast(text, 'error', 5000);
        return;
      }

      setQueue((prev) => [
        ...prev,
        {
          id: buildPopupId(),
          kind: 'alert',
          message: text,
          resolve: () => undefined,
        },
      ]);
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  const closeActive = (result: void | boolean | string | null) => {
    if (!activeRequest) {
      return;
    }
    activeRequest.resolve(result);
    setQueue((prev) => prev.slice(1));
  };

  if (!activeRequest) {
    return null;
  }

  const isPrompt = activeRequest.kind === 'prompt';
  const isConfirm = activeRequest.kind === 'confirm';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_24px_56px_rgba(16,16,16,0.3)]">
        <p className="text-sm leading-6 text-[var(--app-text)]">{activeRequest.message}</p>
        {isPrompt ? (
          <input
            autoFocus
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className="mt-4 w-full rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-bg)] px-3 py-2 text-sm text-[var(--app-text)] outline-none ring-0 transition focus:border-[var(--app-text)]"
          />
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          {isConfirm || isPrompt ? (
            <button
              type="button"
              onClick={() => closeActive(isPrompt ? null : false)}
              className="inline-flex h-10 items-center rounded-xl border border-[var(--app-border-strong)] px-4 text-sm font-medium text-[var(--app-text-muted)] transition hover:bg-[var(--app-bg-muted)]"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => closeActive(isPrompt ? inputValue : isConfirm ? true : undefined)}
            className="inline-flex h-10 items-center rounded-xl bg-marco-yellow px-4 text-sm font-semibold text-marco-black transition hover:brightness-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
