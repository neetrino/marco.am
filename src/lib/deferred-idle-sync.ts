import { isLightMarketingRoute } from '@/lib/light-marketing-routes';

const HOME_PATH = '/';

/** Defer on home and static marketing routes so SSR is not competing for the DB pool. */
const HOME_HEADER_MEMBERSHIP_SYNC_DEFER_MS = 10_000;

/** Default defer for wishlist/compare API sync on other storefront routes. */
const DEFAULT_HEADER_MEMBERSHIP_SYNC_DEFER_MS = 4_000;

export function resolveHeaderMembershipSyncDeferMs(pathname: string): number {
  if (pathname === HOME_PATH || isLightMarketingRoute(pathname)) {
    return HOME_HEADER_MEMBERSHIP_SYNC_DEFER_MS;
  }
  return DEFAULT_HEADER_MEMBERSHIP_SYNC_DEFER_MS;
}

type IdleCapableWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

/** Runs work during idle time with a hard timeout fallback. */
export function scheduleIdleSync(run: () => void, timeoutMs: number): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const idleWindow = window as IdleCapableWindow;
  if (typeof idleWindow.requestIdleCallback === 'function') {
    const id = idleWindow.requestIdleCallback(run, { timeout: timeoutMs });
    return () => {
      if (typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(id);
      }
    };
  }
  const timerId = globalThis.setTimeout(run, Math.min(timeoutMs, 3000));
  return () => globalThis.clearTimeout(timerId);
}
