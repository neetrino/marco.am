import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';

type ProductsShopFiltersColumnSkeletonProps = {
  readonly language?: LanguageCode;
};

/** Server-safe Suspense fallback for the PLP filter sidebar. */
export function ProductsShopFiltersColumnSkeleton({
  language = 'en',
}: ProductsShopFiltersColumnSkeletonProps) {
  return (
    <aside
      className="hidden w-[16rem] shrink-0 min-[744px]:block xl:w-[20rem]"
      aria-busy="true"
      aria-label={t(language, 'common.ariaLabels.loadingFilters')}
    >
      <div className="space-y-3 border-r border-slate-200/90 pb-4 pt-4 dark:border-white/15 min-[744px]:pr-3 xl:space-y-4 xl:pb-6 xl:pt-6 xl:pr-6">
        <div className="h-5 w-28 animate-pulse rounded-md bg-slate-200 dark:bg-slate-600" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-slate-600" />
        <div className="h-32 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-600" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-600" />
        <div className="h-20 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-600" />
      </div>
    </aside>
  );
}
