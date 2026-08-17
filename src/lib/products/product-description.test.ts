import { describe, expect, it } from 'vitest';

import {
  parseDescriptionHtmlToEntries,
  parseProductDescriptionJson,
  pickTranslationForProductDescription,
} from './product-description';

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

describe('pickTranslationForProductDescription', () => {
  it('prefers en when it already has specs', () => {
    const picked = pickTranslationForProductDescription([
      { locale: 'en', description: [{ title: 'Color', value: 'Black' }] },
      { locale: 'hy', description: [{ title: 'Գույն', value: 'Սև' }] },
    ]);
    expect(picked?.locale).toBe('en');
  });

  it('falls back to hy when en exists but has no specs', () => {
    const picked = pickTranslationForProductDescription([
      { locale: 'en', description: [] },
      { locale: 'hy', description: [{ title: 'Գույն', value: 'Սև' }] },
      { locale: 'ru', description: [{ title: 'Цвет', value: 'Чёрный' }] },
    ]);
    expect(picked?.locale).toBe('hy');
  });

  it('returns preferred locale when no locale has specs', () => {
    const picked = pickTranslationForProductDescription([
      { locale: 'en', description: [] },
      { locale: 'hy', description: null },
    ]);
    expect(picked?.locale).toBe('en');
  });
});
