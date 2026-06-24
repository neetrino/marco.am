import { describe, expect, it } from 'vitest';
import { matchesProductSearchFields, splitProductSearchTokens } from './match';

describe('splitProductSearchTokens', () => {
  it('splits on whitespace and drops empty parts', () => {
    expect(splitProductSearchTokens('  Nobel  NR700D  ')).toEqual(['Nobel', 'NR700D']);
  });
});

describe('matchesProductSearchFields', () => {
  const row = {
    title: 'Nobel NR700D Refrigerator',
    slug: 'nobel-nr700d',
    searchText: 'nobel nr700d refrigerator nobel-nr700d',
    sku: '07550',
  };

  it('matches a single title token', () => {
    expect(matchesProductSearchFields(row, 'nobel')).toBe(true);
  });

  it('matches when every multi-word token appears across fields', () => {
    expect(matchesProductSearchFields(row, 'Nobel NR700D')).toBe(true);
    expect(matchesProductSearchFields(row, 'refrigerator nobel')).toBe(true);
  });

  it('rejects when any token is missing', () => {
    expect(matchesProductSearchFields(row, 'Nobel Samsung')).toBe(false);
  });

  it('matches SKU tokens alongside title tokens', () => {
    expect(matchesProductSearchFields(row, '07550 nobel')).toBe(true);
  });
});
