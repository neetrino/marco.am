import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  buildPdpDetailApiCacheKey,
  buildPdpRelatedApiCacheKey,
  buildPdpSsrRelatedCacheKey,
} from '@/lib/product-pdp/pdp-cache-keys';

function legacyNullSeparatedHash(...parts: (string | number)[]): string {
  return createHash('sha256')
    .update(parts.map(String).join('\u0000'))
    .digest('hex');
}

describe('pdp cache keys', () => {
  it('matches legacy null-byte separated hashes', () => {
    expect(buildPdpDetailApiCacheKey('marco-foo', 'en')).toBe(
      `cache:products:detail:v1:${legacyNullSeparatedHash('marco-foo', 'en')}`,
    );
  });

  it('keeps related keys distinct for offset zero vs non-zero', () => {
    const firstPage = buildPdpRelatedApiCacheKey('marco-foo', 'en', 4, 0);
    const secondPage = buildPdpRelatedApiCacheKey('marco-foo', 'en', 4, 4);
    expect(firstPage).not.toBe(secondPage);
  });

  it('builds SSR related key for first carousel page', () => {
    expect(buildPdpSsrRelatedCacheKey('marco-foo', 'en')).toBe(
      `cache:products:pdp:ssr:related:v2:${legacyNullSeparatedHash('pdp:ssr:related:v2', 'marco-foo', 'en', 4, 0)}`,
    );
  });
});
