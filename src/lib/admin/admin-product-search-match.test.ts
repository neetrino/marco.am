import { describe, expect, it } from 'vitest';
import {
  matchesAdminProductSearchFields,
  splitAdminSearchTokens,
} from './admin-product-search-match';

describe('splitAdminSearchTokens', () => {
  it('splits on whitespace and drops empty parts', () => {
    expect(splitAdminSearchTokens('  Nobel  NR700D  ')).toEqual(['Nobel', 'NR700D']);
  });
});

describe('matchesAdminProductSearchFields', () => {
  const row = {
    title: 'Nobel NR700D Refrigerator',
    slug: 'nobel-nr700d',
    searchText: 'nobel nr700d refrigerator nobel-nr700d',
    sku: '07550',
  };

  it('matches a single title token', () => {
    expect(matchesAdminProductSearchFields(row, 'nobel')).toBe(true);
  });

  it('matches when every multi-word token appears across fields', () => {
    expect(matchesAdminProductSearchFields(row, 'Nobel NR700D')).toBe(true);
    expect(matchesAdminProductSearchFields(row, 'refrigerator nobel')).toBe(true);
  });

  it('rejects when any token is missing', () => {
    expect(matchesAdminProductSearchFields(row, 'Nobel Samsung')).toBe(false);
  });

  it('matches SKU tokens alongside title tokens', () => {
    expect(matchesAdminProductSearchFields(row, '07550 nobel')).toBe(true);
  });
});
