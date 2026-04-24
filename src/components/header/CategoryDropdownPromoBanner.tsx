'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { headerCategoryNavFont } from './headerCategoryNavTypography';

/** Figma 218:5785 — promo strip (gradient, pill badge, headline, subline, yellow CTA + arrow). */
export function CategoryDropdownPromoBanner({
  badge,
  headline,
  subline,
  href,
  ctaLabel,
  onNavigate,
}: {
  badge: string;
  headline: string;
  subline: string;
  href: string;
  ctaLabel: string;
  onNavigate: () => void;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-[13px] bg-gradient-to-b from-[rgba(255,202,3,0.45)] to-[#fff9e5] p-5 pb-6 md:mb-5 md:p-6">
      <span
        className={`${headerCategoryNavFont.className} relative -top-1 mb-3 inline-flex rounded-full bg-[rgba(110,108,77,0.2)] px-3 py-1 text-xs font-bold leading-4 !text-[#050505] dark:!text-[#050505]`}
      >
        {badge}
      </span>
      <h2
        className={`${headerCategoryNavFont.className} mb-3 text-2xl font-black leading-[1.15] tracking-tight text-[#0f172a] md:text-[28px]`}
      >
        {headline}
      </h2>
      <p
        className={`${headerCategoryNavFont.className} mb-6 text-base leading-7 text-[#475569] md:text-lg md:leading-8`}
      >
        {subline}
      </p>
      <Link
        href={href}
        onClick={onNavigate}
        className={`${headerCategoryNavFont.className} inline-flex w-auto max-w-full items-center gap-2 self-start rounded-[68px] bg-marco-yellow py-2 pl-4 pr-1.5 text-sm font-bold !text-[#050505] dark:!text-[#050505] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/20 sm:gap-2.5 sm:pl-5 sm:pr-2 sm:text-base`}
      >
        <span className="min-w-0 whitespace-nowrap !text-[#050505] dark:!text-[#050505]">{ctaLabel}</span>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full !bg-[#050505] text-white dark:!bg-[#050505] sm:size-10"
          aria-hidden
        >
          <ArrowUpRight
            className="size-3.5 shrink-0 !text-white dark:!text-white sm:size-4"
            strokeWidth={2.5}
          />
        </span>
      </Link>
    </div>
  );
}
