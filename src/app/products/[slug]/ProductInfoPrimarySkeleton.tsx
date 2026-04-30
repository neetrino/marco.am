'use client';

/**
 * Fixed-height placeholders matching the primary PDP info column rhythm (no fake prices/titles).
 */
export function ProductInfoPrimarySkeleton() {
  const bar = 'rounded-md bg-gray-200/80 dark:bg-white/10';
  return (
    <div className="min-w-0 space-y-6" aria-busy="true" aria-label="Loading product details">
      <div className="space-y-3">
        <div className={`h-4 w-28 ${bar}`} />
        <div className={`h-9 w-full max-w-md ${bar}`} />
        <div className={`h-9 w-[66%] max-w-sm ${bar}`} />
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        <div className={`h-10 w-36 ${bar}`} />
        <div className={`h-6 w-24 ${bar}`} />
      </div>
      <div className={`h-4 w-40 ${bar}`} />
      <div className="flex gap-2">
        <div className={`h-11 flex-1 max-w-[200px] rounded-lg ${bar}`} />
        <div className={`h-11 w-11 shrink-0 rounded-lg ${bar}`} />
        <div className={`h-11 w-11 shrink-0 rounded-lg ${bar}`} />
      </div>
      <div className="space-y-3 pt-2">
        <div className={`h-12 w-full ${bar}`} />
        <div className={`h-12 w-full ${bar}`} />
      </div>
    </div>
  );
}
