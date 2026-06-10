'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LanguageCode } from '../../lib/language';
import type { Category } from './category-nav-types';
import type { MegaMenuSubcategoryGroup } from './categoryNavList';
import type { CategoryNavIcon } from './categoryNavPresentation';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { headerCategoryNavFont } from './headerCategoryNavTypography';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../lib/utils/image-utils';

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
  const imageSrc = toSafeImgAttributeSrc(child.media?.[0] ?? null);
  const count = child.productCount ?? 0;
  const countLine = `(${count}) ${productsWord}`;

  return (
    <Link
      href={`/products?category=${child.slug}`}
      onClick={onNavigate}
      className={`${headerCategoryNavFont.className} flex min-h-[44px] w-full min-w-0 items-center justify-between gap-2 rounded-[22px] border border-marco-border bg-white py-1 pl-2 pr-1.5 !text-[#383838] transition-[filter] hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 dark:!text-[#383838] md:gap-3 md:pl-2.5 md:pr-2`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        <SubcategoryIcon icon={row.icon} imageSrc={imageSrc} />
        <span className="min-w-0 truncate text-left text-sm font-bold leading-[18px] tracking-[0.14px] !text-[#383838] dark:!text-[#383838]">
          {row.title}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2 md:gap-3">
        <span className="whitespace-nowrap text-xs font-normal leading-[18px] tracking-[0.12px] !text-[#383838] dark:!text-[#383838] md:text-sm">
          {countLine}
        </span>
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full !bg-[#383838] text-white dark:!bg-[#383838]"
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

function SubcategoryIcon({ icon, imageSrc }: { icon: CategoryNavIcon; imageSrc: string | null }) {
  if (imageSrc) {
    return (
      <span className="flex size-[34px] shrink-0 items-center justify-center !text-[#383838] dark:!text-[#383838]">
        <img
          src={toDomSafeImgSrcString(imageSrc)}
          alt=""
          width={SUBPILL_FIGMA_IMG_PX}
          height={SUBPILL_FIGMA_IMG_PX}
          className="h-[26px] w-[26px] shrink-0 object-contain"
          draggable={false}
        />
      </span>
    );
  }
  if (icon.kind === 'figma') {
    return (
      <span className="flex size-[34px] shrink-0 items-center justify-center !text-[#383838] dark:!text-[#383838]">
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
    <span className="flex size-[34px] shrink-0 items-center justify-center !text-[#383838] dark:!text-[#383838]">
      <RowLucide
        size={SUBPILL_LUCIDE_STROKE_PX}
        className="shrink-0 !text-[#383838] dark:!text-[#383838]"
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
  groups,
  lang,
  productsWord,
  onNavigate,
}: {
  /** Stable `id` for the section heading — used by `aria-labelledby` on the scrollable subcategory list. */
  sectionHeadingId: string;
  sectionTitle: string;
  groups: MegaMenuSubcategoryGroup[];
  lang: LanguageCode;
  productsWord: string;
  onNavigate: () => void;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden md:gap-10">
      <div className="shrink-0 px-2.5 pt-2.5">
        <h2
          id={sectionHeadingId}
          className={`${headerCategoryNavFont.className} text-[20px] font-bold uppercase leading-tight tracking-[-0.02em] !text-[#383838] md:text-[26px] md:leading-[1.1] lg:text-[32px] lg:leading-[37px] dark:!text-[#383838]`}
        >
          {sectionTitle}
        </h2>
        <div className="mt-2 h-[5px] w-[104px] shrink-0 bg-marco-yellow" aria-hidden />
      </div>

      <ul
        aria-labelledby={sectionHeadingId}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-1 [scrollbar-gutter:auto] touch-pan-y md:gap-2.5"
      >
        {groups.map(({ parent, descendants }) => (
          <li key={parent.id} className="shrink-0 rounded-[16px] border border-marco-border bg-white/80 px-2 py-2">
            <SubcategoryPillRow
              child={parent}
              lang={lang}
              productsWord={productsWord}
              onNavigate={onNavigate}
            />
            {descendants.length > 0 ? (
              <div className="mt-2 grid grid-cols-1 gap-1.5 pl-3 md:grid-cols-2">
                {descendants.map((descendant: Category) => {
                  const row = resolveCategoryNavPresentation(descendant.slug, descendant.title, lang);
                  const descendantCount = descendant.productCount ?? 0;
                  return (
                    <Link
                      key={descendant.id}
                      href={`/products?category=${descendant.slug}`}
                      onClick={onNavigate}
                      className={`${headerCategoryNavFont.className} inline-flex min-h-[34px] items-center justify-between gap-2 rounded-[12px] border border-marco-border/80 bg-white px-2 py-1 text-sm leading-5 !text-[#383838] transition-[filter] hover:brightness-[0.98] dark:!text-[#383838]`}
                    >
                      <span className="min-w-0 truncate">{row.title}</span>
                      <span className="shrink-0 rounded-full bg-black/8 px-1.5 py-0.5 text-xs font-semibold">
                        {descendantCount}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
