'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  BRANDS_DIRECTORY_LOGO_IMAGE_CLASS,
  BRANDS_DIRECTORY_LOGO_CELL_HEIGHT_PX,
  BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX,
} from '@/constants/brands-directory-layout';
import {
  BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_HEIGHT_PX,
  BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX,
  isBrandLogoCellOversizedSlug,
} from '@/lib/brand-logo-cell-oversize';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '@/lib/utils/image-utils';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

function brandDirectoryLogoCellStyle(slug: string, displayName: string): CSSProperties {
  const oversized = isBrandLogoCellOversizedSlug(slug, displayName);
  return {
    height: `${oversized ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_HEIGHT_PX : BRANDS_DIRECTORY_LOGO_CELL_HEIGHT_PX}px`,
    maxWidth: `${oversized ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX : BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX}px`,
    width: '100%',
  };
}

export function BrandDirectoryLogo({
  partner,
  imagePriority,
}: {
  readonly partner: HomeBrandPartnerPublicItem;
  readonly imagePriority: boolean;
}) {
  const remoteSrc = useMemo(
    () => toSafeImgAttributeSrc(partner.logoUrl),
    [partner.logoUrl],
  );
  const [showWordmark, setShowWordmark] = useState(remoteSrc === null);

  useEffect(() => {
    setShowWordmark(remoteSrc === null);
  }, [remoteSrc, partner.id, partner.logoUrl]);

  const cell = brandDirectoryLogoCellStyle(partner.slug, partner.name);
  const oversized = isBrandLogoCellOversizedSlug(partner.slug, partner.name);
  const sizes = `${oversized ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX : BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX}px`;

  if (showWordmark || !remoteSrc) {
    return (
      <div
        className="mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden px-1"
        style={cell}
      >
        <span className="line-clamp-2 max-h-full max-w-full text-center text-base font-semibold uppercase leading-tight tracking-[0.14em] text-[#383838] dark:text-[#383838] md:text-lg">
          {partner.name.trim() || partner.slug}
        </span>
      </div>
    );
  }

  const src = toDomSafeImgSrcString(remoteSrc);

  return (
    <div
      className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
      style={cell}
    >
      <Image
        src={src}
        alt={partner.name}
        fill
        className={BRANDS_DIRECTORY_LOGO_IMAGE_CLASS}
        sizes={sizes}
        loading={imagePriority ? 'eager' : 'lazy'}
        priority={imagePriority}
        fetchPriority={imagePriority ? 'high' : 'auto'}
        unoptimized={shouldBypassNextImageOptimizer(src)}
        onError={() => {
          setShowWordmark(true);
        }}
      />
    </div>
  );
}
