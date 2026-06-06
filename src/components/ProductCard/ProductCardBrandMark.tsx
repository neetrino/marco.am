'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  buildBrandLogoCandidateSrcs,
  resolveProductCardBrandLogoUiScale,
} from '@/lib/brand-static-logo-assets';

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
  const sizing = PRODUCT_CARD_BRAND_LOGO_SIZES[size];
  const rowClassName = logoBoxClassName ?? sizing.rowClassName;

  const candidates = useMemo(
    () => buildBrandLogoCandidateSrcs(logoUrl, slug, name),
    [logoUrl, slug, name],
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
      <div className={rowClassName} aria-label={name.trim() || 'Brand'}>
        <span className={wordmarkClassName}>{name.trim() ? name : '—'}</span>
      </div>
    );
  }

  const src = candidates[candidateIndex]!;
  const uiScale = resolveProductCardBrandLogoUiScale(slug, name, src);
  const needsScaleBoost = uiScale !== 1;

  return (
    <div
      className={`${rowClassName}${needsScaleBoost ? '' : ' overflow-hidden'}`}
    >
      <img
        src={src}
        alt={name.trim() || 'Brand'}
        className={sizing.imageClassName}
        style={
          needsScaleBoost
            ? { transform: `scale(${uiScale})`, transformOrigin: 'left center' }
            : undefined
        }
        loading="lazy"
        decoding="async"
        onError={() => {
          setCandidateIndex((i) => i + 1);
        }}
      />
    </div>
  );
}
