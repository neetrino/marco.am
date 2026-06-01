type StaticPageLoadingSkeletonProps = {
  readonly variant?: 'default' | 'grid' | 'grid-body' | 'reels';
};

const pulse = 'animate-pulse rounded-md bg-slate-200 dark:bg-slate-600';

/**
 * Instant placeholder for marketing/static routes while RSC payload or dev compile finishes.
 */
export function StaticPageLoadingSkeleton({ variant = 'default' }: StaticPageLoadingSkeletonProps) {
  if (variant === 'grid' || variant === 'grid-body') {
    return (
      <div
        className="w-full"
        aria-busy="true"
        aria-label="Loading"
      >
        {variant === 'grid' ? <div className={`mb-8 h-10 w-48 ${pulse}`} /> : null}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={`min-h-[120px] rounded-2xl ${pulse}`} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'reels') {
    return (
      <div
        className="mx-auto w-full max-w-screen-2xl px-1 pt-1 sm:px-2 sm:pt-2"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="grid grid-cols-3 gap-px sm:gap-1 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className={`aspect-[9/16] w-full bg-slate-200 dark:bg-slate-700 ${pulse}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="marco-header-container min-h-[50vh] py-10 md:py-14"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className={`mb-4 h-4 w-32 ${pulse}`} />
      <div className={`mb-8 h-10 w-64 max-w-full ${pulse}`} />
      <div className="space-y-3">
        <div className={`h-4 w-full max-w-2xl ${pulse}`} />
        <div className={`h-4 w-full max-w-xl ${pulse}`} />
        <div className={`h-4 w-full max-w-lg ${pulse}`} />
      </div>
    </div>
  );
}
