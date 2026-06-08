/** Hostnames allowed for Next.js Image optimization (production). */
export const STOREFRONT_IMAGE_OPTIMIZER_HOSTS = new Set([
  'marco.am',
  'www.marco.am',
]);

export function isStorefrontImageOptimizerHost(hostname: string): boolean {
  return STOREFRONT_IMAGE_OPTIMIZER_HOSTS.has(hostname.toLowerCase());
}
