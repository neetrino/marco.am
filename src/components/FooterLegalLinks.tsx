'use client';

import Link from 'next/link';

import { FOOTER_MUTED_TEXT_CLASS, FOOTER_NAV_BODY_TEXT_CLASS } from './footer.constants';

const FOOTER_LEGAL_LINK_CLASS = `${FOOTER_MUTED_TEXT_CLASS} ${FOOTER_NAV_BODY_TEXT_CLASS} transition-colors hover:text-marco-black dark:hover:text-white`;

export type FooterLegalLinkItem = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

type FooterLegalLinksProps = {
  readonly items: readonly FooterLegalLinkItem[];
  readonly ariaLabel: string;
};

export function FooterLegalLinks({ items, ariaLabel }: FooterLegalLinksProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-black/10 dark:border-white/10 pt-4 md:justify-start"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <Link key={item.id} href={item.href} className={FOOTER_LEGAL_LINK_CLASS}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
