'use client';

const STAR_PATH =
  'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';

const SIZE_CLASS = {
  sm: { button: 'h-8 w-8', icon: 'h-6 w-6' },
  md: { button: 'h-10 w-10', icon: 'h-7 w-7' },
} as const;

interface FeaturedStarToggleProps {
  featured: boolean;
  onToggle: () => void;
  markLabel: string;
  removeLabel: string;
  size?: keyof typeof SIZE_CLASS;
}

export function FeaturedStarToggle({
  featured,
  onToggle,
  markLabel,
  removeLabel,
  size = 'md',
}: FeaturedStarToggleProps) {
  const sizeClass = SIZE_CLASS[size];

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-100 transition-all duration-200 hover:scale-105 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-marco-yellow/60 focus:ring-offset-2 ${sizeClass.button}`}
      title={featured ? removeLabel : markLabel}
      aria-label={featured ? removeLabel : markLabel}
      aria-pressed={featured}
    >
      <svg
        className={`${sizeClass.icon} transition-all duration-200 ${
          featured
            ? 'fill-marco-yellow text-marco-yellow drop-shadow-sm'
            : 'fill-none stroke-gray-400 text-gray-400 opacity-50 hover:opacity-75'
        }`}
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
      </svg>
    </button>
  );
}
