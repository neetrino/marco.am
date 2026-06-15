import { loadTidioScript, TIDIO_SCRIPT_ID } from './tidio-script-loader';

type TidioWindow = Window & {
  tidioChatApi?: {
    open?: () => void;
    show?: () => void;
    display?: () => void;
    openChat?: () => void;
  };
  tidioChat?: {
    open?: () => void;
  };
};

function tryOpenTidio(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const w = window as TidioWindow;
  const api = w.tidioChatApi;
  const openCandidate =
    api?.open ?? api?.show ?? api?.display ?? api?.openChat ?? w.tidioChat?.open;
  if (typeof openCandidate === 'function') {
    openCandidate();
    return true;
  }

  const launcher = document.querySelector<HTMLElement>(
    '#tidio-chat button, #tidio-chat [role="button"], #tidio button, #tidio [role="button"]',
  );
  if (launcher) {
    launcher.click();
    return true;
  }
  return false;
}

export function openTidioChat(): void {
  if (tryOpenTidio()) {
    return;
  }

  const existing = document.getElementById(TIDIO_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    window.setTimeout(() => {
      tryOpenTidio();
    }, 400);
    return;
  }

  const script = loadTidioScript();
  if (!script) {
    return;
  }

  script.addEventListener(
    'load',
    () => {
      window.setTimeout(() => {
        tryOpenTidio();
      }, 250);
    },
    { once: true },
  );
}
