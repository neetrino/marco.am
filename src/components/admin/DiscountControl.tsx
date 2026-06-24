'use client';

import { Input } from '@shop/ui';
import { DiscountExpiresPicker } from './DiscountExpiresPicker';
import type { DiscountKind } from '@/lib/discount/discount-expiry';
import { formatAmountInput, parseAmountInput } from '@/lib/amount-format';

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
  /** Compact inline layout: select + input group → date (product editor). */
  compact?: boolean;
  disabled?: boolean;
  className?: string;
};

const PERCENT_MAX = 100;
const COMPACT_INPUT_WIDTH = 'w-[148px] shrink-0 sm:w-[168px]';
const COMPACT_DISCOUNT_GROUP =
  'flex h-9 overflow-hidden rounded-md border border-amber-300 bg-amber-50 shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200/80';
const COMPACT_DISCOUNT_KIND =
  'flex h-full w-10 shrink-0 items-center justify-center border-0 border-r border-amber-200 bg-amber-100 text-center text-xs font-semibold text-amber-900 outline-none';
const COMPACT_DISCOUNT_INPUT =
  'h-full min-w-0 flex-1 border-0 bg-amber-50 px-2 text-sm text-amber-950 outline-none placeholder:text-amber-400/80 focus:ring-0';

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
  compact = false,
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

  const handleAmountValueChange = (raw: string) => {
    const parsed = raw === '' ? null : parseFloat(raw);
    onChange(normalize('AMOUNT', parsed, value.expiresAt));
  };

  const amountDisplayValue =
    value.value === null || value.value === undefined
      ? ''
      : formatAmountInput(value.value);

  const handleExpiresChange = (expiresAt: string | null) => {
    onChange({ ...value, expiresAt });
  };

  if (compact) {
    return (
      <div className={`flex flex-nowrap items-center gap-1.5 ${className ?? ''}`}>
        <div className={`${COMPACT_DISCOUNT_GROUP} ${COMPACT_INPUT_WIDTH}`}>
          {allowAmount ? (
            <select
              value={activeKind}
              disabled={disabled}
              aria-label="Discount type"
              onChange={(event) =>
                handleKindChange(event.target.value as 'PERCENT' | 'AMOUNT')
              }
              className={`${COMPACT_DISCOUNT_KIND} cursor-pointer`}
            >
              <option value="PERCENT">%</option>
              <option value="AMOUNT">{currencySymbol}</option>
            </select>
          ) : (
            <span className={COMPACT_DISCOUNT_KIND}>%</span>
          )}
          <input
            type={isPercent ? 'number' : 'text'}
            inputMode={isPercent ? 'decimal' : 'numeric'}
            min={isPercent ? '0' : undefined}
            max={isPercent ? PERCENT_MAX : undefined}
            step={isPercent ? '0.1' : undefined}
            value={isPercent ? (value.value ?? '') : amountDisplayValue}
            disabled={disabled}
            placeholder="0"
            onChange={(event) =>
              isPercent
                ? handleValueChange(event.target.value)
                : handleAmountValueChange(parseAmountInput(event.target.value))
            }
            className={COMPACT_DISCOUNT_INPUT}
          />
        </div>
        {showExpires ? (
          <DiscountExpiresPicker
            value={value.expiresAt}
            onChange={handleExpiresChange}
            disabled={disabled}
            compact
          />
        ) : null}
      </div>
    );
  }

  const unitSuffix = isPercent ? '%' : currencySymbol;
  const toggleButtonClass = (active: boolean) =>
    `px-3 py-1.5 text-sm font-semibold transition-colors ${
      active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
    }`;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      {allowAmount ? (
        <div className="inline-flex shrink-0 overflow-hidden rounded-lg border border-slate-300">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleKindChange('PERCENT')}
            className={toggleButtonClass(isPercent)}
          >
            %
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleKindChange('AMOUNT')}
            className={toggleButtonClass(!isPercent)}
          >
            {currencySymbol}
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-1.5">
        {isPercent ? (
          <Input
            type="number"
            min="0"
            max={PERCENT_MAX}
            step="0.1"
            value={value.value ?? ''}
            disabled={disabled}
            onChange={(event) => handleValueChange(event.target.value)}
            className="w-28 border-slate-300 bg-white"
            placeholder="0"
          />
        ) : (
          <Input
            type="text"
            inputMode="numeric"
            value={amountDisplayValue}
            disabled={disabled}
            onChange={(event) =>
              handleAmountValueChange(parseAmountInput(event.target.value))
            }
            className="w-28 border-slate-300 bg-white"
            placeholder="0"
          />
        )}
        <span className="shrink-0 text-sm text-gray-500">{unitSuffix}</span>
      </div>
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
