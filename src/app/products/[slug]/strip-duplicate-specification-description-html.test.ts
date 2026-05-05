import { describe, expect, it } from 'vitest';

import { stripDuplicateSpecificationDescriptionHtml } from './strip-duplicate-specification-description-html';

describe('stripDuplicateSpecificationDescriptionHtml', () => {
  it('keeps intro copy and removes WooCommerce-style spec block', () => {
    const html = `<p>Intro text.</p><p><strong>Բնութագիր</strong></p><p><strong>Երկիր</strong> Վիետնամ</p><p><strong>Էկրան</strong> 55"</p>`;
    expect(stripDuplicateSpecificationDescriptionHtml(html)).toBe('<p>Intro text.</p>');
  });

  it('removes spec tables when they parse as multiple rows', () => {
    const html =
      '<p>Above</p><table><tr><td>A</td><td>1</td></tr><tr><td>B</td><td>2</td></tr></table><p>Tail</p>';
    expect(stripDuplicateSpecificationDescriptionHtml(html)).toBe('<p>Above</p><p>Tail</p>');
  });

  it('returns unchanged when there is no detectable spec block', () => {
    const html = '<p><strong>One label</strong> only value</p>';
    expect(stripDuplicateSpecificationDescriptionHtml(html)).toBe(html);
  });
});
