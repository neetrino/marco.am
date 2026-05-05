import { normalizeLiteralNewlinesToLineBreaks } from '../../../lib/utils/normalize-literal-newlines';

export interface SpecificationRow {
  key: string;
  value: string;
}

export function stripTags(value: string): string {
  return normalizeLiteralNewlinesToLineBreaks(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseRowsFromTable(descriptionHtml: string): SpecificationRow[] {
  const rows = Array.from(descriptionHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
  return rows
    .map((row) => {
      const cells = Array.from(row[1].matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi))
        .map((cell) => stripTags(cell[1]))
        .filter(Boolean);
      if (cells.length < 2) return null;
      return { key: cells[0], value: cells.slice(1).join(' / ') };
    })
    .filter((row): row is SpecificationRow => Boolean(row));
}

export function parseRowsFromLines(descriptionHtml: string): SpecificationRow[] {
  const normalized = descriptionHtml
    .replace(/<\/(p|div|li|h\d|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');
  const lines = normalized
    .split('\n')
    .map((line) => stripTags(line))
    .filter((line) => line.length > 0);

  return lines
    .map((line) => {
      const separator = line.includes(':')
        ? ':'
        : line.includes(' - ')
          ? ' - '
          : line.includes(' — ')
            ? ' — '
            : null;
      if (!separator) return null;
      const [rawKey, ...rest] = line.split(separator);
      const key = rawKey.trim();
      const value = rest.join(separator).trim();
      if (!key || !value) return null;
      return { key, value };
    })
    .filter((row): row is SpecificationRow => Boolean(row));
}

const SPEC_SECTION_TITLE_KEYS = new Set(
  ['բնութագիր', 'description', 'спецификация', 'характеристика'].map((k) => k.toLowerCase()),
);

/** WooCommerce-style `<strong>Label</strong> value` blocks. */
export function parseRowsFromLabeledStrong(descriptionHtml: string): SpecificationRow[] {
  const html = normalizeLiteralNewlinesToLineBreaks(descriptionHtml);
  const segments = html.split(/<strong[^>]*>/i);
  const rows: SpecificationRow[] = [];

  for (const segment of segments) {
    const close = segment.indexOf('</strong>');
    if (close === -1) continue;
    const key = stripTags(segment.slice(0, close)).trim();
    if (!key || SPEC_SECTION_TITLE_KEYS.has(key.toLowerCase())) continue;
    const afterStrong = segment.slice(close + 9);
    const valueChunk = afterStrong.split(/<(?=strong\b)/i)[0];
    const value = stripTags(valueChunk).trim();
    if (!value) continue;
    rows.push({ key, value });
  }

  return rows;
}
