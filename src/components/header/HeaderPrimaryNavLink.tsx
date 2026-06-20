'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';
import { useCallback, useRef } from 'react';
import { getStoredLanguage } from '@/lib/language';
import { pushShopProductsListingUrl } from '@/lib/push-shop-products-listing-url';
import { warmShopProductsClientCaches } from '@/lib/shop-products-plp-prefetch';

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

type HeaderPrimaryNavLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'> & {
  href: string;
};

/**
 * Primary header nav link — warms the route on direct pointer intent without
 * flooding first load with viewport auto-prefetches.
 */
export function HeaderPrimaryNavLink({
  href,
  onClick,
  onMouseEnter,
  onFocus,
  onPointerDown,
  onTouchStart,
  ...rest
}: HeaderPrimaryNavLinkProps) {
  const router = useRouter();
  const warmedRef = useRef(false);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (href !== '/products') {
        return;
      }
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) {
        return;
      }
      event.preventDefault();
      pushShopProductsListingUrl(router, href);
    },
    [href, onClick, router],
  );

  const warmRoute = useCallback(() => {
    if (warmedRef.current) {
      return;
    }
    warmedRef.current = true;
    if (href === '/products') {
      warmShopProductsClientCaches(getStoredLanguage(), '', {
        includeFilters: false,
        timeoutMs: 8_000,
        suppressTimeoutLogging: true,
      });
    }
    void router.prefetch(href);
  }, [router, href]);

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={handleClick}
      onMouseEnter={(event) => {
        warmRoute();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        warmRoute();
        onFocus?.(event);
      }}
      onPointerDown={(event) => {
        warmRoute();
        onPointerDown?.(event);
      }}
      onTouchStart={(event) => {
        warmRoute();
        onTouchStart?.(event);
      }}
      {...rest}
    />
  );
}
