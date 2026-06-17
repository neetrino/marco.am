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
import {
  type ProductPdpNavigationSeed,
} from '@/lib/product-pdp/pdp-navigation-seed';
import { seedProductPdpCache } from '@/lib/product-pdp/pdp-navigation-seed-cache';
import {
  prefetchProductPdp,
  prefetchProductPdpOnCommit,
} from '@/lib/product-pdp/prefetch-product-pdp';

type LinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'>;

export type ProductPdpPrefetchLinkProps = LinkProps & {
  href: string;
  /** Base product slug (same segment as `/products/[slug]`). */
  productSlug: string;
  children: ReactNode;
  /** Manual route prefetch on user intent; Next's viewport auto-prefetch stays disabled. */
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
    const language = getStoredLanguage();
    seedProductPdpCache({
      queryClient,
      slug: productSlug,
      language,
      navigationSeed,
    });
    const galleryUrls =
      navigationSeed.images && navigationSeed.images.length > 0
        ? navigationSeed.images
        : navigationSeed.image
          ? [navigationSeed.image]
          : [];
    for (const url of galleryUrls) {
      const img = new window.Image();
      img.src = url;
    }
  }, [navigationSeed, productSlug, queryClient]);

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      onPointerDown={(e) => {
        persistSeed();
        warm();
        onPointerDown?.(e);
      }}
      onTouchStart={(e) => {
        persistSeed();
        warm();
        onTouchStart?.(e);
      }}
      onClick={(e) => {
        persistSeed();
        void prefetchProductPdpOnCommit(queryClient, productSlug, getStoredLanguage());
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </Link>
  );
}
