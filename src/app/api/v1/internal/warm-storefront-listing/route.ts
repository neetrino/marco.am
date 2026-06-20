import { NextResponse } from 'next/server';
import { warmStorefrontListingCaches } from '@/lib/cache/storefront-listing-warmup';
import {
  WARMUP_INTERNAL_TOKEN_HEADER,
  getWarmupInternalToken,
} from '@/lib/cache/warmup-internal-token';

function isWarmupEnabled(): boolean {
  return process.env.HOME_CACHE_WARMUP !== 'false' || process.env.CACHE_WARM_ON_START === '1';
}

function isWarmupAuthorized(req: Request): boolean {
  const secret = process.env.WARMUP_INTERNAL_SECRET?.trim();
  if (secret && req.headers.get('x-warmup-secret') === secret) {
    return true;
  }

  // Same-process loopback trigger from instrumentation: token authorizes regardless
  // of bind host (standalone binds 0.0.0.0, so the loopback host check is unreliable).
  if (req.headers.get(WARMUP_INTERNAL_TOKEN_HEADER) === getWarmupInternalToken()) {
    return true;
  }

  const host = new URL(req.url).hostname;
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

/** Best-effort Redis warm for hot storefront paths; triggered from instrumentation via loopback fetch. */
export async function POST(req: Request) {
  if (!isWarmupEnabled()) {
    return NextResponse.json({ ok: false, reason: 'disabled' }, { status: 404 });
  }

  if (!isWarmupAuthorized(req)) {
    return NextResponse.json({ ok: false, reason: 'forbidden' }, { status: 403 });
  }

  await warmStorefrontListingCaches();
  return NextResponse.json({ ok: true });
}
