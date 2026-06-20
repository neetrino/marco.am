'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';
import { pushShopProductsListingUrl } from '@/lib/push-shop-products-listing-url';

type ShopListingLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  /** Called after navigation is triggered (e.g. close the mega menu). */
  onNavigate?: () => void;
};

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

/**
 * Link to the shop listing that reuses the in-page navigation path.
 * On `/products` it updates via history (instant, no RSC refetch); from other
 * routes it falls back to App Router. Keeps a real `href` so new-tab/modifier
 * clicks and SEO crawlers still work.
 */
export function ShopListingLink({ href, onNavigate, onClick, ...rest }: ShopListingLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) {
          return;
        }
        event.preventDefault();
        pushShopProductsListingUrl(router, href);
        onNavigate?.();
      }}
      {...rest}
    />
  );
}
