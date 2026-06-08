'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { useTransition } from 'react';

import { useAdminNav } from './AdminNavProvider';

type AdminNavLinkProps = {
  readonly href: string;
  readonly className: string;
  readonly children: ReactNode;
  readonly onNavigate?: () => void;
};

/** Admin sidebar/drawer link — optimistic highlight on click, prefetch on hover/pointer down. */
export function AdminNavLink({ href, className, children, onNavigate }: AdminNavLinkProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { beginAdminNavigation, prefetchAdminNavigation } = useAdminNav();

  const handlePointerDown = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.button !== 0) {
      return;
    }
    prefetchAdminNavigation(href);
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    beginAdminNavigation(href);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link
      href={href}
      prefetch
      scroll={false}
      className={className}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => prefetchAdminNavigation(href)}
      onFocus={() => prefetchAdminNavigation(href)}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
