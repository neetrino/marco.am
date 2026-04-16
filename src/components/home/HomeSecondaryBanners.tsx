'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n-client';

export function HomeSecondaryBanners() {
  const { t } = useTranslation();

  return (
    <section className="bg-white pb-12 md:pb-16">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <Link
            href="/products"
            className="group flex min-h-[180px] flex-col justify-center rounded-[20px] bg-[#2f2f2f] px-8 py-10 transition-opacity hover:opacity-95 md:min-h-[220px]"
          >
            <span className="text-4xl font-black uppercase tracking-tight text-[#ffca03] md:text-5xl">
              {t('home.secondary_banner_label')}
            </span>
            <span className="mt-6 inline-flex w-fit items-center justify-center rounded-full bg-[#ffca03] px-8 py-3 text-sm font-bold text-[#101010]">
              {t('home.banner_shop_now')}
            </span>
          </Link>

          <Link
            href="/products"
            className="group flex min-h-[180px] flex-col justify-center rounded-[20px] bg-[#c8d8e4] px-8 py-10 transition-opacity hover:opacity-95 md:min-h-[220px]"
          >
            <span className="text-4xl font-black uppercase tracking-tight text-[#101010] md:text-5xl">
              {t('home.secondary_banner_label')}
            </span>
            <span className="mt-6 inline-flex w-fit items-center justify-center rounded-full bg-[#101010] px-8 py-3 text-sm font-bold text-white">
              {t('home.banner_shop_now')}
            </span>
          </Link>
      </div>
    </section>
  );
}
