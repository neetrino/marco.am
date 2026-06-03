const FALLBACK_BLOCK_CLASS =
  'rounded-lg border border-gray-200/80 bg-gray-50/90 dark:border-white/10 dark:bg-white/[0.06]';

/** Hero carousel placeholder while `HomeHeroBannerSection` streams. */
export function HomeHeroBannerFallback() {
  return (
    <div className="marco-header-container pt-8 sm:pt-11 lg:pt-10" aria-hidden>
      <div
        className={`relative aspect-[399/288] w-full min-w-0 overflow-hidden rounded-[24px] md:aspect-[141/68] md:rounded-[32px] ${FALLBACK_BLOCK_CLASS}`}
      />
    </div>
  );
}

/** REELS rail placeholder while `HomeReelsBelowHero` streams. */
export function HomeReelsRailFallback() {
  return (
    <div className="marco-header-container mt-4 sm:mt-6 md:mt-8" aria-hidden>
      <div className={`h-8 w-40 max-w-[55%] rounded-md sm:h-9 ${FALLBACK_BLOCK_CLASS}`} />
      <div className="mt-4 flex gap-3 overflow-hidden pb-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-40 w-[140px] shrink-0 rounded-xl sm:h-48 sm:w-[180px] ${FALLBACK_BLOCK_CLASS}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Static chrome while hero + reels resolve — no pulse animation (reads as layout, not “loading”).
 */
export function HomeHeroReelsFallback() {
  return (
    <div
      className="min-h-[min(52vh,560px)] w-full bg-[var(--app-bg)]"
      aria-hidden
    >
      <HomeHeroBannerFallback />
      <HomeReelsRailFallback />
    </div>
  );
}
