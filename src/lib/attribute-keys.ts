const COLOR_ATTRIBUTE_KEYS = ['color', 'colour', 'guyn'] as const;
const SIZE_ATTRIBUTE_KEYS = ['size'] as const;

function normalizeAttributeKey(key: string | null | undefined): string {
  return (key || '').trim().toLowerCase();
}

export function isColorAttributeKey(key: string | null | undefined): boolean {
  return COLOR_ATTRIBUTE_KEYS.includes(normalizeAttributeKey(key) as (typeof COLOR_ATTRIBUTE_KEYS)[number]);
}

export function isSizeAttributeKey(key: string | null | undefined): boolean {
  return SIZE_ATTRIBUTE_KEYS.includes(normalizeAttributeKey(key) as (typeof SIZE_ATTRIBUTE_KEYS)[number]);
}

export function findAttributeBySemanticKey<T extends { key?: string | null }>(
  attributes: T[] | null | undefined,
  semantic: 'color' | 'size',
): T | undefined {
  if (!Array.isArray(attributes)) {
    return undefined;
  }

  const matcher = semantic === 'color' ? isColorAttributeKey : isSizeAttributeKey;
  return attributes.find((attribute) => matcher(attribute.key));
}

export function getAttributeBucket(
  attributes: Record<string, unknown> | null | undefined,
  semantic: 'color' | 'size',
): unknown[] {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return [];
  }

  const matcher = semantic === 'color' ? isColorAttributeKey : isSizeAttributeKey;
  for (const [key, value] of Object.entries(attributes)) {
    if (matcher(key)) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
  }

  return [];
}
