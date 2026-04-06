import Link from 'next/link';

/**
 * MARCO GROUP wordmark + mark — Figma-aligned when raster logo is not available.
 */
export function MarcoLogo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-3 group"
      aria-label="MARCO GROUP Home"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-marco-black bg-white shadow-sm transition-transform group-hover:scale-[1.02]">
        <span className="text-center text-[10px] font-bold leading-none tracking-tight text-marco-black">
          <span className="block text-marco-yellow">M</span>
          <span className="block -mt-0.5">G</span>
        </span>
      </div>
      <div className="hidden flex-col sm:flex">
        <span className="font-serif text-lg font-semibold leading-tight tracking-wide text-marco-yellow">
          MARCO
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-marco-black">Group</span>
      </div>
    </Link>
  );
}
