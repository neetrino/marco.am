'use client';

import Image from 'next/image';
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
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

/** Subcategory row icon — keep img `width`/`height` in sync with Tailwind `h-[…] w-[…]` on the image. */
const SUBPILL_FIGMA_IMG_PX = 26;
/** Lucide `size` prop — matches Figma asset scale inside `size-[34px]` wrap. */
const SUBPILL_LUCIDE_STROKE_PX = 26;

const MEGA_GROUP_GRID_CLASS =
  'grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3';

const MEGA_PARENT_LINK_CLASS =
  `${headerCategoryNavFont.className} group mb-3 inline-flex max-w-full items-center gap-2 rounded-xl px-1 py-1.5 !text-[#383838] transition-[background-color,color] duration-150 hover:bg-marco-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 dark:!text-[#383838]`;

const MEGA_DESCENDANT_LINK_CLASS =
  `${headerCategoryNavFont.className} block rounded-lg px-2 py-1.5 text-sm leading-5 !text-[#383838]/85 transition-[background-color,color] duration-150 hover:bg-marco-gray/60 hover:!text-[#383838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/10 dark:!text-[#383838]/85 dark:hover:!text-[#383838]`;

function SubcategoryGroupParent({
  parent,
  lang,
  onNavigate,
}: {
  parent: Category;
  lang: LanguageCode;
  onNavigate: () => void;
}) {
  const row = resolveCategoryNavPresentation(parent.slug, parent.title, lang);
  const imageSrc = toSafeImgAttributeSrc(parent.media?.[0] ?? null);
  const count = parent.productCount ?? 0;

  return (
    <Link href={`/products?category=${parent.slug}`} onClick={onNavigate} className={MEGA_PARENT_LINK_CLASS}>
      <SubcategoryIcon icon={row.icon} imageSrc={imageSrc} />
      <span className="min-w-0 text-left text-sm font-bold leading-[18px] tracking-[0.14px] !text-[#383838] dark:!text-[#383838]">
        {row.title}
      </span>
      {count > 0 ? (
        <span className="shrink-0 whitespace-nowrap text-sm font-normal tabular-nums !text-[#383838]/60 dark:!text-[#383838]/60">
          ({count})
        </span>
      ) : null}
      <span
        className="ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-full !bg-[#383838] text-white opacity-80 transition-opacity group-hover:opacity-100 dark:!bg-[#383838]"
        aria-hidden
      >
        <ArrowUpRight className="size-3 shrink-0 !text-white dark:!text-white" strokeWidth={2.25} />
      </span>
    </Link>
  );
}

function SubcategoryIcon({ icon, imageSrc }: { icon: CategoryNavIcon; imageSrc: string | null }) {
  if (imageSrc) {
    return (
      <span className="flex size-[34px] shrink-0 items-center justify-center !text-[#383838] dark:!text-[#383838]">
        <Image
          src={toDomSafeImgSrcString(imageSrc)}
          alt=""
          width={SUBPILL_FIGMA_IMG_PX}
          height={SUBPILL_FIGMA_IMG_PX}
          className="h-[26px] w-[26px] shrink-0 object-contain"
          draggable={false}
          loading="lazy"
          unoptimized={shouldBypassNextImageOptimizer(imageSrc)}
        />
      </span>
    );
  }
  if (icon.kind === 'figma') {
    return (
      <span className="flex size-[34px] shrink-0 items-center justify-center !text-[#383838] dark:!text-[#383838]">
        <Image
          src={icon.src}
          alt=""
          width={SUBPILL_FIGMA_IMG_PX}
          height={SUBPILL_FIGMA_IMG_PX}
          className="h-[26px] w-[26px] shrink-0 object-contain brightness-0"
          draggable={false}
          loading="lazy"
          unoptimized={shouldBypassNextImageOptimizer(icon.src)}
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

/** Section title + compact multi-column subcategory groups (counts on parent rows only). */
export function CategoryMegaSubcategoryPills({
  sectionHeadingId,
  sectionTitle,
  sectionProductCount,
  groups,
  lang,
  onNavigate,
  loading = false,
}: {
  sectionHeadingId: string;
  sectionTitle: string;
  sectionProductCount?: number;
  groups: MegaMenuSubcategoryGroup[];
  lang: LanguageCode;
  onNavigate: () => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden md:gap-8">
        <div className="shrink-0 px-1 pt-1">
          <div className="h-8 w-2/3 max-w-md animate-pulse rounded-lg bg-marco-gray/80" />
          <div className="mt-3 h-[5px] w-[104px] animate-pulse rounded-full bg-marco-gray/70" />
        </div>
        <div className={`${MEGA_GROUP_GRID_CLASS} pr-1`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="h-5 w-4/5 animate-pulse rounded-md bg-marco-gray/70" />
              <div className="space-y-2 pl-2">
                <div className="h-4 w-full animate-pulse rounded-md bg-marco-gray/50" />
                <div className="h-4 w-5/6 animate-pulse rounded-md bg-marco-gray/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-hidden md:gap-8">
      <div className="shrink-0 px-1 pt-1">
        <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
          <h2
            id={sectionHeadingId}
            className={`${headerCategoryNavFont.className} text-[20px] font-bold uppercase leading-tight tracking-[-0.02em] !text-[#383838] md:text-[26px] md:leading-[1.1] lg:text-[32px] lg:leading-[37px] dark:!text-[#383838]`}
          >
            {sectionTitle}
          </h2>
          {sectionProductCount && sectionProductCount > 0 ? (
            <span
              className={`${headerCategoryNavFont.className} inline-flex shrink-0 items-center rounded-full bg-marco-yellow px-2.5 py-0.5 text-sm font-bold tabular-nums !text-[#383838] dark:!text-[#383838]`}
            >
              {sectionProductCount}
            </span>
          ) : null}
        </div>
        <div className="mt-2 h-[5px] w-[104px] shrink-0 bg-marco-yellow" aria-hidden />
      </div>

      <ul
        aria-labelledby={sectionHeadingId}
        className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-1 [scrollbar-gutter:auto] touch-pan-y ${MEGA_GROUP_GRID_CLASS}`}
      >
        {groups.map(({ parent, descendants }) => (
          <li key={parent.id} className="min-w-0">
            <SubcategoryGroupParent parent={parent} lang={lang} onNavigate={onNavigate} />
            {descendants.length > 0 ? (
              <ul className="flex flex-col gap-0.5 pl-1">
                {descendants.map((descendant: Category) => {
                  const row = resolveCategoryNavPresentation(descendant.slug, descendant.title, lang);
                  return (
                    <li key={descendant.id}>
                      <Link
                        href={`/products?category=${descendant.slug}`}
                        onClick={onNavigate}
                        className={MEGA_DESCENDANT_LINK_CLASS}
                      >
                        {row.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
