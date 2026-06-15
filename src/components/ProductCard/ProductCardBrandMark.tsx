'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  buildBrandLogoCandidateSrcs,
  resolveProductCardBrandLogoUiScale,
} from '@/lib/brand-static-logo-assets';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

import {
  PRODUCT_CARD_BRAND_LOGO_SIZES,
  type ProductCardBrandLogoSize,
} from './product-card-brand-logo.constants';

export type ProductCardBrandMarkProps = {
  name: string;
  slug: string;
  logoUrl: string | null | undefined;
  size?: ProductCardBrandLogoSize;
  /** Optional color override for wordmark fallback. */
  textClassName?: string;
  /** @deprecated Prefer `size`. */
  logoBoxClassName?: string;
};

/**
 * Brand row for product cards: fixed visual height, per-brand scale tweaks, bundled assets by slug/name.
 */
export function ProductCardBrandMark({
  name,
  slug,
  logoUrl,
  size = 'grid',
  textClassName,
  logoBoxClassName,
}: ProductCardBrandMarkProps) {
  const safeName = typeof name === 'string' ? name : '';
  const displayName = safeName.trim();

  const sizing = PRODUCT_CARD_BRAND_LOGO_SIZES[size];
  const rowClassName = logoBoxClassName ?? sizing.rowClassName;

  const candidates = useMemo(
    () => buildBrandLogoCandidateSrcs(logoUrl, slug, safeName),
    [logoUrl, slug, safeName],
  );

  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [slug, logoUrl, name]);

  const wordmarkClassName = textClassName
    ? `truncate leading-none ${textClassName}`
    : sizing.wordmarkClassName;

  if (candidates.length === 0 || candidateIndex >= candidates.length) {
    return (
      <div className={rowClassName} aria-label={displayName || 'Brand'}>
        <span className={wordmarkClassName}>{displayName || '—'}</span>
      </div>
    );
  }

  const src = candidates[candidateIndex]!;
  const uiScale = resolveProductCardBrandLogoUiScale(slug, safeName, src);
  const needsScaleBoost = uiScale !== 1;

  const imageStyle: CSSProperties | undefined = needsScaleBoost
    ? { transform: `scale(${uiScale})`, transformOrigin: 'left center' }
    : undefined;

  const logoCellClassName = `${sizing.logoCellClassName}${
    needsScaleBoost ? ' overflow-visible' : ' overflow-hidden'
  }`;

  return (
    <div className={rowClassName} aria-label={displayName || 'Brand'}>
      <div className={logoCellClassName}>
        <Image
          src={src}
          alt={displayName || 'Brand'}
          fill
          className={sizing.imageClassName}
          sizes={sizing.logoSizes}
          style={imageStyle}
          loading="lazy"
          unoptimized={shouldBypassNextImageOptimizer(src)}
          onError={() => {
            setCandidateIndex((i) => i + 1);
          }}
        />
      </div>
    </div>
  );
}
