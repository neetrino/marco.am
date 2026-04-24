const COMMA_LIST_SPLIT = /,\s*/;

export function splitSpecificationValueParts(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return [];
  }
  const parts = trimmed.split(COMMA_LIST_SPLIT).map((p) => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(part);
  }
  return unique;
}
