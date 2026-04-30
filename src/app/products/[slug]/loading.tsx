import { ProductInfoPrimarySkeleton } from './ProductInfoPrimarySkeleton';

/**
 * Shown immediately on client navigation to `/products/[slug]` while the server segment streams.
 */
export default function ProductSlugLoading() {
  return (
    <div className="marco-header-container py-12">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        <div className="mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none md:flex-1">
          <div
            className="relative aspect-square w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]"
            aria-hidden
          />
        </div>
        <ProductInfoPrimarySkeleton />
      </div>
    </div>
  );
}
