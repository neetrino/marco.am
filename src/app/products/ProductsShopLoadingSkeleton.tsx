/**
 * PLP placeholder: explicit slate colors (avoid `var(--app-text)/opacity` — often invisible in Tailwind).
 * Used by Suspense fallback and `loading.tsx` so navigations are never a blank white main.
 */
export function ProductsShopLoadingSkeleton() {
  const bar = 'rounded-md bg-slate-200 animate-pulse dark:bg-slate-600';
  const block = 'rounded-lg bg-slate-200 animate-pulse dark:bg-slate-600';
  const card = 'h-[260px] w-full max-w-[286px] rounded-lg bg-slate-200 animate-pulse sm:h-[280px] dark:bg-slate-600';

  return (
    <div
      className="w-full max-w-full min-h-[min(72vh,820px)] bg-[var(--app-bg)] pb-4 md:min-h-[min(68vh,760px)] md:pb-32 lg:pb-40"
      aria-busy="true"
      aria-label="Loading shop"
    >
      <div className="marco-header-container border-b border-slate-200/80 pb-3 pt-[58px] dark:border-white/10 sm:pb-4">
        <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div className={`h-9 w-52 max-w-[72%] sm:h-10 ${bar}`} />
          <div className="flex gap-3">
            <div className={`h-9 w-28 rounded-lg ${block}`} />
            <div className={`h-9 w-40 rounded-lg ${block}`} />
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-4 sm:hidden">
          <div className={`h-8 w-44 ${bar}`} />
          <div className={`h-11 w-full rounded-lg ${block}`} />
        </div>
      </div>

      <div className="marco-header-container flex flex-col min-[744px]:flex-row min-[744px]:gap-5 xl:gap-8">
        <aside className="hidden w-[16rem] shrink-0 min-[744px]:block xl:w-[20rem]" aria-hidden>
          <div className="space-y-3 border-r border-slate-200/90 pb-4 pt-4 dark:border-white/15 min-[744px]:pr-3 xl:space-y-4 xl:pb-6 xl:pt-6 xl:pr-6">
            <div className={`h-5 w-28 ${bar}`} />
            <div className={`h-4 w-40 ${bar}`} />
            <div className={`h-32 w-full ${block}`} />
            <div className={`h-24 w-full ${block}`} />
            <div className={`h-20 w-full ${block}`} />
          </div>
        </aside>

        <div className="min-h-[48vh] min-w-0 flex-1 overflow-x-hidden bg-slate-50/80 pt-4 pb-6 min-[744px]:min-h-[52vh] min-[744px]:w-auto min-[744px]:bg-transparent min-[744px]:py-4 dark:bg-slate-950/40 min-[744px]:dark:bg-transparent">
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-12">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="flex min-w-0 justify-end pr-2 sm:pr-3 md:pr-4">
                <div className={card} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
