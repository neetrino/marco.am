#!/usr/bin/env node
/**
 * Primes home listing caches via HTTP (requires dev server running).
 * Usage: pnpm warm:home-cache
 */
const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

const paths = [
  '/',
  '/api/v1/products?page=1&limit=12&lang=hy&filter=promotion&omitProductAttributes=1&skipExactTotalCount=1&homeStripListing=1',
  '/api/v1/products?page=1&limit=16&lang=hy&filter=new&omitProductAttributes=1&skipExactTotalCount=1&homeStripListing=1',
  '/api/v1/products?page=1&limit=12&lang=en&filter=promotion&omitProductAttributes=1&skipExactTotalCount=1&homeStripListing=1',
  '/api/v1/products?page=1&limit=16&lang=en&filter=new&omitProductAttributes=1&skipExactTotalCount=1&homeStripListing=1',
  '/api/v1/home/brand-partners?locale=hy',
  '/api/v1/banners?slot=home.promo.strip&locale=hy',
  '/api/v1/banners?slot=home.hero.primary&locale=hy',
  '/api/v1/reels',
];

async function warm() {
  const started = Date.now();
  let ok = 0;
  let fail = 0;
  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        ok += 1;
        console.log(`OK  ${path}`);
      } else {
        fail += 1;
        console.log(`ERR ${path} → ${res.status}`);
      }
    } catch (error) {
      fail += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`ERR ${path} → ${message}`);
    }
  }
  console.log(`\nWarm-up done in ${Date.now() - started}ms (${ok} ok, ${fail} failed)\n`);
  process.exit(fail > 0 ? 1 : 0);
}

void warm();
