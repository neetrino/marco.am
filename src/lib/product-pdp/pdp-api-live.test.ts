/**
 * Live PDP API smoke tests — require `pnpm dev` on localhost:3000.
 * Skipped automatically when the dev server is unreachable.
 */
import { describe, expect, it, beforeAll } from 'vitest';

import { buildProductGalleryUrls } from '@/lib/products/product-gallery-urls';

const PDP_SLUG = 'marco-14157-geepas-grf2059spe';
const BASE_URL = process.env.PDP_E2E_BASE_URL ?? 'http://localhost:3000';

let serverAvailable = false;

beforeAll(async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/products/${PDP_SLUG}?lang=en`, {
      signal: AbortSignal.timeout(15000),
    });
    serverAvailable = response.ok;
  } catch {
    serverAvailable = false;
  }
}, 20000);

describe('PDP API live smoke', () => {
  it(
    'returns full product with canonical gallery order',
    async (ctx) => {
      if (!serverAvailable) {
        ctx.skip();
      }

      const response = await fetch(`${BASE_URL}/api/v1/products/${PDP_SLUG}?lang=en`, {
        signal: AbortSignal.timeout(15000),
      });
    expect(response.status).toBe(200);

    const product = (await response.json()) as {
      slug: string;
      media: string[];
      variants: Array<{ imageUrl?: string | null }>;
      description: unknown[];
    };

    expect(product.slug).toBe(PDP_SLUG);
    expect(product.description.length).toBeGreaterThan(0);
    expect(product.media.length).toBeGreaterThanOrEqual(3);

    const canonical = buildProductGalleryUrls(product.media, product.variants ?? []);
    expect(product.media).toEqual(canonical);
    expect(product.media[0]).toMatch(/^https?:\/\//);
    },
    20000,
  );

  it(
    'PLP transform uses same first gallery URL as PDP detail media[0]',
    async (ctx) => {
      if (!serverAvailable) {
        ctx.skip();
      }

      const detailRes = await fetch(`${BASE_URL}/api/v1/products/${PDP_SLUG}?lang=en`, {
        signal: AbortSignal.timeout(15000),
      });
    expect(detailRes.ok).toBe(true);
    const detail = (await detailRes.json()) as {
      media: string[];
      variants: Array<{ imageUrl?: string | null }>;
    };

    const rawMedia = [
      'https://marco.am/wp-content/uploads/2025/02/1.png',
      ...detail.media,
    ];
    const listingHero = buildProductGalleryUrls(rawMedia, detail.variants ?? [])[0] ?? null;

    expect(listingHero).toBe(detail.media[0]);
    expect(listingHero).toMatch(/^https?:\/\//);
    },
    20000,
  );
});
