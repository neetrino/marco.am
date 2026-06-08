import { describe, expect, it } from 'vitest';

import { parseDescriptionHtmlToEntries, parseProductDescriptionJson } from './product-description';

describe('parseDescriptionHtmlToEntries', () => {
  it('parses strong label rows from legacy HTML', () => {
    const html =
      '<h1><strong>ԲՆՈՒԹԱԳԻՐ</strong></h1>\\n<strong>Արտադրող երկիր</strong> Հայաստան\\n<strong>Հումք</strong> Գործվածք';
    expect(parseDescriptionHtmlToEntries(html)).toEqual([
      { title: 'Արտադրող երկիր', value: 'Հայաստան' },
      { title: 'Հումք', value: 'Գործվածք' },
    ]);
  });

  it('falls back to plain text for simple paragraphs', () => {
    expect(parseDescriptionHtmlToEntries('<p>Demo product</p>')).toEqual([
      { title: '', value: 'Demo product' },
    ]);
  });
});

describe('parseProductDescriptionJson', () => {
  it('validates stored JSON rows', () => {
    expect(
      parseProductDescriptionJson([
        { title: 'Material', value: 'Fabric' },
        { title: '  ', value: ' ' },
      ]),
    ).toEqual([{ title: 'Material', value: 'Fabric' }]);
  });
});
