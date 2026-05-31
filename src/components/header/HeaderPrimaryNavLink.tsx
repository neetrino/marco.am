'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';

type HeaderPrimaryNavLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'> & {
  href: string;
};

/**
 * Primary header nav link — always prefetches and warms the route on pointer down
 * so the first click navigates without waiting for idle-time prefetch.
 */
export function HeaderPrimaryNavLink({
  href,
  onPointerDown,
  ...rest
}: HeaderPrimaryNavLinkProps) {
  const router = useRouter();

  const warmRoute = useCallback(() => {
    void router.prefetch(href);
  }, [router, href]);

  return (
    <Link
      href={href}
      prefetch
      onPointerDown={(event) => {
        warmRoute();
        onPointerDown?.(event);
      }}
      {...rest}
    />
  );
}
