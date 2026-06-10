'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';

import { getStoredLanguage } from '@/lib/language';
import { setProductPdpNavigationSeed, type ProductPdpNavigationSeed } from '@/lib/product-pdp/pdp-navigation-seed';
import { prefetchProductPdp } from '@/lib/product-pdp/prefetch-product-pdp';

type LinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'>;

export type ProductPdpPrefetchLinkProps = LinkProps & {
  href: string;
  /** Base product slug (same segment as `/products/[slug]`). */
  productSlug: string;
  children: ReactNode;
  /** Next.js route prefetch; keep true so the RSC payload is prepared. */
  prefetchRoute?: boolean;
  /** Disable data prefetch when route churn is high (e.g. PLP filtering). */
  prefetchData?: boolean;
  /** Optional card payload to render PDP instantly before detail arrives. */
  navigationSeed?: ProductPdpNavigationSeed;
};

/**
 * Warms Next route + React Query on direct user intent (hover/focus/touch),
 * so PLP does not flood the backend while preserving fast PDP navigation.
 */
export function ProductPdpPrefetchLink({
  productSlug,
  href,
  children,
  prefetchRoute = true,
  prefetchData = true,
  navigationSeed,
  onMouseEnter,
  onFocus,
  onPointerDown,
  onTouchStart,
  onClick,
  ...rest
}: ProductPdpPrefetchLinkProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const warmedRef = useRef(false);

  const warm = useCallback(() => {
    if (warmedRef.current) {
      return;
    }
    warmedRef.current = true;
    if (prefetchData) {
      void prefetchProductPdp(queryClient, productSlug, getStoredLanguage());
    }
    if (prefetchRoute) {
      void router.prefetch(href);
    }
  }, [queryClient, productSlug, href, prefetchRoute, prefetchData, router]);

  const persistSeed = useCallback(() => {
    if (!navigationSeed) {
      return;
    }
    setProductPdpNavigationSeed(productSlug, getStoredLanguage(), navigationSeed);
  }, [navigationSeed, productSlug]);

  return (
    <Link
      href={href}
      prefetch={prefetchRoute ? true : false}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      onPointerDown={(e) => {
        warm();
        onPointerDown?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
      onClick={(e) => {
        persistSeed();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
