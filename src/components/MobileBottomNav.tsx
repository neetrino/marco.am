'use client';

import Link from 'next/link';
import { useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../lib/i18n-client';
import {
  MobileNavCartBoldIcon,
  MobileNavCartLinearIcon,
  MobileNavHomeBoldIcon,
  MobileNavHomeLinearIcon,
  MobileNavProfileBoldIcon,
  MobileNavProfileLinearIcon,
  MobileNavWishlistBagBoldIcon,
  MobileNavWishlistBagIcon,
} from './mobile-bottom-nav-icons';
import {
  MOBILE_NAV_ACTIVE_FOREGROUND,
  MOBILE_NAV_ACTIVE_PILL_BG,
  MOBILE_NAV_BOX_SHADOW,
  MOBILE_NAV_HOME_INDICATOR_BG,
  MOBILE_NAV_INACTIVE_ICON,
  MOBILE_NAV_TOP_CORNER_RADIUS_PX,
} from './mobile-bottom-nav.constants';

export type MobileNavIconSlot = 'home' | 'shop' | 'cart' | 'profile';

interface MobileNavItem {
  label: string;
  href: string;
  icon: MobileNavIconSlot;
}

function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  if (href === '/cart') {
    return pathname === '/cart' || pathname.startsWith('/cart/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function renderNavIcon(slot: MobileNavIconSlot, isActive: boolean, sizeClass: string): ReactNode {
  switch (slot) {
    case 'home':
      return isActive ? (
        <MobileNavHomeBoldIcon className={sizeClass} />
      ) : (
        <MobileNavHomeLinearIcon className={sizeClass} />
      );
    case 'shop':
      return isActive ? (
        <MobileNavWishlistBagBoldIcon className={sizeClass} />
      ) : (
        <MobileNavWishlistBagIcon className={sizeClass} />
      );
    case 'cart':
      return isActive ? (
        <MobileNavCartBoldIcon className={sizeClass} />
      ) : (
        <MobileNavCartLinearIcon className={sizeClass} />
      );
    case 'profile':
      return isActive ? (
        <MobileNavProfileBoldIcon className={sizeClass} />
      ) : (
        <MobileNavProfileLinearIcon className={sizeClass} />
      );
  }
}

interface NavItemLinkProps {
  item: MobileNavItem;
  pathname: string | null;
}

function NavItemLink({ item, pathname }: NavItemLinkProps) {
  const { label, href, icon: slot } = item;
  const isActive = isNavItemActive(pathname, href);
  const activeColor = MOBILE_NAV_ACTIVE_FOREGROUND;
  const inactiveColor = MOBILE_NAV_INACTIVE_ICON;
  const iconColor = isActive ? activeColor : inactiveColor;
  const sizeClass = 'h-6 w-6 shrink-0';

  const iconWithBadge = (
    <div
      className="relative flex h-6 w-6 shrink-0 items-center justify-center"
      style={{ color: iconColor }}
    >
      {renderNavIcon(slot, isActive, sizeClass)}
    </div>
  );

  return (
    <Link
      href={href}
      {...(href === '/' || href === '/products' ? { prefetch: true as const } : {})}
      aria-current={isActive ? 'page' : undefined}
      className="flex min-h-[44px] flex-1 items-center justify-center px-1 py-1"
    >
      {isActive ? (
        <span
          className="inline-flex max-w-full items-center gap-1.5 rounded-full px-4 py-2"
          style={{
            backgroundColor: MOBILE_NAV_ACTIVE_PILL_BG,
            color: activeColor,
          }}
        >
          {iconWithBadge}
          <span className="truncate text-xs font-semibold leading-tight tracking-[0.24px]">{label}</span>
        </span>
      ) : (
        <span className="inline-flex items-center justify-center py-2">{iconWithBadge}</span>
      )}
    </Link>
  );
}

/**
 * Fixed mobile bottom bar — MARCO Figma: white bar, yellow pill only for the active tab.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems: MobileNavItem[] = useMemo(
    () => [
      { label: t('common.navigation.home'), href: '/', icon: 'home' },
      { label: t('common.navigation.shop'), href: '/products', icon: 'shop' },
      { label: t('common.navigation.cart'), href: '/cart', icon: 'cart' },
      { label: t('common.navigation.profile'), href: '/profile', icon: 'profile' },
    ],
    [t],
  );

  return (
    <nav className="lg:hidden pointer-events-none fixed bottom-0 left-0 right-0 z-50 w-full" aria-label="Primary">
      <div className="pointer-events-auto mx-auto max-w-md">
        <div
          className="overflow-hidden bg-white pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] dark:bg-zinc-950"
          style={{
            borderTopLeftRadius: MOBILE_NAV_TOP_CORNER_RADIUS_PX,
            borderTopRightRadius: MOBILE_NAV_TOP_CORNER_RADIUS_PX,
            boxShadow: MOBILE_NAV_BOX_SHADOW,
          }}
        >
          <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-3 pb-1.5">
            {navItems.map((item) => (
              <NavItemLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
          <div className="flex justify-center px-4 pb-2 pt-1" aria-hidden>
            <span
              className="block h-1 w-32 max-w-[45%] shrink-0 rounded-full"
              style={{ backgroundColor: MOBILE_NAV_HOME_INDICATOR_BG }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
