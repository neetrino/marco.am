import DOMPurify from 'isomorphic-dompurify';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'a', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
  ALLOW_DATA_ATTR: false,
};

/** Strips unsafe HTML; allowlist matches the admin TipTap toolbar. */
export function sanitizeProductSubtitleHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return '';
  }

  return DOMPurify.sanitize(trimmed, PURIFY_CONFIG).trim();
}

/** True when sanitized HTML has no visible text content. */
export function isProductSubtitleHtmlEmpty(html: string | null | undefined): boolean {
  if (!html?.trim()) {
    return true;
  }

  const sanitized = sanitizeProductSubtitleHtml(html);
  if (!sanitized) {
    return true;
  }

  const plain = sanitized
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  return plain.length === 0;
}

/** Wraps legacy plain-text subtitles for the HTML editor. */
export function normalizeProductSubtitleForEditor(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return '';
  }

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return sanitizeProductSubtitleHtml(trimmed);
  }

  return `<p>${trimmed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
}
