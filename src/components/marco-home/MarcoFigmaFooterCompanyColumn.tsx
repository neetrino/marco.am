'use client';

import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

export function MarcoFigmaFooterCompanyColumn() {
  const { t } = useTranslation();

  const links = [
    { href: '/about', key: 'home.figma_footer_link_about' },
    { href: '/stores', key: 'home.figma_footer_link_stores' },
    { href: '/careers', key: 'home.figma_footer_link_careers' },
    { href: '/blog', key: 'home.figma_footer_link_blog' },
    { href: '/contact', key: 'home.figma_footer_link_contact' },
  ] as const;

  return (
    <div>
      <h3 className="mb-4 text-[14px] font-bold uppercase tracking-[0.7px] text-[#181111]">
        {t('home.figma_footer_company')}
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
