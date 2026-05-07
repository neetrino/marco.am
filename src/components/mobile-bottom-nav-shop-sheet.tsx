'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { useTranslation } from '../lib/i18n-client';
import { getStoredLanguage } from '../lib/language';
import { subscribeShopCategoryTreeUpdated } from '../lib/shop-category-tree-sync';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../lib/utils/image-utils';
import type { CategoriesResponse, Category } from './header/category-nav-types';

const ROOT_CATEGORY_LIMIT = 10;

interface MobileBottomNavShopSheetProps {
  open: boolean;
  activeCategorySlug: string | null;
  onClose: () => void;
  onSelectCategory: (slug: string | null) => void;
}

function useMobileShopCategories(open: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<CategoriesResponse>('/api/v1/categories/tree', {
        params: { lang: getStoredLanguage() },
      });
      setCategories(response.data ?? []);
      setHasLoaded(true);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || hasLoaded) {
      return;
    }
    void fetchCategories();
  }, [fetchCategories, hasLoaded, open]);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const unsubscribeTree = subscribeShopCategoryTreeUpdated(() => {
      void fetchCategories();
    });
    const handleLanguageUpdated = () => {
      void fetchCategories();
    };

    window.addEventListener('language-updated', handleLanguageUpdated);
    return () => {
      unsubscribeTree();
      window.removeEventListener('language-updated', handleLanguageUpdated);
    };
  }, [fetchCategories, hasLoaded]);

  return { categories, loading };
}

function getCategoryButtonClass(isActive: boolean): string {
  if (isActive) {
    return 'border-transparent bg-marco-yellow text-marco-black shadow-[0_8px_18px_rgba(250,204,21,0.32)]';
  }
  return 'border-marco-border bg-white text-marco-text hover:border-marco-yellow/55 hover:bg-[#fff9dc] dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-marco-yellow/50 dark:hover:bg-zinc-800';
}

function getCategoryImage(category: Category): string | null {
  return toSafeImgAttributeSrc(category.media?.[0] ?? null);
}

function renderCountBadge(count: number | undefined) {
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    return null;
  }

  return (
    <span className="ml-auto inline-flex min-w-[26px] items-center justify-center rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold leading-none text-marco-black dark:bg-white/15 dark:text-zinc-100">
      {count}
    </span>
  );
}

export function MobileBottomNavShopSheet({
  open,
  activeCategorySlug,
  onClose,
  onSelectCategory,
}: MobileBottomNavShopSheetProps) {
  const { t } = useTranslation();
  const { categories, loading } = useMobileShopCategories(open);

  const visibleRootCategories = useMemo(
    () => categories.slice(0, ROOT_CATEGORY_LIMIT),
    [categories],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label={t('common.navigation.categories')}>
      <div className="absolute inset-0 flex h-full w-full flex-col bg-[#f4f4f4] p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-wide text-marco-black dark:text-white">
            {t('common.navigation.categories')}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-marco-border bg-white text-marco-black dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200"
            aria-label={t('common.buttons.close')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="w-full rounded-2xl border border-dashed border-marco-border px-3 py-5 text-center text-sm text-marco-text dark:border-white/15 dark:text-zinc-300">
              {t('common.messages.loading')}
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className={`min-h-[96px] rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${getCategoryButtonClass(activeCategorySlug === null)}`}
              >
                <span className="flex h-full flex-col items-center gap-2 text-center">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-[11px] font-bold text-marco-black dark:bg-zinc-800 dark:text-zinc-200">
                    ALL
                  </span>
                  <span className="line-clamp-2 min-w-0">{t('products.categoryNavigation.shopAll')}</span>
                </span>
              </button>
              {visibleRootCategories.map((category) => {
                const isCategoryActive = activeCategorySlug === category.slug;
                const categoryImage = getCategoryImage(category);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onSelectCategory(category.slug)}
                    className={`min-h-[96px] rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${getCategoryButtonClass(isCategoryActive)}`}
                  >
                    <span className="flex h-full flex-col items-center gap-2 text-center">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/80 dark:bg-zinc-800">
                        {categoryImage ? (
                          <img
                            src={toDomSafeImgSrcString(categoryImage)}
                            alt=""
                            width={34}
                            height={34}
                            className="h-[34px] w-[34px] object-contain"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-marco-text/80 dark:text-zinc-300">CAT</span>
                        )}
                      </span>
                      <span className="line-clamp-2 min-w-0">{category.title}</span>
                      <span className="mt-auto">{renderCountBadge(category.productCount)}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {visibleRootCategories.some((category) => category.children.length > 0) ? (
              <div className="mt-3 space-y-2">
                {visibleRootCategories.map((category) => {
                  if (category.children.length === 0) {
                    return null;
                  }

                  return (
                    <div key={`${category.id}-children`} className="rounded-2xl border border-marco-border/80 bg-white/80 p-2 dark:border-white/10 dark:bg-zinc-900/75">
                      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-marco-text/75 dark:text-zinc-400">
                        {category.title}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {category.children.map((child) => {
                          const isChildActive = activeCategorySlug === child.slug;
                          const childImage = getCategoryImage(child);
                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => onSelectCategory(child.slug)}
                              className={`min-h-[82px] rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors ${getCategoryButtonClass(isChildActive)}`}
                            >
                              <span className="flex h-full flex-col items-center gap-1.5 text-center">
                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/80 dark:bg-zinc-800">
                                  {childImage ? (
                                    <img
                                      src={toDomSafeImgSrcString(childImage)}
                                      alt=""
                                      width={24}
                                      height={24}
                                      className="h-6 w-6 object-contain"
                                    />
                                  ) : (
                                    <span className="text-[8px] font-bold text-marco-text/80 dark:text-zinc-300">
                                      C
                                    </span>
                                  )}
                                </span>
                                <span className="line-clamp-2 min-w-0">{child.title}</span>
                                <span className="mt-auto">{renderCountBadge(child.productCount)}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
