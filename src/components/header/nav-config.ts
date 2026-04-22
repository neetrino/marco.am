export type PrimaryNavLink =
  | { href: string; translationKey: string; external?: false }
  | { href: string; translationKey: string; external: true };

export const primaryNavLinks: PrimaryNavLink[] = [
  { href: '/', translationKey: 'common.navigation.home' },
  { href: '/about', translationKey: 'common.navigation.about' },
  { href: '/products', translationKey: 'common.navigation.shop' },
  { href: '/brands', translationKey: 'common.navigation.brands' },
  { href: '/contact', translationKey: 'common.navigation.contact' },
  { href: '/reels', translationKey: 'common.navigation.reels' },
];
