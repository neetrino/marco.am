'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback } from 'react';

import { getStoredLanguage } from '@/lib/language';
import { warmShopProductsClientCaches } from '@/lib/shop-products-plp-prefetch';

const BRAND_PLP_WARM_TIMEOUT_MS = 8_000;

type LinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'>;

export type BrandPlpLinkProps = LinkProps & {
  readonly href: string;
  readonly children: ReactNode;
};

function queryStringFromPlpHref(href: string): string {
  const queryIndex = href.indexOf('?');
  if (queryIndex < 0) {
    return '';
  }
  return href.slice(queryIndex + 1);
}

/**
 * Brand logo card link — disables Next viewport prefetch and warms PLP listing
 * only on explicit click so home/brands grids do not flood `/api/v1/products/plp?brand=…`.
 */
export function BrandPlpLink({
  href,
  children,
  onClick,
  ...rest
}: BrandPlpLinkProps) {
  const warmOnClick = useCallback(() => {
    const queryString = queryStringFromPlpHref(href);
    if (!queryString.includes('brand=')) {
      return;
    }
    warmShopProductsClientCaches(getStoredLanguage(), queryString, {
      timeoutMs: BRAND_PLP_WARM_TIMEOUT_MS,
      includeCategories: false,
      suppressTimeoutLogging: true,
    });
  }, [href]);

  return (
    <Link
      href={href}
      prefetch={false}
      data-brand-plp-link=""
      onClick={(event) => {
        warmOnClick();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
