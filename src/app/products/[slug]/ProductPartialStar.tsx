'use client';

/** Hero-style solid star path (viewBox 0 0 20 20) — reliable fill + clip for partial ratings. */
const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

interface ProductPartialStarProps {
  /** Portion of the star filled, 0–1 (e.g. 3.5 / 5 → 0.7). */
  fillRatio: number;
  className?: string;
}

export function ProductPartialStar({ fillRatio, className }: ProductPartialStarProps) {
  const clamped = Math.min(1, Math.max(0, fillRatio));
  const widthPct = `${clamped * 100}%`;

  return (
    <span
      className={`relative inline-block h-4 w-4 shrink-0 ${className ?? ''}`}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-4 w-4 text-gray-200 dark:text-gray-600"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d={STAR_PATH} />
      </svg>
      <span className="absolute left-0 top-0 h-4 overflow-hidden" style={{ width: widthPct }}>
        <svg
          className="absolute left-0 top-0 h-4 w-4 text-yellow-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}
