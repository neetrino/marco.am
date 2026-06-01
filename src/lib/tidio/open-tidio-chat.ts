const TIDIO_SCRIPT_ID = 'tidio-widget-js';
const TIDIO_SRC = 'https://code.tidio.co/9ovkfmgncuyhg4kaemwvkdbvp5r7njec.js';

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

  const script = document.createElement('script');
  script.id = TIDIO_SCRIPT_ID;
  script.src = TIDIO_SRC;
  script.async = true;
  script.onload = () => {
    window.setTimeout(() => {
      tryOpenTidio();
    }, 250);
  };
  document.body.appendChild(script);
}
