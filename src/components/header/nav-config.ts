export type PrimaryNavLink =
  | { href: string; translationKey: string; external?: false }
  | { href: string; translationKey: string; external: true };

export const primaryNavLinks: PrimaryNavLink[] = [
  { href: '/', translationKey: 'common.navigation.home' },
  { href: '/products', translationKey: 'common.navigation.shop' },
  { href: '/brands', translationKey: 'common.navigation.brands' },
  { href: '/about', translationKey: 'common.navigation.about' },
  { href: '/contact', translationKey: 'common.navigation.contact' },
  { href: '/reels', translationKey: 'common.navigation.reels' },
];

/** Match current route to primary nav `href` without treating `/` as a prefix of everything. */
export function isPrimaryNavHrefActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname === '';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
