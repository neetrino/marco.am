'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';

import { getStoredLanguage } from '@/lib/language';
import { prefetchProductPdp } from '@/lib/product-pdp/prefetch-product-pdp';

type LinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'prefetch'>;

export type ProductPdpPrefetchLinkProps = LinkProps & {
  href: string;
  /** Base product slug (same segment as `/products/[slug]`). */
  productSlug: string;
  children: ReactNode;
  /** Next.js route prefetch; keep true so the RSC payload is prepared. */
  prefetchRoute?: boolean;
};

/**
 * Warms Next route + React Query as soon as the link is near the viewport (or on hover / touch),
 * so a click navigates to PDP without waiting on cold network.
 */
export function ProductPdpPrefetchLink({
  productSlug,
  href,
  children,
  prefetchRoute = true,
  onMouseEnter,
  onFocus,
  onPointerDown,
  onTouchStart,
  ...rest
}: ProductPdpPrefetchLinkProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const viewportWarmed = useRef(false);

  const warm = useCallback(() => {
    void prefetchProductPdp(queryClient, productSlug, getStoredLanguage());
    if (prefetchRoute) {
      void router.prefetch(href);
    }
  }, [queryClient, productSlug, href, prefetchRoute, router]);

  useEffect(() => {
    if (!prefetchRoute || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const el = linkRef.current;
    if (!el) {
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (!hit || viewportWarmed.current) {
          return;
        }
        viewportWarmed.current = true;
        warm();
      },
      { root: null, rootMargin: '320px 0px 200px 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefetchRoute, warm, href]);

  return (
    <Link
      ref={linkRef}
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
      {...rest}
    >
      {children}
    </Link>
  );
}
