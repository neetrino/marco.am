'use client';

import { type Dispatch, type SetStateAction, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import type { LanguageCode } from '../../lib/language';
import type { Category } from './category-nav-types';
import { dedupeCategories } from './categoryNavList';
import { resolveCategoryNavPresentation } from './categoryNavPresentation';
import { mobileDrawerNavPillClass } from './header-mobile-drawer.classes';

function hideBrokenCategoryIcon(event: SyntheticEvent<HTMLImageElement>) {
  const wrapper = event.currentTarget.parentElement;
  if (wrapper instanceof HTMLElement) {
    wrapper.style.display = 'none';
    return;
  }
  event.currentTarget.style.display = 'none';
}

export type HeaderMobileDrawerCategoriesProps = {
  t: (key: string) => string;
  lang: LanguageCode;
  loadingCategories: boolean;
  rootCategories: Category[];
  categoriesOpen: boolean;
  setCategoriesOpen: Dispatch<SetStateAction<boolean>>;
  expandedCategorySlug: string | null;
  setExpandedCategorySlug: Dispatch<SetStateAction<string | null>>;
  onNavigate: () => void;
};

export function HeaderMobileDrawerCategories({
  t,
  lang,
  loadingCategories,
  rootCategories,
  categoriesOpen,
  setCategoriesOpen,
  expandedCategorySlug,
  setExpandedCategorySlug,
  onNavigate,
}: HeaderMobileDrawerCategoriesProps) {
  return (
    <div>
      <button
        type="button"
        onClick={() => setCategoriesOpen((prev) => !prev)}
        className={`${mobileDrawerNavPillClass(categoriesOpen)} gap-3`}
        aria-expanded={categoriesOpen}
        aria-controls="mobile-categories-menu"
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <LayoutGrid className="h-[22px] w-[22px] shrink-0" strokeWidth={2} aria-hidden />
          <span className="truncate">{t('common.navigation.categories')}</span>
        </span>
        <ChevronDown
          className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {categoriesOpen && (
        <div
          id="mobile-categories-menu"
          className="mt-2 space-y-1 rounded-2xl bg-marco-gray/90 p-2 dark:bg-zinc-800/90"
        >
          {loadingCategories ? (
            <p className="px-3 py-2 text-sm text-marco-text dark:text-zinc-400">{t('common.messages.loading')}</p>
          ) : (
            rootCategories.map((category) => {
              const categoryPresentation = resolveCategoryNavPresentation(
                category.slug,
                category.title,
                lang
              );
              const CategoryIcon =
                categoryPresentation.icon.kind === 'lucide' ? categoryPresentation.icon.Icon : null;
              const hasChildren = category.children.length > 0;
              const isExpanded = expandedCategorySlug === category.slug;
              return (
                <div key={category.id} className="rounded-xl bg-white/80 dark:bg-zinc-900/60">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategorySlug((prev) =>
                          prev === category.slug ? null : category.slug
                        )
                      }
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-marco-black dark:text-white"
                      aria-expanded={isExpanded}
                      aria-controls={`mobile-category-children-${category.id}`}
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marco-gray dark:bg-zinc-800">
                          {categoryPresentation.icon.kind === 'figma' ? (
                            <img
                              src={categoryPresentation.icon.src}
                              alt=""
                              width={24}
                              height={24}
                              className="h-6 w-6 object-contain dark:brightness-0 dark:invert"
                              draggable={false}
                              onError={hideBrokenCategoryIcon}
                            />
                          ) : (
                            CategoryIcon && (
                              <CategoryIcon
                                size={20}
                                strokeWidth={1.7}
                                className="text-marco-black dark:text-white"
                                aria-hidden
                              />
                            )
                          )}
                        </span>
                        <span className="min-w-0 flex-1 whitespace-normal break-words">
                          {categoryPresentation.title}
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                  ) : (
                    <div className="px-1 py-1">
                      <Link
                        href={`/products?category=${category.slug}`}
                        onClick={onNavigate}
                        className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold text-marco-black hover:bg-marco-gray/50 dark:text-white dark:hover:bg-zinc-800"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marco-gray dark:bg-zinc-800">
                          {categoryPresentation.icon.kind === 'figma' ? (
                            <img
                              src={categoryPresentation.icon.src}
                              alt=""
                              width={24}
                              height={24}
                              className="h-6 w-6 object-contain dark:brightness-0 dark:invert"
                              draggable={false}
                              onError={hideBrokenCategoryIcon}
                            />
                          ) : (
                            CategoryIcon && (
                              <CategoryIcon
                                size={20}
                                strokeWidth={1.7}
                                className="text-marco-black dark:text-white"
                                aria-hidden
                              />
                            )
                          )}
                        </span>
                        <span className="min-w-0 flex-1 whitespace-normal break-words">
                          {categoryPresentation.title}
                        </span>
                      </Link>
                    </div>
                  )}
                  {hasChildren && isExpanded && (
                    <div
                      id={`mobile-category-children-${category.id}`}
                      className="space-y-1 border-t border-marco-black/8 px-2 py-2 dark:border-white/10"
                    >
                      <Link
                        href={`/products?category=${category.slug}`}
                        onClick={onNavigate}
                        className="flex rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide text-marco-black/80 hover:bg-marco-yellow/40 dark:text-marco-yellow dark:hover:bg-marco-yellow/10"
                      >
                        {t('common.navigation.categoriesMegaMenu.viewProducts')}
                      </Link>
                      {dedupeCategories(category.children, lang).map((child) => {
                        const childPresentation = resolveCategoryNavPresentation(
                          child.slug,
                          child.title,
                          lang
                        );
                        const ChildIcon =
                          childPresentation.icon.kind === 'lucide' ? childPresentation.icon.Icon : null;
                        return (
                          <Link
                            key={child.id}
                            href={`/products?category=${child.slug}`}
                            onClick={onNavigate}
                            className="flex items-start gap-2 rounded-full px-2 py-2 text-sm leading-5 text-marco-text hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marco-gray dark:bg-zinc-800">
                              {childPresentation.icon.kind === 'figma' ? (
                                <img
                                  src={childPresentation.icon.src}
                                  alt=""
                                  width={18}
                                  height={18}
                                  className="h-[18px] w-[18px] object-contain dark:brightness-0 dark:invert"
                                  draggable={false}
                                  onError={hideBrokenCategoryIcon}
                                />
                              ) : (
                                ChildIcon && (
                                  <ChildIcon
                                    size={16}
                                    strokeWidth={1.7}
                                    className="text-marco-black dark:text-white"
                                    aria-hidden
                                  />
                                )
                              )}
                            </span>
                            <span className="whitespace-normal break-words">{childPresentation.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
