'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCartSummary } from '../lib/cart/cart-summary-context';
import { useTranslation } from '../lib/i18n-client';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import {
  MobileNavCartBoldIcon,
  MobileNavCartLinearIcon,
  MobileNavHomeBoldIcon,
  MobileNavHomeLinearIcon,
  MobileNavProfileBoldIcon,
  MobileNavProfileLinearIcon,
  MobileNavWishlistBoldIcon,
  MobileNavWishlistLinearIcon,
  MobileNavWishlistBagIcon,
} from './mobile-bottom-nav-icons';
import {
  MOBILE_NAV_ACTIVE_FOREGROUND,
  MOBILE_NAV_ACTIVE_PILL_BG,
  MOBILE_NAV_BOX_SHADOW,
  MOBILE_NAV_INACTIVE_ICON,
  MOBILE_NAV_TOP_CORNER_RADIUS_PX,
} from './mobile-bottom-nav.constants';
import { MobileBottomNavShopSheet } from './mobile-bottom-nav-shop-sheet';

export type MobileNavIconSlot = 'home' | 'shop' | 'wishlist' | 'cart' | 'profile';

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
      return <MobileNavWishlistBagIcon className={sizeClass} />;
    case 'cart':
      return isActive ? (
        <MobileNavCartBoldIcon className={sizeClass} />
      ) : (
        <MobileNavCartLinearIcon className={sizeClass} />
      );
    case 'wishlist':
      return isActive ? (
        <MobileNavWishlistBoldIcon className={sizeClass} />
      ) : (
        <MobileNavWishlistLinearIcon className={sizeClass} />
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
  cartCount: number;
}

interface BaseNavItemVisualProps extends NavItemLinkProps {
  onPress?: () => void;
  variant?: 'default' | 'centerHome';
}

function NavItemVisual({ item, pathname, cartCount, onPress, variant = 'default' }: BaseNavItemVisualProps) {
  const { label, href, icon: slot } = item;
  const isActive = slot === 'shop' ? false : isNavItemActive(pathname, href);
  const isCenterHighlight = variant === 'centerHome' && slot === 'shop';
  const activeColor = MOBILE_NAV_ACTIVE_FOREGROUND;
  const inactiveColor = MOBILE_NAV_INACTIVE_ICON;
  const iconColor = isCenterHighlight ? '#111827' : isActive ? activeColor : inactiveColor;
  const sizeClass = isCenterHighlight ? 'h-7 w-7 shrink-0' : 'h-6 w-6 shrink-0';
  const showCartBadge = slot === 'cart' && cartCount > 0;
  const contentClass = isCenterHighlight
    ? 'flex h-14 w-14 items-center justify-center'
    : 'flex min-h-[44px] flex-1 items-center justify-center px-1 py-1';

  const iconWithBadge = (
    <div
      className="relative flex h-6 w-6 shrink-0 items-center justify-center"
      style={{ color: iconColor }}
    >
      {renderNavIcon(slot, isActive, sizeClass)}
      {showCartBadge ? (
        <span className="pointer-events-none absolute -right-2 -top-2 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white tabular-nums shadow-sm ring-2 ring-white dark:ring-zinc-950">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      ) : null}
    </div>
  );

  const defaultContent = isActive ? (
    <span
      className="inline-flex items-center justify-center rounded-full px-3 py-2"
      style={{ backgroundColor: MOBILE_NAV_ACTIVE_PILL_BG }}
    >
      {iconWithBadge}
    </span>
  ) : (
    <span className="inline-flex items-center justify-center py-2">{iconWithBadge}</span>
  );
  const content = isCenterHighlight ? (
    <span
      className="inline-flex h-14 w-14 -translate-y-5 items-center justify-center rounded-full bg-yellow-400 shadow-[0_8px_20px_rgba(0,0,0,0.18)] ring-4 ring-white dark:ring-zinc-950"
      aria-label={label}
    >
      {iconWithBadge}
    </span>
  ) : (
    defaultContent
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-current={isActive ? 'page' : undefined}
        className={contentClass}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      {...(href === '/' || href === '/products' ? { prefetch: true as const } : {})}
      aria-current={isActive ? 'page' : undefined}
      className={contentClass}
    >
      {content}
    </Link>
  );
}

