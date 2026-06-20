type ListingVariantOption = {
  key?: string | null;
  attribute?: string | null;
  value?: string | null;
  attributeValue?: {
    value?: string | null;
    attribute?: { key?: string | null } | null;
    translations?: Array<{ label?: string | null }> | null;
  } | null;
};

type ListingVariantForSelection = {
  stock?: number | null;
  options?: ListingVariantOption[] | null;
  attributes?: unknown;
};

function normalizeAttributeValue(value: string): string {
  return value.trim().toLowerCase();
}

function parseOptionAttribute(
  option: ListingVariantOption,
): { key: string; value: string } | null {
  if (option.attributeValue) {
    const key = option.attributeValue.attribute?.key?.trim().toLowerCase();
    if (!key) {
      return null;
    }
    const translation = option.attributeValue.translations?.[0];
    const rawValue = translation?.label || option.attributeValue.value || '';
    if (!rawValue.trim()) {
      return null;
    }
    return { key, value: normalizeAttributeValue(rawValue) };
  }

  const key = (option.key || option.attribute || '').trim().toLowerCase();
  const rawValue = (option.value || '').trim();
  if (!key || !rawValue) {
    return null;
  }
  return { key, value: normalizeAttributeValue(rawValue) };
}

function collectJsonAttributeValues(
  attributes: Record<string, unknown>,
  attributeValues: Map<string, Set<string>>,
): void {
  for (const [rawKey, rawValue] of Object.entries(attributes)) {
    const key = rawKey.trim().toLowerCase();
    if (!key) {
      continue;
    }

    const entries = Array.isArray(rawValue) ? rawValue : rawValue != null ? [rawValue] : [];
    for (const entry of entries) {
      let valueText = '';
      if (typeof entry === 'string') {
        valueText = entry;
      } else if (entry && typeof entry === 'object' && 'value' in entry) {
        valueText = String((entry as { value?: unknown }).value ?? '');
      }

      if (!valueText.trim()) {
        continue;
      }

      if (!attributeValues.has(key)) {
        attributeValues.set(key, new Set());
      }
      attributeValues.get(key)!.add(normalizeAttributeValue(valueText));
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * True when the product exposes more than one selectable attribute value (e.g. multiple colors).
 * Matches PLP swatches: if the card shows attribute choices, cart should open PDP first.
 */
export function productRequiresAttributeSelection(
  variants: ListingVariantForSelection[],
): boolean {
  if (!Array.isArray(variants) || variants.length === 0) {
    return false;
  }

  const attributeValues = new Map<string, Set<string>>();

  for (const variant of variants) {
    const options = Array.isArray(variant.options) ? variant.options : [];

    for (const option of options) {
      const parsed = parseOptionAttribute(option);
      if (!parsed) {
        continue;
      }
      if (!attributeValues.has(parsed.key)) {
        attributeValues.set(parsed.key, new Set());
      }
      attributeValues.get(parsed.key)!.add(parsed.value);
    }

    if (options.length === 0 && isRecord(variant.attributes)) {
      collectJsonAttributeValues(variant.attributes, attributeValues);
    }
  }

  for (const values of attributeValues.values()) {
    if (values.size > 1) {
      return true;
    }
  }

  return false;
}

export function resolveRequiresAttributeSelection(input: {
  requiresAttributeSelection?: boolean | null;
  colors?: Array<{ value: string }> | null;
}): boolean {
  if (input.requiresAttributeSelection === true) {
    return true;
  }
  if (input.requiresAttributeSelection === false) {
    return false;
  }
  return (input.colors?.length ?? 0) > 1;
}
