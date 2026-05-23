const COMMA_LIST_SPLIT = /,\s*/;
const SPEC_FOOTNOTE_SPLIT = /\s+\*\s+/;

export interface SpecificationValueFootnote {
  main: string;
  footnote: string | null;
}

/** Splits `value * footnote` (common in WooCommerce spec tables) for stacked display. */
export function splitSpecificationFootnote(value: string): SpecificationValueFootnote {
  const trimmed = value.trim();
  const match = SPEC_FOOTNOTE_SPLIT.exec(trimmed);
  if (!match || match.index === undefined) {
    return { main: trimmed, footnote: null };
  }
  const main = trimmed.slice(0, match.index).trim();
  const footnote = trimmed.slice(match.index + match[0].length).trim();
  if (!main || !footnote) {
    return { main: trimmed, footnote: null };
  }
  return { main, footnote };
}

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
