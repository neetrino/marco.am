'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LanguageCode } from '../../lib/language';
import type { Category } from './category-nav-types';
import type { CategoryNavIcon } from './categoryNavPresentation';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { headerCategoryNavFont } from './headerCategoryNavTypography';

function SubcategoryPillRow({
  child,
  lang,
  productsWord,
  onNavigate,
}: {
  child: Category;
  lang: LanguageCode;
  productsWord: string;
  onNavigate: () => void;
}) {
  const row = resolveCategoryNavPresentation(child.slug, child.title, lang);
  const count = child.productCount ?? 0;
  const countLine = `(${count}) ${productsWord}`;

  return (
    <Link
      href={`/products?category=${child.slug}`}
      onClick={onNavigate}
      className={`${headerCategoryNavFont.className} flex h-[67px] w-full min-w-0 items-center justify-between gap-3 rounded-[33.5px] bg-[#f4f4f4] py-[5px] pl-[11px] pr-2 !text-[#050505] transition-[filter] hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 dark:!text-[#050505] md:gap-6 md:pl-2.5 md:pr-2`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-4 md:gap-[29px]">
        <SubcategoryIcon icon={row.icon} />
        <span className="min-w-0 truncate text-left text-base font-normal leading-[22px] tracking-[0.16px] !text-[#050505] dark:!text-[#050505]">
          {row.title}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-4 md:gap-[38px]">
        <span className="whitespace-nowrap text-sm font-normal leading-[22px] tracking-[0.16px] !text-[#050505] dark:!text-[#050505] md:text-base">
          {countLine}
        </span>
        <span
          className="flex size-[40px] shrink-0 items-center justify-center rounded-full !bg-[#050505] text-white dark:!bg-[#050505] md:size-[50px]"
          aria-hidden
        >
          <ArrowUpRight
            className="size-3.5 shrink-0 !text-white dark:!text-white md:size-4"
            strokeWidth={2.5}
          />
        </span>
      </span>
    </Link>
  );
}

function SubcategoryIcon({ icon }: { icon: CategoryNavIcon }) {
  if (icon.kind === 'figma') {
    return (
      <span className="flex size-[45px] shrink-0 items-center justify-center !text-[#050505] md:size-[50px] dark:!text-[#050505]">
        <img
          src={icon.src}
          alt=""
          width={38}
          height={38}
          className="h-[38px] w-[38px] shrink-0 object-contain brightness-0"
          draggable={false}
        />
      </span>
    );
  }
  const RowLucide: LucideIcon = icon.Icon;
  return (
    <span className="flex size-[45px] shrink-0 items-center justify-center !text-[#050505] md:size-[50px] dark:!text-[#050505]">
      <RowLucide
        size={38}
        className="shrink-0 !text-[#050505] dark:!text-[#050505]"
        strokeWidth={1.35}
        aria-hidden
      />
    </span>
  );
}

/** Figma 242:1949 — section title + underline + pill rows (icon, title, count, arrow). */
export function CategoryMegaSubcategoryPills({
  sectionTitle,
  items,
  lang,
  productsWord,
  emptyMessage,
  onNavigate,
}: {
  sectionTitle: string;
  items: Category[];
  lang: LanguageCode;
  productsWord: string;
  emptyMessage: string;
  onNavigate: () => void;
}) {
  const headerBlock = (
    <div className="shrink-0 px-2.5 pt-2.5">
      <h2
        className={`${headerCategoryNavFont.className} text-[22px] font-bold uppercase leading-tight tracking-[-0.02em] !text-[#050505] md:text-[28px] md:leading-[1.1] lg:text-[34px] lg:leading-[39px] dark:!text-[#050505]`}
      >
        {sectionTitle}
      </h2>
      <div className="mt-2 h-[5px] w-[104px] shrink-0 bg-marco-yellow" aria-hidden />
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="mt-2 flex min-h-0 min-w-0 shrink-0 flex-col gap-4">
        {headerBlock}
        <p
          className={`${headerCategoryNavFont.className} px-2.5 text-sm leading-relaxed !text-[#050505] md:text-base dark:!text-[#050505]`}
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-8 md:gap-[62px]">
      {headerBlock}

      <ul className="flex flex-col gap-[11px] pr-1">
        {items.map((child) => (
          <li key={child.id}>
            <SubcategoryPillRow
              child={child}
              lang={lang}
              productsWord={productsWord}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
