'use client';

import { useTranslation } from '@/lib/i18n-client';

export type ProductsShopLoadingSkeletonVariant = 'full' | 'body' | 'grid';

type ProductsShopLoadingSkeletonProps = {
  /** `body` = grid + filter column; `grid` = product grid cell only (parallel listing Suspense). */
  readonly variant?: ProductsShopLoadingSkeletonVariant;
};

/**
 * PLP placeholder: explicit slate colors (avoid `var(--app-text)/opacity` — often invisible in Tailwind).
 * Used by Suspense fallback and `loading.tsx` so navigations are never a blank white main.
 */
export function ProductsShopLoadingSkeleton({ variant = 'full' }: ProductsShopLoadingSkeletonProps) {
  const { t } = useTranslation();
  const bar = 'rounded-md bg-slate-200 animate-pulse dark:bg-slate-600';
  const block = 'rounded-lg bg-slate-200 animate-pulse dark:bg-slate-600';
  const card = 'h-[260px] w-full max-w-[286px] rounded-lg bg-slate-200 animate-pulse sm:h-[280px] dark:bg-slate-600';

  const gridSkeleton = (
    <div className="min-h-[48vh] min-w-0 flex-1 overflow-x-hidden bg-slate-50/80 pt-4 pb-6 min-[744px]:min-h-[52vh] min-[744px]:w-auto min-[744px]:bg-transparent min-[744px]:py-4 dark:bg-slate-950/40 min-[744px]:dark:bg-transparent">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-12">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="flex min-w-0 justify-end pr-2 sm:pr-3 md:pr-4">
            <div className={card} />
          </div>
        ))}
      </div>
    </div>
  );

  if (variant === 'grid') {
    return (
      <div className="min-w-0 flex-1 w-full" aria-busy="true" aria-label={t('common.ariaLabels.loadingProducts')}>
        {gridSkeleton}
      </div>
    );
  }

  const titleSkeleton = (
    <div className="mb-4 lg:mb-5 xl:mb-6">
      <div className={`h-8 w-36 sm:h-9 sm:w-44 ${bar}`} />
      <div className={`mt-2 h-1 w-20 rounded-sm ${bar}`} />
    </div>
  );

  return (
    <div
      className="w-full max-w-full min-h-[min(72vh,820px)] bg-[var(--app-bg)] pb-4 md:min-h-[min(68vh,760px)] md:pb-32 lg:pb-40"
      aria-busy="true"
      aria-label={t('common.ariaLabels.loadingShop')}
    >
      <div className="marco-header-container pt-[58px]">
        <div className="flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
          <aside className="hidden w-[16rem] shrink-0 min-[744px]:block xl:w-[20rem]" aria-hidden>
            <div className="space-y-3 border-r border-slate-200/90 pb-4 dark:border-white/15 min-[744px]:pr-3 xl:space-y-4 xl:pb-6 xl:pr-6">
              {titleSkeleton}
              <div className={`h-32 w-full ${block}`} />
              <div className={`h-24 w-full ${block}`} />
              <div className={`h-20 w-full ${block}`} />
            </div>
          </aside>

          <div className="min-w-0 flex-1 w-full min-[744px]:w-auto">
            <div className="pb-2 min-[744px]:hidden">{titleSkeleton}</div>
            {gridSkeleton}
          </div>
        </div>
      </div>
    </div>
  );
}
