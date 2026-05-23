import { describe, expect, it } from 'vitest';
import {
  splitSpecificationFootnote,
  splitSpecificationValueParts,
} from './product-specifications-value';

describe('splitSpecificationValueParts', () => {
  it('returns empty for blank or placeholder dash', () => {
    expect(splitSpecificationValueParts('')).toEqual([]);
    expect(splitSpecificationValueParts('   ')).toEqual([]);
    expect(splitSpecificationValueParts('-')).toEqual([]);
  });

  it('returns single-element array when no comma list', () => {
    expect(splitSpecificationValueParts('Միայն տեքստ')).toEqual(['Միայն տեքստ']);
  });

  it('splits on comma and trims segments', () => {
    expect(splitSpecificationValueParts(' a , b , c ')).toEqual(['a', 'b', 'c']);
  });

  it('dedupes case-insensitively while keeping first casing', () => {
    expect(splitSpecificationValueParts('BOSCH, bosch, Nobel')).toEqual(['BOSCH', 'Nobel']);
  });

  it('dedupes identical Armenian tokens', () => {
    expect(splitSpecificationValueParts('Սև, Սպիտակ, Սև')).toEqual(['Սև', 'Սպիտակ']);
  });
});

describe('splitSpecificationFootnote', () => {
  it('returns full value when no asterisk footnote', () => {
    expect(splitSpecificationFootnote('85 x 60 x 45 սմ')).toEqual({
      main: '85 x 60 x 45 սմ',
      footnote: null,
    });
  });

  it('splits main value and disclaimer after spaced asterisk', () => {
    expect(
      splitSpecificationFootnote(
        '85 x 60 x 45 սմ * Չափսերը հնարավոր է տարբերվեն կայքում հրապարակվածից',
      ),
    ).toEqual({
      main: '85 x 60 x 45 սմ',
      footnote: 'Չափսերը հնարավոր է տարբերվեն կայքում հրապարակվածից',
    });
  });

  it('falls back when asterisk split would leave empty main segment', () => {
    expect(splitSpecificationFootnote(' * միայն նշում')).toEqual({
      main: '* միայն նշում',
      footnote: null,
    });
  });
});
