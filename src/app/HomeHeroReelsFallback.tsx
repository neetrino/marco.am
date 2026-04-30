/**
 * Static chrome while hero + reels resolve — no pulse animation (reads as layout, not “loading”).
 */
export function HomeHeroReelsFallback() {
  const block =
    'rounded-lg border border-gray-200/80 bg-gray-50/90 dark:border-white/10 dark:bg-white/[0.06]';

  return (
    <div
      className="min-h-[min(52vh,560px)] w-full bg-[var(--app-bg)]"
      aria-hidden
    >
      <div className="marco-header-container pt-8 sm:pt-11 lg:pt-10">
        <div
          className={`relative aspect-[399/288] w-full min-w-0 overflow-hidden rounded-[24px] md:aspect-[141/68] md:rounded-[32px] ${block}`}
        />
      </div>
      <div className="marco-header-container mt-4 sm:mt-6 md:mt-8">
        <div className={`h-8 w-40 max-w-[55%] rounded-md sm:h-9 ${block}`} />
        <div className="mt-4 flex gap-3 overflow-hidden pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-40 w-[140px] shrink-0 rounded-xl sm:h-48 sm:w-[180px] ${block}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
