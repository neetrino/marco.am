'use client';

import Link from 'next/link';

const FOOTER_LEGAL_LINK_CLASS =
  'text-[#6b7280] dark:text-[#cfcfcf] text-xs transition-colors hover:text-marco-black dark:hover:text-white';

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
