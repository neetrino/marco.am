import type { Attribute } from './useAttributes';

/**
 * Client-side filter for the admin attributes list: matches name, key, type,
 * and value labels / stored values / color hex tokens.
 */
export function filterAttributesBySearch(attributes: Attribute[], rawSearch: string): Attribute[] {
  const raw = rawSearch.trim().toLowerCase();
  if (!raw) {
    return attributes;
  }
  const tokens = raw.split(/\s+/).filter(Boolean);
  return attributes.filter((attr) => {
    const valueBits = attr.values
      .flatMap((v) => [v.label, v.value, ...(v.colors ?? [])])
      .join(' ');
    const haystack = `${attr.name} ${attr.key} ${attr.type} ${valueBits}`.toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}
