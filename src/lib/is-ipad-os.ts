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

/**
 * Large touch viewport typical of iPad when `getIsIpadOs` is false (embedded browser, odd UA).
 */
function getLikelyTabletTouchWithoutDesktopPointer(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const w = window.innerWidth;
  if (w < 744 || w > 1366) {
    return false;
  }

  if ((navigator.maxTouchPoints ?? 0) < 5) {
    return false;
  }

  if (!('ontouchstart' in window)) {
    return false;
  }

  return true;
}
