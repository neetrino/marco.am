'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCartSummary } from '../lib/cart/cart-summary-context';
import { useTranslation } from '../lib/i18n-client';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import {
  MobileNavCartBoldIcon,
  MobileNavCartLinearIcon,
  MobileNavCompareBoldIcon,
  MobileNavCompareLinearIcon,
  MobileNavHomeBoldIcon,
  MobileNavHomeLinearIcon,
  MobileNavProfileBoldIcon,
  MobileNavProfileLinearIcon,
  MobileNavWishlistBoldIcon,
  MobileNavWishlistLinearIcon,
  MobileNavWishlistBagBoldIcon,
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

export type MobileNavIconSlot = 'home' | 'shop' | 'wishlist' | 'compare' | 'cart' | 'profile';

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
    case 'wishlist':
      return isActive ? (
        <MobileNavWishlistBoldIcon className={sizeClass} />
      ) : (
        <MobileNavWishlistLinearIcon className={sizeClass} />
      );
    case 'compare':
      return isActive ? (
        <MobileNavCompareBoldIcon className={sizeClass} />
      ) : (
        <MobileNavCompareLinearIcon className={sizeClass} />
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
}

function NavItemVisual({ item, pathname, cartCount, onPress }: BaseNavItemVisualProps) {
  const { label, href, icon: slot } = item;
  const isActive = isNavItemActive(pathname, href);
  const activeColor = MOBILE_NAV_ACTIVE_FOREGROUND;
  const inactiveColor = MOBILE_NAV_INACTIVE_ICON;
  const iconColor = isActive ? activeColor : inactiveColor;
  const sizeClass = 'h-6 w-6 shrink-0';
  const showCartBadge = slot === 'cart' && cartCount > 0;
  const contentClass = 'flex min-h-[44px] flex-1 items-center justify-center px-1 py-1';

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

  const content = isActive ? (
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
 * Fixed mobile bottom bar — MARCO Figma: white bar, yellow pill only for the active tab.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { cartCount } = useCartSummary();
  const [shopSheetOpen, setShopSheetOpen] = useState(false);
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

  const navItems: MobileNavItem[] = useMemo(
    () => [
      { label: t('common.navigation.home'), href: '/', icon: 'home' },
      { label: t('common.navigation.shop'), href: '/products', icon: 'shop' },
      { label: t('common.navigation.wishlist'), href: '/wishlist', icon: 'wishlist' },
      { label: t('common.navigation.compare'), href: '/compare', icon: 'compare' },
      { label: t('common.navigation.cart'), href: '/cart', icon: 'cart' },
      { label: t('common.navigation.profile'), href: '/profile', icon: 'profile' },
    ],
    [t],
  );

  return (
    <>
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
            <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-3 pb-2">
              {navItems.map((item) =>
                item.icon === 'shop' ? (
                  <NavItemVisual
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    cartCount={cartCount}
                    onPress={handleShopPress}
                  />
                ) : (
                  <NavItemVisual key={item.href} item={item} pathname={pathname} cartCount={cartCount} />
                ),
              )}
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
