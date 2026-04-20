import { HEADER_REELS_EXTERNAL_HREF } from './header.constants';

export type PrimaryNavLink =
  | { href: string; translationKey: string; external?: false }
  | { href: string; translationKey: string; external: true };

export const primaryNavLinks: PrimaryNavLink[] = [
  { href: '/', translationKey: 'common.navigation.home' },
  { href: '/about', translationKey: 'common.navigation.about' },
  { href: '/products', translationKey: 'common.navigation.shop' },
  { href: '/brands', translationKey: 'common.navigation.brands' },
  { href: '/contact', translationKey: 'common.navigation.contact' },
  { href: HEADER_REELS_EXTERNAL_HREF, translationKey: 'common.navigation.reels', external: true },
];
