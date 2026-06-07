import { normalizeLiteralNewlinesToLineBreaks } from '../../../lib/utils/normalize-literal-newlines';

import {
  isSpecHeadingLine,
  parseRowsFromLabeledStrong,
  parseRowsFromListItems,
  parseRowsFromTable,
  stripTags,
  type SpecificationRow,
} from './product-spec-description-parsing';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Optional `<strong>…բնութագիր…</strong>` heading before spec rows. */
function findSpecificationHeadingStrongIndex(html: string): number {
  const re = /<strong[^>]*>([\s\S]*?)<\/strong>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const inner = stripTags(m[1]).trim().toLowerCase();
    if (
      inner === 'բնութագիր' ||
      inner === 'description' ||
      inner === 'спецификация' ||
      inner === 'характеристика'
    ) {
      return m.index;
    }
  }

  const h1Match = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
  if (h1Match && h1Match.index !== undefined && isSpecHeadingLine(h1Match[0])) {
    return h1Match.index;
  }

  return -1;
}

function findSpecBlockStart(html: string, rows: SpecificationRow[], headingIdx: number): number {
  const candidates: number[] = [];

  if (headingIdx >= 0) {
    candidates.push(extendRemovalStartToBlockOpen(html, headingIdx));
  }

  if (rows.length > 0) {
    const firstKeyIdx = findFirstRowStrongIndex(html, rows[0].key);
    if (firstKeyIdx >= 0) {
      candidates.push(extendRemovalStartToBlockOpen(html, firstKeyIdx));
    }

    const plainKeyIdx = html.indexOf(rows[0].key);
    if (plainKeyIdx >= 0) {
      candidates.push(extendRemovalStartToBlockOpen(html, plainKeyIdx));
    }
  }

  if (candidates.length === 0) {
    return -1;
  }

  return Math.min(...candidates);
}

function findFirstRowStrongIndex(html: string, firstRowKey: string): number {
  const re = new RegExp(`<strong[^>]*>\\s*${escapeRegExp(firstRowKey)}\\s*</strong>`, 'i');
  const m = re.exec(html);
  return m?.index ?? -1;
}

/**
 * If the opening `<strong>` sits right after `<p…>` / `<div…>`, include the tag so we do not leave a broken wrapper.
 */
function extendRemovalStartToBlockOpen(html: string, strongIndex: number): number {
  let best = strongIndex;
  for (const tag of ['<h1', '<h2', '<h3', '<h4', '<h5', '<h6', '<p', '<div'] as const) {
    const open = html.lastIndexOf(tag, strongIndex);
    if (open < 0) continue;
    const between = html.slice(open, strongIndex);
    const ok = new RegExp(`^${tag}[^>]*>\\s*$`, 'i').test(between);
    if (ok) {
      best = Math.min(best, open);
    }
  }
  return best;
}

/** Removes empty wrappers left after cutting a spec block mid-document. */
function trimOrphanedHtmlWrappers(html: string): string {
  return html
    .replace(/<h[1-6][^>]*>\s*<\/h[1-6]>/gi, '')
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/<div[^>]*>\s*<\/div>/gi, '')
    .trim();
}

function stripListSpecificationBlock(html: string): string {
  const rows = parseRowsFromListItems(html);
  const headingIdx = findSpecificationHeadingStrongIndex(html);
  if (rows.length < 2 || headingIdx < 0) {
    return html;
  }

  const removeStart = extendRemovalStartToBlockOpen(html, headingIdx);
  return trimOrphanedHtmlWrappers(html.slice(0, removeStart).replace(/\s+$/u, ''));
}

function stripSpecificationTables(html: string): string {
  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableHtml) => {
    return parseRowsFromTable(tableHtml).length >= 2 ? '' : tableHtml;
  });
}

function stripStrongLabeledSpecificationBlock(html: string): string {
  const rows = parseRowsFromLabeledStrong(html);
  const headingIdx = findSpecificationHeadingStrongIndex(html);
  const hasSpecBlock = rows.length >= 2 || (rows.length >= 1 && headingIdx >= 0);
  if (!hasSpecBlock) {
    return html;
  }

  const removeStart = findSpecBlockStart(html, rows, headingIdx);
  if (removeStart < 0) {
    return html;
  }

  const before = trimOrphanedHtmlWrappers(html.slice(0, removeStart).replace(/\s+$/u, ''));
  return before;
}

/**
 * Removes HTML that is also rendered in {@link ProductSpecifications}, so the PDP description column
 * does not duplicate the spec block beside the gallery.
 */
export function stripDuplicateSpecificationDescriptionHtml(descriptionHtml: string): string {
  const raw = normalizeLiteralNewlinesToLineBreaks(descriptionHtml);
  if (!raw.trim()) {
    return raw;
  }

  const withoutTables = stripSpecificationTables(raw);
  const fromTable = parseRowsFromTable(raw);
  if (fromTable.length >= 2) {
    return withoutTables.replace(/\s+$/u, '');
  }

  const withoutStrongBlock = stripStrongLabeledSpecificationBlock(withoutTables);
  if (withoutStrongBlock !== withoutTables) {
    return trimOrphanedHtmlWrappers(withoutStrongBlock.replace(/\s+$/u, ''));
  }

  const withoutListBlock = stripListSpecificationBlock(withoutTables);
  if (withoutListBlock !== withoutTables) {
    return trimOrphanedHtmlWrappers(withoutListBlock.replace(/\s+$/u, ''));
  }

  return trimOrphanedHtmlWrappers(withoutTables);
}