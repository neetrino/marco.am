import { describe, expect, it } from 'vitest';
import {
  productRequiresAttributeSelection,
  resolveRequiresAttributeSelection,
} from './product-requires-attribute-selection';

describe('productRequiresAttributeSelection', () => {
  it('returns false for a single simple variant', () => {
    expect(
      productRequiresAttributeSelection([{ stock: 5, options: [] }]),
    ).toBe(false);
  });

  it('returns true when variants expose multiple color options', () => {
    expect(
      productRequiresAttributeSelection([
        {
          stock: 1,
          options: [{ key: 'color', value: 'Black' }],
        },
        {
          stock: 1,
          options: [{ key: 'color', value: 'Orange' }],
        },
      ]),
    ).toBe(true);
  });

  it('returns true for multiple sizes on one attribute key', () => {
    expect(
      productRequiresAttributeSelection([
        { stock: 2, options: [{ attribute: 'size', value: 'M' }] },
        { stock: 2, options: [{ attribute: 'size', value: 'L' }] },
      ]),
    ).toBe(true);
  });
});

describe('resolveRequiresAttributeSelection', () => {
  it('prefers explicit API flag', () => {
    expect(
      resolveRequiresAttributeSelection({
        requiresAttributeSelection: false,
        colors: [{ value: 'a' }, { value: 'b' }],
      }),
    ).toBe(false);
  });

  it('falls back to multiple card colors', () => {
    expect(
      resolveRequiresAttributeSelection({
        colors: [{ value: 'Black' }, { value: 'Orange' }],
      }),
    ).toBe(true);
  });
});
