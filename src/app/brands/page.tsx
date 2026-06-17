import { Suspense } from 'react';

import { StaticPageLoadingSkeleton } from '@/components/navigation/StaticPageLoadingSkeleton';

import { BrandsPageContent } from './BrandsPageContent';
import { BrandsPagePrefetch } from './BrandsPagePrefetch';

function BrandsPageLoadingFallback() {
  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <StaticPageLoadingSkeleton variant="grid" />
      </div>
    </div>
  );
}

/** Header shell paints immediately; brand grid streams in under Suspense. */
export default function BrandsPage() {
  return (
    <>
      <Suspense fallback={null}>
        <BrandsPagePrefetch />
      </Suspense>
      <Suspense fallback={<BrandsPageLoadingFallback />}>
        <BrandsPageContent />
      </Suspense>
    </>
  );
}
