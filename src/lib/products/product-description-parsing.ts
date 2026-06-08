import { normalizeLiteralNewlinesToLineBreaks } from '../utils/normalize-literal-newlines';

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

export function parseRowsFromListItems(descriptionHtml: string): SpecificationRow[] {
  const html = normalizeLiteralNewlinesToLineBreaks(descriptionHtml);
  const rows: SpecificationRow[] = [];

  for (const match of html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const text = stripTags(match[1]).trim();
    if (!text) continue;

    const separator = text.match(/[:՝]/);
    if (separator && separator.index !== undefined && separator.index > 0) {
      rows.push({
        key: text.slice(0, separator.index).trim(),
        value: text.slice(separator.index + 1).trim(),
      });
      continue;
    }

    rows.push({ key: '•', value: text });
  }

  return rows;
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

function expandDescriptionLines(html: string): string[] {
  const withBreaks = html
    .replace(/<\/p>\s*<p/gi, '\n<p')
    .replace(/<\/h[1-6]>/gi, '$&\n')
    .replace(/<br\s*\/?>/gi, '\n');

  return withBreaks
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function isSpecHeadingLine(line: string): boolean {
  const joinedStrongText = Array.from(line.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/gi))
    .map((match) => stripTags(match[1]).trim())
    .join('');
  return SPEC_SECTION_TITLE_KEYS.has(joinedStrongText.toLowerCase());
}

function parseLineToRow(line: string): SpecificationRow | null {
  if (isSpecHeadingLine(line)) {
    return null;
  }

  const labelFirst = line.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
  if (labelFirst && labelFirst.index !== undefined) {
    const prefix = line.slice(0, labelFirst.index);
    if (!prefix.includes('<strong')) {
      const key = stripTags(labelFirst[1]).trim();
      const value = stripTags(line.slice(labelFirst.index + labelFirst[0].length)).trim();
      if (key && value && !SPEC_SECTION_TITLE_KEYS.has(key.toLowerCase())) {
        return { key, value };
      }
    }
  }

  const valueLast = line.match(/^([\s\S]*?)<strong[^>]*>([\s\S]*?)<\/strong>\s*$/i);
  if (!valueLast) {
    return null;
  }

  const key = stripTags(valueLast[1]).trim();
  const value = stripTags(valueLast[2]).trim();
  if (!key || !value || SPEC_SECTION_TITLE_KEYS.has(key.toLowerCase())) {
    return null;
  }

  return { key, value };
}

/** WooCommerce-style `<strong>Label</strong> value` blocks. */
export function parseRowsFromLabeledStrong(descriptionHtml: string): SpecificationRow[] {
  const html = normalizeLiteralNewlinesToLineBreaks(descriptionHtml);
  const rows: SpecificationRow[] = [];

  for (const line of expandDescriptionLines(html)) {
    const row = parseLineToRow(line);
    if (row) {
      rows.push(row);
    }
  }

  return rows;
}
