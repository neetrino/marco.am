/** Named entities decoded for plain-text extraction (amp must stay last in the alternation). */
const COMMON_HTML_ENTITY_PATTERN = /&(?:nbsp|quot|#39|amp);/gi;

function replaceCommonHtmlEntity(entity: string): string {
  switch (entity.toLowerCase()) {
    case '&nbsp;':
      return ' ';
    case '&quot;':
      return '"';
    case '&#39;':
      return "'";
    case '&amp;':
      return '&';
    default:
      return entity;
  }
}

/** Decodes a small set of HTML entities in one pass to avoid double-unescaping. */
export function decodeCommonHtmlEntities(text: string): string {
  return text.replace(COMMON_HTML_ENTITY_PATTERN, replaceCommonHtmlEntity);
}
