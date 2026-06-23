'use client';

import { Input } from '@shop/ui';
import { DiscountExpiresPicker } from './DiscountExpiresPicker';
import type { DiscountKind } from '@/lib/discount/discount-expiry';

export type DiscountControlValue = {
  type: DiscountKind;
  /** Percent (PERCENT) or final sale price (AMOUNT). Null/0 means no discount. */
  value: number | null;
  expiresAt: string | null;
};

type DiscountControlProps = {
  value: DiscountControlValue;
  onChange: (next: DiscountControlValue) => void;
  /** Allow the AMOUNT (fixed sale price) mode. When false, percent only (no toggle). */
  allowAmount?: boolean;
  /** Show the expiry date picker. */
  showExpires?: boolean;
  /** Currency symbol shown for the AMOUNT mode toggle. */
  currencySymbol?: string;
  disabled?: boolean;
  className?: string;
};

const PERCENT_MAX = 100;

function normalize(
  kind: Exclude<DiscountKind, 'NONE'>,
  rawValue: number | null,
  expiresAt: string | null,
): DiscountControlValue {
  if (rawValue === null || Number.isNaN(rawValue) || rawValue <= 0) {
    return { type: 'NONE', value: null, expiresAt };
  }
  return { type: kind, value: rawValue, expiresAt };
}

export function DiscountControl({
  value,
  onChange,
  allowAmount = true,
  showExpires = true,
  currencySymbol = '֏',
  disabled,
  className,
}: DiscountControlProps) {
  const activeKind: Exclude<DiscountKind, 'NONE'> =
    value.type === 'AMOUNT' ? 'AMOUNT' : 'PERCENT';
  const isPercent = activeKind === 'PERCENT';

  const handleKindChange = (kind: Exclude<DiscountKind, 'NONE'>) => {
    if (kind === activeKind) {
      return;
    }
    onChange(normalize(kind, value.value, value.expiresAt));
  };

  const handleValueChange = (raw: string) => {
    const parsed = raw === '' ? null : parseFloat(raw);
    onChange(normalize(activeKind, parsed, value.expiresAt));
  };

  const handleExpiresChange = (expiresAt: string | null) => {
    onChange({ ...value, expiresAt });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      {allowAmount ? (
        <div className="inline-flex overflow-hidden rounded-lg border border-slate-300">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleKindChange('PERCENT')}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
              isPercent ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            %
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleKindChange('AMOUNT')}
            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${
              !isPercent ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {currencySymbol}
          </button>
        </div>
      ) : null}
      <Input
        type="number"
        min="0"
        max={isPercent ? PERCENT_MAX : undefined}
        step={isPercent ? '0.1' : '1'}
        value={value.value ?? ''}
        disabled={disabled}
        onChange={(event) => handleValueChange(event.target.value)}
        className="w-28 border-slate-300 bg-white"
        placeholder="0"
      />
      {!allowAmount ? <span className="text-sm font-semibold text-slate-700">%</span> : null}
      {showExpires ? (
        <DiscountExpiresPicker
          value={value.expiresAt}
          onChange={handleExpiresChange}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
