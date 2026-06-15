export const TIDIO_SCRIPT_ID = 'tidio-widget-js';
export const TIDIO_SRC = 'https://code.tidio.co/9ovkfmgncuyhg4kaemwvkdbvp5r7njec.js';

/** Load chat only after deliberate interaction, or this idle fallback. */
export const TIDIO_IDLE_FALLBACK_MS = 25_000;

export const TIDIO_ACTIVATION_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const;

type HeadWithTidioGuard = HTMLHeadElement & { __marcoTidioPreloadGuard?: boolean };

function isBlockedTidioFontLink(node: Node): node is HTMLLinkElement {
  if (!(node instanceof HTMLLinkElement)) {
    return false;
  }
  const href = node.href.toLowerCase();
  if (!href.includes('tidio.co')) {
    return false;
  }
  if (!href.includes('font') && !href.includes('mulish') && !href.endsWith('.woff2')) {
    return false;
  }
  const rel = node.rel.toLowerCase();
  return rel.includes('preload') || rel.includes('prefetch') || rel === 'stylesheet';
}

function neutralizeBlockedTidioFontLink(node: Node): void {
  if (isBlockedTidioFontLink(node)) {
    node.remove();
  }
}

/**
 * Blocks Tidio-hosted font hints on the host page; chat uses self-hosted Mulish from next/font.
 */
export function installTidioFontPreloadGuard(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const head = document.head as HeadWithTidioGuard | null;
  if (!head || head.__marcoTidioPreloadGuard) {
    return () => {};
  }
  head.__marcoTidioPreloadGuard = true;

  document
    .querySelectorAll<HTMLLinkElement>('link[href*="tidio.co"]')
    .forEach(neutralizeBlockedTidioFontLink);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(neutralizeBlockedTidioFontLink);
    });
  });
  observer.observe(head, { childList: true, subtree: true });

  const originalAppendChild = head.appendChild.bind(head);
  const originalInsertBefore = head.insertBefore.bind(head);

  head.appendChild = <T extends Node>(node: T): T => {
    if (isBlockedTidioFontLink(node)) {
      return node;
    }
    return originalAppendChild(node);
  };

  head.insertBefore = <T extends Node>(node: T, referenceNode: Node | null): T => {
    if (isBlockedTidioFontLink(node)) {
      return node;
    }
    return originalInsertBefore(node, referenceNode);
  };

  return () => {
    observer.disconnect();
    head.appendChild = originalAppendChild;
    head.insertBefore = originalInsertBefore;
    delete head.__marcoTidioPreloadGuard;
  };
}

/** Idempotent Tidio script injection shared by the deferred loader and programmatic open. */
export function loadTidioScript(): HTMLScriptElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = document.getElementById(TIDIO_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return existing;
  }

  installTidioFontPreloadGuard();

  const script = document.createElement('script');
  script.id = TIDIO_SCRIPT_ID;
  script.src = TIDIO_SRC;
  script.async = true;
  document.body.appendChild(script);
  return script;
}
