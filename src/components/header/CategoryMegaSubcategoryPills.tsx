'use client';

import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import type { LanguageCode } from '../../lib/language';
import type { Category } from './category-nav-types';
import type { MegaMenuSubcategoryGroup } from './categoryNavList';
import type { CategoryNavIcon } from './categoryNavPresentation';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { ShopListingLink } from './ShopListingLink';
import { headerCategoryNavFont } from './headerCategoryNavTypography';
import {
  HEADER_MEGA_MENU_DESCENDANT_PREVIEW_COUNT,
  HEADER_MEGA_MENU_SUBCATEGORY_GRID_CLASS,
} from './header.constants';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../lib/utils/image-utils';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

/** Subcategory row icon — keep img `width`/`height` in sync with Tailwind `h-[…] w-[…]` on the image. */
const SUBPILL_FIGMA_IMG_PX = 26;
/** Lucide `size` prop — matches Figma asset scale inside `size-[34px]` wrap. */
const SUBPILL_LUCIDE_STROKE_PX = 26;

const MEGA_GROUP_GRID_CLASS = HEADER_MEGA_MENU_SUBCATEGORY_GRID_CLASS;

const MEGA_PARENT_LINK_CLASS =
  `${headerCategoryNavFont.className} group mb-3 flex w-full max-w-full items-center gap-2 rounded-xl px-1 py-1.5 !text-[#383838] transition-[background-color,color] duration-150 hover:bg-marco-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/15 dark:!text-[#383838]`;

const MEGA_DESCENDANT_LINK_CLASS =
  `${headerCategoryNavFont.className} block rounded-lg px-2 py-1.5 text-sm leading-5 !text-[#383838]/85 transition-[background-color,color] duration-150 hover:bg-marco-gray/60 hover:!text-[#383838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/10 dark:!text-[#383838]/85 dark:hover:!text-[#383838]`;

const MEGA_DESCENDANT_SEE_ALL_CLASS =
  `${headerCategoryNavFont.className} mt-0.5 block w-full rounded-lg px-2 py-1.5 text-left text-sm font-semibold leading-5 !text-[#383838] underline decoration-[#383838]/30 underline-offset-2 transition-[background-color,color,decoration-color] duration-150 hover:bg-marco-gray/60 hover:decoration-[#383838] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/10 dark:!text-[#383838]`;

function SubcategoryDescendantList({
  descendants,
  lang,
  onNavigate,
}: {
  descendants: Category[];
  lang: LanguageCode;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const hasMore = descendants.length > HEADER_MEGA_MENU_DESCENDANT_PREVIEW_COUNT;
  const visibleDescendants = expanded
    ? descendants
    : descendants.slice(0, HEADER_MEGA_MENU_DESCENDANT_PREVIEW_COUNT);

  return (
    <ul className="flex flex-col gap-0.5 pl-1">
      {visibleDescendants.map((descendant: Category) => {
        const row = resolveCategoryNavPresentation(descendant.slug, descendant.title, lang);
        return (
          <li key={descendant.id}>
            <ShopListingLink
              href={`/products?category=${descendant.slug}`}
              onNavigate={onNavigate}
              className={MEGA_DESCENDANT_LINK_CLASS}
            >
              {row.title}
            </ShopListingLink>
          </li>
        );
      })}
      {hasMore && !expanded ? (
        <li>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={MEGA_DESCENDANT_SEE_ALL_CLASS}
          >
            {t('common.navigation.categoriesMegaMenu.seeAllSubcategories')}
          </button>
        </li>
      ) : null}
    </ul>
  );
}

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
    <ShopListingLink href={`/products?category=${parent.slug}`} onNavigate={onNavigate} className={MEGA_PARENT_LINK_CLASS}>
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
        className="ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-full !bg-[var(--marco-slate)] text-white transition-opacity group-hover:opacity-100"
        aria-hidden
      >
        <ArrowUpRight className="size-3 shrink-0 !text-white dark:!text-white" strokeWidth={2.25} />
      </span>
    </ShopListingLink>
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
      <div className="flex w-full min-w-0 flex-col gap-6 md:gap-8">
        <div className="shrink-0 pt-1">
          <div className="h-8 w-2/3 max-w-md animate-pulse rounded-lg bg-marco-gray/80" />
          <div className="mt-3 h-[5px] w-[104px] animate-pulse rounded-full bg-marco-gray/70" />
        </div>
        <div className={MEGA_GROUP_GRID_CLASS}>
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
    <div className="flex w-full min-w-0 flex-col gap-6 md:gap-8">
      <div className="w-full shrink-0 pt-1">
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

      <ul aria-labelledby={sectionHeadingId} className={MEGA_GROUP_GRID_CLASS}>
        {groups.map(({ parent, descendants }) => (
          <li key={parent.id} className="min-w-0 w-full">
            <SubcategoryGroupParent parent={parent} lang={lang} onNavigate={onNavigate} />
            {descendants.length > 0 ? (
              <SubcategoryDescendantList
                descendants={descendants}
                lang={lang}
                onNavigate={onNavigate}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
