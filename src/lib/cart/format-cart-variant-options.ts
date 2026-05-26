export interface CartVariantOption {
  attributeKey: string;
  attributeName: string;
  value: string;
}

type DbVariantOption = {
  attributeKey: string | null;
  value: string | null;
  attributeValue: {
    value: string;
    translations: Array<{ locale: string; label: string }>;
    attribute: {
      key: string;
      translations: Array<{ locale: string; name: string }>;
    };
  } | null;
};

type ApiVariantOption = {
  attribute?: string;
  key?: string;
  value?: string;
};

const normalizeComparable = (value: string): string => value.trim().toLowerCase();

/**
 * Maps a cart variant option from the database into a display-ready shape.
 */
export function formatCartVariantOptionFromDb(
  opt: DbVariantOption,
  locale: string
): CartVariantOption | null {
  if (opt.attributeValue) {
    const attributeValue = opt.attributeValue;
    const attributeTranslation =
      attributeValue.attribute.translations.find((entry) => entry.locale === locale) ??
      attributeValue.attribute.translations[0];
    const valueTranslation =
      attributeValue.translations.find((entry) => entry.locale === locale) ??
      attributeValue.translations[0];
    const attributeKey = attributeValue.attribute.key || opt.attributeKey || '';
    const value = valueTranslation?.label || attributeValue.value || opt.value || '';

    if (!attributeKey || !value) {
      return null;
    }

    return {
      attributeKey,
      attributeName: attributeTranslation?.name || attributeKey,
      value,
    };
  }

  const attributeKey = opt.attributeKey || '';
  const value = opt.value || '';

  if (!attributeKey || !value) {
    return null;
  }

  return {
    attributeKey,
    attributeName: attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1),
    value,
  };
}

/**
 * Maps a cart variant option from the public product API into a display-ready shape.
 */
export function formatCartVariantOptionFromApi(opt: ApiVariantOption): CartVariantOption | null {
  const attributeKey = (opt.key || opt.attribute || '').trim();
  const value = (opt.value || '').trim();

  if (!attributeKey || !value) {
    return null;
  }

  return {
    attributeKey,
    attributeName: attributeKey.charAt(0).toUpperCase() + attributeKey.slice(1),
    value,
  };
}

/**
 * Keeps one line per attribute and skips values already shown in the product title.
 */
export function dedupeCartVariantOptions(
  options: CartVariantOption[],
  productTitle: string
): CartVariantOption[] {
  const seenKeys = new Set<string>();
  const normalizedTitle = normalizeComparable(productTitle);
  const uniqueOptions: CartVariantOption[] = [];

  for (const option of options) {
    const attributeKey = option.attributeKey.toLowerCase();
    const normalizedValue = normalizeComparable(option.value);

    if (!option.value || seenKeys.has(attributeKey) || normalizedValue === normalizedTitle) {
      continue;
    }

    seenKeys.add(attributeKey);
    uniqueOptions.push(option);
  }

  return uniqueOptions;
}

/** Shows SKU only when it adds information beyond the title and variant options. */
export function shouldShowCartSku(
  sku: string,
  productTitle: string,
  options: CartVariantOption[]
): boolean {
  const normalizedSku = normalizeComparable(sku);

  if (!normalizedSku) {
    return false;
  }

  if (normalizedSku === normalizeComparable(productTitle)) {
    return false;
  }

  return !options.some((option) => normalizeComparable(option.value) === normalizedSku);
}
