import { describe, expect, it } from 'vitest';

import { decodeCommonHtmlEntities } from './decode-common-html-entities';

describe('decodeCommonHtmlEntities', () => {
  it('decodes common named entities', () => {
    expect(decodeCommonHtmlEntities('Tom &amp; Jerry &quot;Show&quot;')).toBe(
      'Tom & Jerry "Show"',
    );
  });

  it('does not double-unescape amp-prefixed entities', () => {
    expect(decodeCommonHtmlEntities('&amp;quot;')).toBe('&quot;');
  });

  it('decodes nbsp and apostrophe entities', () => {
    expect(decodeCommonHtmlEntities('hello&nbsp;world&#39;s')).toBe("hello world's");
  });
});
