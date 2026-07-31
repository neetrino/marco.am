import { StaticPageLoadingSkeleton } from '@/components/navigation/StaticPageLoadingSkeleton';

export default function BrandsLoading() {
  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <StaticPageLoadingSkeleton variant="grid" />
      </div>
    </div>
  );
}
