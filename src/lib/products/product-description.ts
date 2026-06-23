import type { Prisma } from '@white-shop/db/prisma';
import { normalizeLiteralNewlinesToLineBreaks } from '../utils/normalize-literal-newlines';
import {
  parseRowsFromLabeledStrong,
  parseRowsFromLines,
  parseRowsFromListItems,
  parseRowsFromTable,
  stripTags,
  type SpecificationRow,
} from './product-description-parsing';

/** Structured product description row stored in the database. */
export interface ProductDescriptionEntry {
  title: string;
  value: string;
}

function dedupeEntries(entries: ProductDescriptionEntry[]): ProductDescriptionEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.title.toLowerCase()}::${entry.value.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function rowsToEntries(rows: SpecificationRow[]): ProductDescriptionEntry[] {
  return rows.map((row) => ({ title: row.key, value: row.value }));
}

function extractFootnotes(html: string): ProductDescriptionEntry[] {
  const footnotes: ProductDescriptionEntry[] = [];
  const spanFootnote = html.match(/<span[^>]*>[\s\S]*?\*[\s\S]*?<\/span>[^<\n]*/i);
  if (spanFootnote) {
    const text = stripTags(spanFootnote[0]).trim();
    if (text) {
      footnotes.push({ title: '', value: text });
    }
  }
  return footnotes;
}

function parseSpecRowsFromHtml(html: string): SpecificationRow[] {
  const raw = normalizeLiteralNewlinesToLineBreaks(html);

  const fromTable = parseRowsFromTable(raw);
  if (fromTable.length > 0) {
    return fromTable;
  }

  const fromStrong = parseRowsFromLabeledStrong(raw);
  if (fromStrong.length >= 2) {
    return fromStrong;
  }

  const fromListItems = parseRowsFromListItems(raw);
  if (fromListItems.length >= 2) {
    return fromListItems;
  }

  const fromLines = parseRowsFromLines(raw);
  if (fromLines.length > 0) {
    return fromLines;
  }

  if (fromStrong.length > 0) {
    return fromStrong;
  }

  if (fromListItems.length > 0) {
    return fromListItems;
  }

  return [];
}

/** Converts legacy HTML description into structured title/value entries. */
export function parseDescriptionHtmlToEntries(descriptionHtml: string): ProductDescriptionEntry[] {
  const raw = normalizeLiteralNewlinesToLineBreaks(descriptionHtml);
  if (!raw.trim()) {
    return [];
  }

  const specRows = parseSpecRowsFromHtml(raw);
  if (specRows.length > 0) {
    return dedupeEntries([...rowsToEntries(specRows), ...extractFootnotes(raw)]);
  }

  const plain = stripTags(raw);
  if (!plain) {
    return [];
  }

  return [{ title: '', value: plain }];
}

/** Validates JSON from Prisma and normalizes whitespace. */
export function parseProductDescriptionJson(value: unknown): ProductDescriptionEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is ProductDescriptionEntry => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      const record = item as Record<string, unknown>;
      return typeof record.title === 'string' && typeof record.value === 'string';
    })
    .map((item) => ({
      title: item.title.trim(),
      value: item.value.trim(),
    }))
    .filter((item) => item.title.length > 0 || item.value.length > 0);
}

/** Returns note-only rows (empty title) for optional PDP display. */
export function getProductDescriptionNotes(entries: ProductDescriptionEntry[]): ProductDescriptionEntry[] {
  return entries.filter((entry) => !entry.title.trim() && entry.value.trim());
}

/** Returns spec rows (non-empty title) for the specifications table. */
export function getProductDescriptionSpecs(entries: ProductDescriptionEntry[]): ProductDescriptionEntry[] {
  return entries.filter((entry) => entry.title.trim().length > 0);
}

/** Keeps only specification rows; drops legacy note rows (empty title). */
export function filterProductDescriptionForSave(entries: ProductDescriptionEntry[]): ProductDescriptionEntry[] {
  return getProductDescriptionSpecs(entries).filter(
    (entry) => entry.title.trim().length > 0 && entry.value.trim().length > 0,
  );
}

/** Prisma JSON column payload for create/update. */
export function toPrismaProductDescription(
  entries: ProductDescriptionEntry[],
): Prisma.InputJsonValue {
  return entries as unknown as Prisma.InputJsonValue;
}

/** Plain-text summary for SEO meta description. */
export function formatProductDescriptionForSeo(entries: ProductDescriptionEntry[]): string | null {
  const parts = entries
    .map((entry) => {
      if (entry.title.trim() && entry.value.trim()) {
        return `${entry.title}: ${entry.value}`;
      }
      return entry.value.trim() || entry.title.trim();
    })
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  return parts.join('. ');
}
