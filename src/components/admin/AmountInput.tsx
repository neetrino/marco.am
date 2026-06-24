'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from '@shop/ui';
import { formatAmountInput, parseAmountInput } from '@/lib/amount-format';

interface AmountInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'inputMode'> {
  value: string;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(function AmountInput(
  { value, onChange, allowDecimals = false, className, ...props },
  ref,
) {
  const displayValue = formatAmountInput(value, { allowDecimals });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseAmountInput(event.target.value, { allowDecimals }));
  };

  return (
    <Input
      ref={ref}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
});
