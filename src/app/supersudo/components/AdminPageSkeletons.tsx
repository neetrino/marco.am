const SKELETON_BLOCK = 'animate-pulse rounded-xl bg-gray-100';

function SkeletonBar({ className }: { className: string }) {
  return <div className={`${SKELETON_BLOCK} ${className}`} aria-hidden />;
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 pb-8" aria-busy="true">
      <SkeletonBar className="h-44 rounded-[28px]" />
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <SkeletonBar className="h-72" />
          <SkeletonBar className="h-56" />
        </div>
        <SkeletonBar className="h-96" />
      </div>
    </div>
  );
}

export function DeliveryPageSkeleton() {
  return (
    <div className="space-y-6 pb-8" aria-busy="true">
      <div className={`overflow-hidden ${SKELETON_BLOCK} rounded-2xl`}>
        <div className="space-y-4 border-b border-gray-200/80 p-6">
          <SkeletonBar className="h-1 w-14 rounded-full" />
          <SkeletonBar className="h-7 w-64 max-w-full" />
          <SkeletonBar className="h-4 w-96 max-w-full" />
        </div>
        <div className="space-y-4 p-6">
          <SkeletonBar className="h-28" />
          <SkeletonBar className="h-28" />
          <SkeletonBar className="h-28" />
        </div>
        <div className="flex gap-3 border-t border-gray-200/80 p-6">
          <SkeletonBar className="h-11 w-40" />
          <SkeletonBar className="h-11 w-32" />
        </div>
      </div>
    </div>
  );
}

export function HeroBannerPageSkeleton() {
  return (
    <div className="space-y-5 pb-8" aria-busy="true">
      <div className="flex gap-2">
        <SkeletonBar className="h-10 w-28" />
        <SkeletonBar className="h-10 w-28" />
      </div>
      <SkeletonBar className="aspect-[16/7] w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonBar className="h-40" />
        <SkeletonBar className="h-40" />
      </div>
    </div>
  );
}
