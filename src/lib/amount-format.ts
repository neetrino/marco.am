const INTEGER_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type AmountFormatOptions = {
  allowDecimals?: boolean;
};

/** Localized digits only (no currency code/symbol) — grouping for display. */
export function formatAmountDigits(value: number): string {
  return INTEGER_FORMATTER.format(value);
}

/** Strip grouping separators; keep digits and optionally one decimal point. */
export function parseAmountInput(raw: string, options?: AmountFormatOptions): string {
  const allowDecimals = options?.allowDecimals ?? false;
  const stripped = raw.replace(/,/g, '');

  if (allowDecimals) {
    const match = stripped.match(/^\d*\.?\d*/);
    return match?.[0] ?? '';
  }

  return stripped.replace(/\D/g, '');
}

/** Format a raw amount string or number for input display (e.g. 1662500 → 1,662,500). */
export function formatAmountInput(
  value: string | number,
  options?: AmountFormatOptions,
): string {
  const allowDecimals = options?.allowDecimals ?? false;

  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const raw =
    typeof value === 'number'
      ? Number.isFinite(value)
        ? String(value)
        : ''
      : value;

  if (raw === '') {
    return '';
  }

  if (allowDecimals) {
    const cleaned = parseAmountInput(raw, { allowDecimals: true });
    if (cleaned === '' || cleaned === '.') {
      return cleaned;
    }

    const endsWithDot = cleaned.endsWith('.');
    const [intPart = '', decPart] = cleaned.split('.');
    const intNum = intPart === '' ? 0 : parseInt(intPart, 10);
    const formattedInt = Number.isNaN(intNum)
      ? intPart
      : INTEGER_FORMATTER.format(intNum);

    if (decPart !== undefined) {
      return endsWithDot && decPart === '' ? `${formattedInt}.` : `${formattedInt}.${decPart}`;
    }

    return formattedInt;
  }

  const cleaned = parseAmountInput(raw, { allowDecimals: false });
  if (cleaned === '') {
    return '';
  }

  const num = parseInt(cleaned, 10);
  if (Number.isNaN(num)) {
    return cleaned;
  }

  return INTEGER_FORMATTER.format(num);
}
