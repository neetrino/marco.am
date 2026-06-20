'use client';

interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Tailwind grid-cols-* class for the option layout. */
  columnsClass?: string;
  size?: 'default' | 'compact';
}

/**
 * Pill-style segmented control — shared by product class and warranty on the General tab.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  columnsClass = 'grid-cols-2',
  size = 'default',
}: SegmentedControlProps<T>) {
  const isCompact = size === 'compact';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`grid gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 ${
        isCompact ? 'p-0.5' : 'p-1'
      } ${columnsClass}`}
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.id)}
            className={`min-w-0 rounded-md text-center font-medium transition-colors ${
              isCompact ? 'px-2 py-1.5 text-xs' : 'rounded-lg px-3 py-2.5 text-sm font-semibold'
            } ${
              isActive
                ? 'bg-marco-yellow text-marco-black shadow-sm ring-1 ring-marco-yellow/70'
                : 'text-slate-600 hover:bg-white/90 hover:text-slate-900'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
