'use client';

import Image from 'next/image';
import { useMemo, useState, type CSSProperties } from 'react';

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
import { resolveBrandDisplayLogoForCell } from '@/lib/brand-static-logo-assets';
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
  const resolved = resolveBrandDisplayLogoForCell(
    partner.logoUrl,
    partner.slug,
    partner.name,
  );
  const [failedRemoteSrc, setFailedRemoteSrc] = useState<string | null>(null);

  const cell = brandDirectoryLogoCellStyle(partner.slug, partner.name);
  const oversized = isBrandLogoCellOversizedSlug(partner.slug, partner.name);
  const sizes = `${oversized ? BRANDS_DIRECTORY_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX : BRANDS_DIRECTORY_LOGO_CELL_MAX_WIDTH_PX}px`;

  const remoteSrc = useMemo(() => {
    if (resolved.mode !== 'remote') {
      return null;
    }
    if (failedRemoteSrc === resolved.src) {
      return null;
    }
    return resolved.src;
  }, [resolved, failedRemoteSrc]);

  if (resolved.mode === 'wordmark' || (resolved.mode === 'remote' && !remoteSrc)) {
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

  if (resolved.mode === 'local') {
    return (
      <div
        className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
        style={cell}
      >
        <Image
          src={resolved.asset.src}
          alt={partner.name}
          fill
          className={BRANDS_DIRECTORY_LOGO_IMAGE_CLASS}
          sizes={sizes}
          loading={imagePriority ? 'eager' : 'lazy'}
          priority={imagePriority}
          fetchPriority={imagePriority ? 'high' : 'auto'}
          unoptimized={shouldBypassNextImageOptimizer(resolved.asset.src)}
        />
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
      style={cell}
    >
      <Image
        src={remoteSrc!}
        alt={partner.name}
        fill
        className={BRANDS_DIRECTORY_LOGO_IMAGE_CLASS}
        sizes={sizes}
        loading={imagePriority ? 'eager' : 'lazy'}
        priority={imagePriority}
        fetchPriority={imagePriority ? 'high' : 'auto'}
        unoptimized={shouldBypassNextImageOptimizer(remoteSrc!)}
        onError={() => {
          setFailedRemoteSrc(remoteSrc);
        }}
      />
    </div>
  );
}
