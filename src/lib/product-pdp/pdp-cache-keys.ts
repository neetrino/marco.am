import { createHash } from 'node:crypto';

import { RELATED_PRODUCTS_PAGE_SIZE } from '@/lib/product-pdp/related-products.constants';

/** Null-byte separator for PDP cache identity — never embed `\0` / `\x00` in template literals. */
const PDP_CACHE_IDENTITY_SEP = '\u0000';

/**
 * SHA-256 fingerprint over ordered identity parts.
 * Uses `join` so Turbopack cannot merge escape sequences (e.g. `\x000` → `\00`).
 */
function hashPdpCacheIdentity(...parts: (string | number)[]): string {
  return createHash('sha256')
    .update(parts.map(String).join(PDP_CACHE_IDENTITY_SEP))
    .digest('hex');
}

export function buildPdpDetailApiCacheKey(slug: string, lang: string): string {
  return `cache:products:detail:v1:${hashPdpCacheIdentity(slug, lang)}`;
}

export function buildPdpRelatedApiCacheKey(
  slug: string,
  lang: string,
  limit: number,
  offset: number,
): string {
  return `cache:products:pdp:related:v2:${hashPdpCacheIdentity('pdp:related:v2', slug, lang, limit, offset)}`;
}

export function buildPdpSsrDetailCacheKey(slug: string, lang: string): string {
  return `cache:products:pdp:ssr:detail:v2:${hashPdpCacheIdentity('pdp:ssr:detail:v2', slug, lang)}`;
}

export function buildPdpSsrRelatedCacheKey(slug: string, lang: string): string {
  return `cache:products:pdp:ssr:related:v2:${hashPdpCacheIdentity(
    'pdp:ssr:related:v2',
    slug,
    lang,
    RELATED_PRODUCTS_PAGE_SIZE,
    0,
  )}`;
}
