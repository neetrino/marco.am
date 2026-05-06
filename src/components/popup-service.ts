'use client';

type PopupRequestKind = 'alert' | 'confirm' | 'prompt';

type PopupResult = void | boolean | string | null;

interface PopupRequestDetail {
  kind: PopupRequestKind;
  message: string;
  defaultValue?: string;
  resolve: (value: PopupResult) => void;
}

const POPUP_EVENT_NAME = 'app-popup-request';

function dispatchPopupRequest<T extends PopupResult>(
  detail: Omit<PopupRequestDetail, 'resolve'>,
  fallbackValue: T,
): Promise<T> {
  if (typeof window === 'undefined') {
    return Promise.resolve(fallbackValue);
  }

  return new Promise<T>((resolve) => {
    const event = new CustomEvent<PopupRequestDetail>(POPUP_EVENT_NAME, {
      detail: {
        ...detail,
        resolve: (value: PopupResult) => resolve(value as T),
      },
    });
    window.dispatchEvent(event);
  });
}

export function showPopupAlert(message: string): Promise<void> {
  return dispatchPopupRequest<void>(
    {
      kind: 'alert',
      message,
    },
    undefined,
  );
}

export function showPopupConfirm(message: string): Promise<boolean> {
  return dispatchPopupRequest<boolean>(
    {
      kind: 'confirm',
      message,
    },
    false,
  );
}

export function showPopupPrompt(message: string, defaultValue = ''): Promise<string | null> {
  return dispatchPopupRequest<string | null>(
    {
      kind: 'prompt',
      message,
      defaultValue,
    },
    null,
  );
}

export type { PopupRequestDetail, PopupRequestKind };
export { POPUP_EVENT_NAME };
