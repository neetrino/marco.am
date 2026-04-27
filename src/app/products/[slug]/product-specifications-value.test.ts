import { describe, expect, it } from 'vitest';
import { splitSpecificationValueParts } from './product-specifications-value';

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
