import { normalizeLiteralNewlinesToLineBreaks } from '../../../lib/utils/normalize-literal-newlines';

import {
  parseRowsFromLabeledStrong,
  parseRowsFromTable,
  stripTags,
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
  return -1;
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
  for (const tag of ['<p', '<div'] as const) {
    const open = html.lastIndexOf(tag, strongIndex);
    if (open < 0) continue;
    const between = html.slice(open, strongIndex);
    const ok =
      tag === '<p'
        ? /^<p[^>]*>\s*$/i.test(between)
        : /^<div[^>]*>\s*$/i.test(between);
    if (ok) {
      best = Math.min(best, open);
    }
  }
  return best;
}

function stripSpecificationTables(html: string): string {
  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableHtml) => {
    return parseRowsFromTable(tableHtml).length >= 2 ? '' : tableHtml;
  });
}

function stripStrongLabeledSpecificationBlock(html: string): string {
  const rows = parseRowsFromLabeledStrong(html);
  if (rows.length < 2) {
    return html;
  }
  const headingIdx = findSpecificationHeadingStrongIndex(html);
  const firstKeyIdx = findFirstRowStrongIndex(html, rows[0].key);
  let blockStart = -1;
  if (headingIdx >= 0 && firstKeyIdx >= 0) {
    blockStart = Math.min(headingIdx, firstKeyIdx);
  } else {
    blockStart = headingIdx >= 0 ? headingIdx : firstKeyIdx;
  }
  if (blockStart < 0) {
    return html;
  }
  const removeStart = extendRemovalStartToBlockOpen(html, blockStart);
  const before = html.slice(0, removeStart).replace(/\s+$/u, '');
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
    return withoutStrongBlock.replace(/\s+$/u, '');
  }

  return withoutTables;
}
