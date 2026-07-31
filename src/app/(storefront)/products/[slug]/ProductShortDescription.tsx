'use client';

import {
  isProductSubtitleHtmlEmpty,
  sanitizeProductSubtitleHtml,
} from '@/lib/security/sanitize-product-html';

interface ProductShortDescriptionProps {
  html: string | null | undefined;
  className?: string;
}

/** Renders sanitized subtitle HTML under the PDP price block. */
export function ProductShortDescription({ html, className = '' }: ProductShortDescriptionProps) {
  if (isProductSubtitleHtmlEmpty(html)) {
    return null;
  }

  const sanitized = sanitizeProductSubtitleHtml(html ?? '');

  return (
    <div
      className={`product-subtitle-html text-sm text-gray-600 [&_a]:text-marco-black [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
