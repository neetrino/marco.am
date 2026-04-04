'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { HEADER_NAV_LINKS } from './headerConfig';

type TFunction = (key: string) => string;

interface NavLinksProps {
  t: TFunction;
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
  /** Optional wrapper, e.g. for mobile drawer */
  renderWrapper?: (children: ReactNode) => ReactNode;
}

export function NavLinks({
  t,
  className = '',
  linkClassName = '',
  onNavigate,
  renderWrapper,
}: NavLinksProps) {
  const content = (
    <>
      {HEADER_NAV_LINKS.map(({ href, translationKey }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={
            linkClassName ||
            'text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap'
          }
        >
          {t(translationKey)}
        </Link>
      ))}
    </>
  );

  if (renderWrapper) {
    return <>{renderWrapper(content)}</>;
  }

  return <nav className={`flex items-center gap-1 ${className}`} aria-label="Main navigation">{content}</nav>;
}
