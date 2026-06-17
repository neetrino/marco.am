const LIGHT_MARKETING_PATHS = new Set(['/about', '/contact', '/reels']);

/** Static marketing pages — defer heavy header/API prefetch so first paint stays fast. */
export function isLightMarketingRoute(pathname: string): boolean {
  return LIGHT_MARKETING_PATHS.has(pathname);
}
