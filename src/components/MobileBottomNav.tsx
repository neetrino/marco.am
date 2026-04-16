'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getWishlistCount } from '../lib/storageCounts';
import { logger } from '@/lib/utils/logger';
import { useTranslation } from '../lib/i18n-client';
import {
  MobileNavCartLinearIcon,
  MobileNavHomeBoldIcon,
  MobileNavProfileLinearIcon,
  MobileNavWishlistBagIcon,
} from './mobile-bottom-nav-icons';
import {
  MOBILE_NAV_ACTIVE_FOREGROUND,
  MOBILE_NAV_ACTIVE_PILL_BG,
  MOBILE_NAV_BOX_SHADOW,
  MOBILE_NAV_INACTIVE_ICON,
} from './mobile-bottom-nav.constants';

export type MobileNavIconSlot = 'home' | 'wishlist' | 'cart' | 'profile';

interface MobileNavItem {
  label: string;
  href: string;
  icon: MobileNavIconSlot;
  badge?: 'wishlist';
}

function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  if (href === '/cart') {
    return pathname === '/cart' || pathname.startsWith('/cart/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function renderNavIcon(slot: MobileNavIconSlot, sizeClass: string): ReactNode {
  switch (slot) {
    case 'home':
      return <MobileNavHomeBoldIcon className={sizeClass} />;
    case 'wishlist':
      return <MobileNavWishlistBagIcon className={sizeClass} />;
    case 'cart':
      return <MobileNavCartLinearIcon className={sizeClass} />;
    case 'profile':
      return <MobileNavProfileLinearIcon className={sizeClass} />;
  }
}

interface NavItemLinkProps {
  item: MobileNavItem;
  pathname: string | null;
  wishlistCount: number;
}

function NavItemLink({ item, pathname, wishlistCount }: NavItemLinkProps) {
  const { label, href, badge, icon: slot } = item;
  const isActive = isNavItemActive(pathname, href);
  const badgeValue = badge === 'wishlist' ? wishlistCount : 0;
  const activeColor = MOBILE_NAV_ACTIVE_FOREGROUND;
  const inactiveColor = MOBILE_NAV_INACTIVE_ICON;
  const iconColor = isActive ? activeColor : inactiveColor;
  const sizeClass = 'h-6 w-6 shrink-0';

  const iconWithBadge = (
    <div
      className="relative flex h-6 w-6 shrink-0 items-center justify-center"
      style={{ color: iconColor }}
    >
      {renderNavIcon(slot, sizeClass)}
      {badgeValue > 0 && (
        <span className="absolute -right-1.5 -top-1 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {badgeValue > 99 ? '99+' : badgeValue}
        </span>
      )}
    </div>
  );

  return (
    <Link
      href={href}
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
          <span className="truncate text-xs font-semibold leading-tight tracking-wide">{label}</span>
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
  const [wishlistCount, setWishlistCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const updateCounts = () => {
      const wishlist = getWishlistCount();
      logger.devDebug('[MobileBottomNav] wishlist count refreshed', { wishlist });
      setWishlistCount(wishlist);
    };

    updateCounts();
    window.addEventListener('wishlist-updated', updateCounts);
    return () => window.removeEventListener('wishlist-updated', updateCounts);
  }, []);

  const navItems: MobileNavItem[] = useMemo(
    () => [
      { label: t('common.navigation.home'), href: '/', icon: 'home' },
      { label: t('common.navigation.wishlist'), href: '/wishlist', icon: 'wishlist', badge: 'wishlist' },
      { label: t('common.navigation.cart'), href: '/cart', icon: 'cart' },
      { label: t('common.navigation.profile'), href: '/profile', icon: 'profile' },
    ],
    [t],
  );

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 w-full bg-white pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
      style={{ boxShadow: MOBILE_NAV_BOX_SHADOW }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-3 pb-1.5">
        {navItems.map((item) => (
          <NavItemLink
            key={item.href}
            item={item}
            pathname={pathname}
            wishlistCount={wishlistCount}
          />
        ))}
      </div>
    </nav>
  );
}
