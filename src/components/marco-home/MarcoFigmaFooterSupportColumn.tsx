'use client';

import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

export function MarcoFigmaFooterSupportColumn() {
  const { t } = useTranslation();

  const links = [
    { href: '/delivery', key: 'home.figma_footer_link_delivery' },
    { href: '/installment', key: 'home.figma_footer_link_installment' },
    { href: '/warranty', key: 'home.figma_footer_link_warranty' },
    { href: '/faq', key: 'home.figma_footer_link_faq' },
    { href: '/service', key: 'home.figma_footer_link_service' },
  ] as const;

  return (
    <div>
      <h3 className="mb-4 text-[14px] font-bold uppercase tracking-[0.7px] text-[#181111]">
        {t('home.figma_footer_support')}
      </h3>
      <ul className="space-y-3 text-[14px] text-gray-500">
        {links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="hover:text-[#181111]">
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
