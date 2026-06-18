'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '@/lib/utils/image-utils';
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
 * Brand row for product cards: uses `logoUrl` from DB (R2); wordmark when missing or broken.
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
  const remoteSrc = useMemo(() => toSafeImgAttributeSrc(logoUrl), [logoUrl]);
  const [showWordmark, setShowWordmark] = useState(remoteSrc === null);

  useEffect(() => {
    setShowWordmark(remoteSrc === null);
  }, [remoteSrc, slug, logoUrl, name]);

  const sizing = PRODUCT_CARD_BRAND_LOGO_SIZES[size];
  const rowClassName = logoBoxClassName ?? sizing.rowClassName;

  const wordmarkClassName = textClassName
    ? `truncate leading-none ${textClassName}`
    : sizing.wordmarkClassName;

  if (showWordmark || !remoteSrc) {
    return (
      <div className={rowClassName} aria-label={displayName || 'Brand'}>
        <span className={wordmarkClassName}>{displayName || '—'}</span>
      </div>
    );
  }

  const src = toDomSafeImgSrcString(remoteSrc);

  return (
    <div className={rowClassName} aria-label={displayName || 'Brand'}>
      <div className={sizing.logoCellClassName}>
        <Image
          src={src}
          alt={displayName || 'Brand'}
          fill
          className={sizing.imageClassName}
          sizes={sizing.logoSizes}
          loading="lazy"
          unoptimized={shouldBypassNextImageOptimizer(src)}
          onError={() => {
            setShowWordmark(true);
          }}
        />
      </div>
    </div>
  );
}