/**
 * Fixed mobile bottom bar with a centered floating Shop action.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { cartCount } = useCartSummary();
  const [shopSheetOpen, setShopSheetOpen] = useState(false);
  const previousPathnameRef = useRef(pathname);
  const activeCategorySlug = searchParams?.get('category') ?? null;

  const handleShopPress = () => {
    setShopSheetOpen(true);
  };

  const handleShopCategorySelect = (slug: string | null) => {
    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');
    if (slug) {
      nextParams.set('category', slug);
    } else {
      nextParams.delete('category');
    }
    nextParams.delete('page');
    setShopSheetOpen(false);
    const query = nextParams.toString();
    pushShopProductsListingUrl(router, query ? `/products?${query}` : '/products');
  };

  useEffect(() => {
    void router.prefetch('/products');
  }, [router]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }
    previousPathnameRef.current = pathname;
    setShopSheetOpen(false);
  }, [pathname, shopSheetOpen]);

  const navItems: MobileNavItem[] = useMemo(
    () => [
      { label: t('common.navigation.shop'), href: '/products', icon: 'shop' },
      { label: t('common.navigation.home'), href: '/', icon: 'home' },
      { label: t('common.navigation.wishlist'), href: '/wishlist', icon: 'wishlist' },
      { label: t('common.navigation.cart'), href: '/cart', icon: 'cart' },
      { label: t('common.navigation.profile'), href: '/profile', icon: 'profile' },
    ],
    [t],
  );
  const centerItem = navItems.find((item) => item.icon === 'shop');
  const sideItems = navItems.filter((item) => item.icon !== 'shop');
  const sideSplitIndex = Math.ceil(sideItems.length / 2);
  const leftItems = sideItems.slice(0, sideSplitIndex);
  const rightItems = sideItems.slice(sideSplitIndex);

  return (
    <>
      <nav
        className={`lg:hidden pointer-events-none fixed bottom-0 left-0 right-0 w-full ${
          shopSheetOpen ? 'z-[999]' : 'z-50'
        }`}
        aria-label="Primary"
      >
        <div className="pointer-events-auto mx-auto max-w-md">
          <div
            className="overflow-visible bg-white pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] dark:bg-zinc-950"
            style={{
              borderTopLeftRadius: MOBILE_NAV_TOP_CORNER_RADIUS_PX,
              borderTopRightRadius: MOBILE_NAV_TOP_CORNER_RADIUS_PX,
              boxShadow: MOBILE_NAV_BOX_SHADOW,
            }}
          >
            <div className="relative mx-auto max-w-md px-4 pt-3 pb-2">
              <div className="flex items-center">
                <div className="flex flex-1 items-center justify-between gap-1">
                  {leftItems.map((item) => (
                    <NavItemVisual key={item.href} item={item} pathname={pathname} cartCount={cartCount} />
                  ))}
                </div>
                <div className="w-14 shrink-0" aria-hidden="true" />
                <div className="flex flex-1 items-center justify-between gap-1">
                  {rightItems.map((item) => (
                    <NavItemVisual key={item.href} item={item} pathname={pathname} cartCount={cartCount} />
                  ))}
                </div>
              </div>
              {centerItem ? (
                <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
                  <div className="pointer-events-auto">
                    <NavItemVisual
                      item={centerItem}
                      pathname={pathname}
                      cartCount={cartCount}
                      onPress={handleShopPress}
                      variant="centerHome"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>
      <MobileBottomNavShopSheet
        open={shopSheetOpen}
        activeCategorySlug={activeCategorySlug}
        onClose={() => setShopSheetOpen(false)}
        onSelectCategory={handleShopCategorySelect}
      />
    </>
  );
}
