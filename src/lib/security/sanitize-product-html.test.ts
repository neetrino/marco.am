import { describe, expect, it } from 'vitest';
import {
  isProductSubtitleHtmlEmpty,
  normalizeProductSubtitleForEditor,
  sanitizeProductSubtitleHtml,
} from './sanitize-product-html';

describe('sanitizeProductSubtitleHtml', () => {
  it('allows basic formatting tags', () => {
    const input = '<p><strong>Bold</strong> <span style="color:#ff0000">red</span></p>';
    expect(sanitizeProductSubtitleHtml(input)).toContain('<strong>Bold</strong>');
  });

  it('removes script tags', () => {
    expect(sanitizeProductSubtitleHtml('<p>Hi<script>alert(1)</script></p>')).not.toContain('script');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeProductSubtitleHtml('   ')).toBe('');
  });
});

describe('isProductSubtitleHtmlEmpty', () => {
  it('treats empty paragraph as empty', () => {
    expect(isProductSubtitleHtmlEmpty('<p></p>')).toBe(true);
  });

  it('detects visible text', () => {
    expect(isProductSubtitleHtmlEmpty('<p>* Note</p>')).toBe(false);
  });
});

describe('normalizeProductSubtitleForEditor', () => {
  it('wraps plain text in a paragraph', () => {
    expect(normalizeProductSubtitleForEditor('* Note')).toBe('<p>* Note</p>');
  });

  it('passes through sanitized HTML', () => {
    expect(normalizeProductSubtitleForEditor('<p><strong>Note</strong></p>')).toContain('<strong>Note</strong>');
  });
});
