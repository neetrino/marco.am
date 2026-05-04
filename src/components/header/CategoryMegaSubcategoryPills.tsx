'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LanguageCode } from '../../lib/language';
import type { Category } from './category-nav-types';
import type { CategoryNavIcon } from './categoryNavPresentation';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { headerCategoryNavFont } from './headerCategoryNavTypography';

/** Subcategory row icon — keep img `width`/`height` in sync with Tailwind `h-[…] w-[…]` on the image. */
const SUBPILL_FIGMA_IMG_PX = 26;
/** Lucide `size` prop — matches Figma asset scale inside `size-[34px]` wrap. */
const SUBPILL_LUCIDE_STROKE_PX = 26;

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
      className={`${headerCategoryNavFont.className} flex min-h-[44px] w-full min-w-0 items-center justify-between gap-2 rounded-[22px] border border-marco-border bg-white py-1 pl-2 pr-1.5 !text-[#050505] transition-[filter] hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 dark:!text-[#050505] md:gap-3 md:pl-2.5 md:pr-2`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <SubcategoryIcon icon={row.icon} />
        <span className="min-w-0 truncate text-left text-sm font-normal leading-[18px] tracking-[0.14px] !text-[#050505] dark:!text-[#050505]">
          {row.title}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2 md:gap-3">
        <span className="whitespace-nowrap text-xs font-normal leading-[18px] tracking-[0.12px] !text-[#050505] dark:!text-[#050505] md:text-sm">
          {countLine}
        </span>
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full !bg-[#050505] text-white dark:!bg-[#050505]"
          aria-hidden
        >
          <ArrowUpRight
            className="size-3 shrink-0 !text-white dark:!text-white"
            strokeWidth={2.25}
          />
        </span>
      </span>
    </Link>
  );
}

function SubcategoryIcon({ icon }: { icon: CategoryNavIcon }) {
  if (icon.kind === 'figma') {
    return (
      <span className="flex size-[34px] shrink-0 items-center justify-center !text-[#050505] dark:!text-[#050505]">
        <img
          src={icon.src}
          alt=""
          width={SUBPILL_FIGMA_IMG_PX}
          height={SUBPILL_FIGMA_IMG_PX}
          className="h-[26px] w-[26px] shrink-0 object-contain brightness-0"
          draggable={false}
        />
      </span>
    );
  }
  const RowLucide: LucideIcon = icon.Icon;
  return (
    <span className="flex size-[34px] shrink-0 items-center justify-center !text-[#050505] dark:!text-[#050505]">
      <RowLucide
        size={SUBPILL_LUCIDE_STROKE_PX}
        className="shrink-0 !text-[#050505] dark:!text-[#050505]"
        strokeWidth={1.35}
        aria-hidden
      />
    </span>
  );
}

/** Figma 242:1949 — section title + underline + pill rows (icon, title, count, arrow). */
export function CategoryMegaSubcategoryPills({
  sectionHeadingId,
  sectionTitle,
  items,
  lang,
  productsWord,
  emptyMessage,
  onNavigate,
}: {
  /** Stable `id` for the section heading — used by `aria-labelledby` on the scrollable subcategory list. */
  sectionHeadingId: string;
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
        id={sectionHeadingId}
        className={`${headerCategoryNavFont.className} text-[22px] font-bold uppercase leading-tight tracking-[-0.02em] !text-[#050505] md:text-[28px] md:leading-[1.1] lg:text-[34px] lg:leading-[39px] dark:!text-[#050505]`}
      >
        {sectionTitle}
      </h2>
      <div className="mt-2 h-[5px] w-[104px] shrink-0 bg-marco-yellow" aria-hidden />
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="mt-2 flex min-h-0 min-w-0 shrink-0 flex-col gap-4 overflow-hidden">
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden md:gap-10">
      {headerBlock}

      <ul
        aria-labelledby={sectionHeadingId}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-1 [scrollbar-gutter:auto] touch-pan-y md:gap-2.5"
      >
        {items.map((child) => (
          <li key={child.id} className="shrink-0">
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
