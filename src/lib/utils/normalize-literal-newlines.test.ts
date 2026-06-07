import { describe, expect, it } from 'vitest';

import {
  normalizeDescriptionHtmlForDisplay,
  normalizeLiteralNewlinesToLineBreaks,
} from './normalize-literal-newlines';

describe('normalizeLiteralNewlinesToLineBreaks', () => {
  it('converts literal backslash-n and /n to real newlines', () => {
    expect(normalizeLiteralNewlinesToLineBreaks('a\\nb/n')).toBe('a\nb\n');
  });
});

describe('normalizeDescriptionHtmlForDisplay', () => {
  it('converts escaped and real newlines to br tags', () => {
    expect(normalizeDescriptionHtmlForDisplay('line1\\nline2')).toBe('line1<br>line2');
  });
});
