/**
 * True when the browser reports iPadOS (including Safari “desktop” mode where UA says Macintosh).
 * Safe on SSR: returns false when `navigator` is missing.
 */
export function getIsIpadOs(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  if (/iPhone|iPod/u.test(ua)) {
    return false;
  }
  if (/iPad/u.test(ua)) {
    return true;
  }

  const platform = navigator.platform;
  if (platform === 'iPad') {
    return true;
  }

  const uaData = (
    navigator as Navigator & {
      userAgentData?: { platform?: string; mobile?: boolean };
    }
  ).userAgentData;
  if (uaData?.platform === 'iPadOS' || uaData?.platform === 'iPad') {
    return true;
  }

  const mtp = navigator.maxTouchPoints ?? 0;
  if (mtp <= 1) {
    return false;
  }

  // iPadOS 13+ “desktop” Safari: platform MacIntel + multi-touch (Mac desktops report 0 touch points)
  return platform === 'MacIntel';
}

/**
 * Hide header social icons on large iPad class (Pro 11″/12.9″, Air, …). iPad mini keeps a smaller min viewport edge.
 */
export function getShouldHideHeaderSocialLinks(): boolean {
  if (!getIsIpadOs() || typeof window === 'undefined') {
    return false;
  }
  return Math.min(window.innerWidth, window.innerHeight) >= 820;
}

/**
 * When true, header uses the same chrome as phones (burger row + search-only strip): iPadOS
 * plus a fallback for wide touch tablets if UA detection fails.
 */
export function getUseMobileHeaderChrome(): boolean {
  if (getIsIpadOs()) {
    return true;
  }
  return getLikelyTabletTouchWithoutDesktopPointer();
}

/** iPad Air / Pro logical viewport in CSS pixels (portrait/landscape). */
export function getIsIpadDesktopRow2Viewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const minEdge = Math.min(window.innerWidth, window.innerHeight);
  const maxEdge = Math.max(window.innerWidth, window.innerHeight);
  // Pro 12.9" => 1024x1366, Air 10.9" => 820x1180, Air/Pro 11" => 834x1194
  return (
    (minEdge === 1024 && maxEdge === 1366) ||
    (minEdge === 820 && maxEdge === 1180) ||
    (minEdge === 834 && maxEdge === 1194)
  );
}

/**
 * Large touch viewport typical of iPad when `getIsIpadOs` is false (embedded browser, odd UA).
 */
function getLikelyTabletTouchWithoutDesktopPointer(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const w = window.innerWidth;
  if (getIsIpadDesktopRow2Viewport()) {
    return true;
  }

  if (w < 744 || w > 1366) {
    return false;
  }

  const coarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const touchPoints = navigator.maxTouchPoints ?? 0;

  // iPad Pro Safari/embedded webviews can report odd touch capabilities;
  // coarse pointer is a reliable signal for tablet-like touch chrome.
  if (!coarsePointer && touchPoints < 1) {
    return false;
  }

  return true;
}
