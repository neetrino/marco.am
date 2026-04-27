'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { pushShopProductsListingUrl } from '../lib/push-shop-products-listing-url';
import { useTranslation } from '../lib/i18n-client';
import { useCategories } from './CategoryNavigation/hooks/useCategories';
import { useCategoryProducts } from './CategoryNavigation/hooks/useCategoryProducts';
import { useCategoryScroll } from './CategoryNavigation/hooks/useCategoryScroll';
import { CategoryItem } from './CategoryNavigation/CategoryItem';
import { CategoryScrollButtons } from './CategoryNavigation/CategoryScrollButtons';
import { CategoryNavigationLoading } from './CategoryNavigation/CategoryNavigationLoading';
import type { Category } from './CategoryNavigation/utils';

function CategoryNavigationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const currentCategory = searchParams?.get('category');
  
  const { categories, loading: categoriesLoading } = useCategories();
  const { categoryProducts, loading: productsLoading } = useCategoryProducts(categories, t);
  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    scrollByAmount,
    updateScrollButtons,
  } = useCategoryScroll();

  const loading = categoriesLoading || productsLoading;

  const handleCategoryClick = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (categorySlug && categorySlug !== 'all') {
      params.set('category', categorySlug);
    } else {
      params.delete('category');
    }
    
    // Reset to page 1 when changing category
    params.delete('page');

    const qs = params.toString();
    pushShopProductsListingUrl(router, qs ? `/products?${qs}` : '/products');
  };

  useEffect(() => {
    // ÐžÐ±Ð½Ð¾Ð²Ð»ÑÐµÐ¼ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ ÐºÐ½Ð¾Ð¿Ð¾Ðº Ð¿Ð¾ÑÐ»Ðµ Ð·Ð°Ð³Ñ€ÑƒÐ·ÐºÐ¸ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ð¸ Ð¿Ñ€Ð¾Ð´ÑƒÐºÑ‚Ð¾Ð²
    if (!loading && categories.length > 0) {
      setTimeout(() => {
        updateScrollButtons();
      }, 200);
    }
  }, [categories.length, Object.keys(categoryProducts).length, loading, updateScrollButtons]);

  if (loading) {
    return <CategoryNavigationLoading />;
  }

  // Add "All" category at the beginning
  const allCategoriesWithAll = [
    { id: 'all', slug: 'all', title: t('products.categoryNavigation.all'), fullPath: 'all', children: [] } as Category,
    ...categories
  ];

  // Limit to first 10 categories for horizontal navigation
  const displayCategories = allCategoriesWithAll.slice(0, 10);

  return (
    <div className="bg-white border-b border-gray-200 py-3 sm:py-4 md:py-6 w-full">
      <div className="page-shell">
        <div className="relative">
          <CategoryScrollButtons
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
            onScrollLeft={() => scrollByAmount(-220)}
            onScrollRight={() => scrollByAmount(220)}
            t={t}
          />
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-hide pb-1 sm:pb-2 pl-2 sm:pl-4 md:pl-6"
            style={{ scrollBehavior: 'smooth' }}
          >
            {displayCategories.map((category) => {
              const isActive = category.slug === 'all' 
                ? !currentCategory 
                : currentCategory === category.slug;
              const product = categoryProducts[category.slug];

              return (
                <CategoryItem
                  key={category.id}
                  category={category}
                  product={product}
                  isActive={isActive}
                  currentCategory={currentCategory}
                  onCategoryClick={handleCategoryClick}
                  t={t}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryNavigation() {
  return (
    <Suspense fallback={<CategoryNavigationLoading />}>
      <CategoryNavigationContent />
    </Suspense>
  );
}


