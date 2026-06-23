import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'a', 'ul', 'ol', 'li'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    span: ['style'],
    p: ['style'],
  },
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/],
    },
  },
};

/** Strips unsafe HTML; allowlist matches the admin TipTap toolbar. */
export function sanitizeProductSubtitleHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) {
    return '';
  }

  return sanitizeHtml(trimmed, SANITIZE_OPTIONS).trim();
}

function visiblePlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
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

  return visiblePlainText(sanitized).length === 0;
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
