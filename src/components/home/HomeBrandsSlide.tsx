'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import { BrandPlpLink } from '@/components/BrandPlpLink';

import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '@/lib/utils/image-utils';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

import {
  HOME_BRANDS_RAIL_LOGO_CELL_HEIGHT_PX,
  HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX,
  HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS,
  HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX,
  HOME_BRANDS_SLIDE_CARD_PADDING_CLASS,
  HOME_BRANDS_SLIDE_CORNER_RADIUS_PX,
  HOME_BRANDS_SLIDE_GAP_PX,
  HOME_BRANDS_SLIDE_SURFACE_HEX,
} from './home-brands-slide.constants';

function brandCardShellStyle(): CSSProperties {
  return {
    minHeight: `${HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX}px`,
    borderRadius: `${HOME_BRANDS_SLIDE_CORNER_RADIUS_PX}px`,
    backgroundColor: HOME_BRANDS_SLIDE_SURFACE_HEX,
  };
}

const gridStyle = {
  gap: `${HOME_BRANDS_SLIDE_GAP_PX}px`,
} as const;

function logoRailCellStyle(): CSSProperties {
  return {
    height: `${HOME_BRANDS_RAIL_LOGO_CELL_HEIGHT_PX}px`,
    maxWidth: `${HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX}px`,
  };
}

type HomeBrandsSlideProps = {
  /** From public API; null or empty hides the rail. */
  partners: HomeBrandPartnerPublicItem[] | null;
};

function chunkIntoPages<T>(items: readonly T[], pageSize: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  return pages;
}

function PartnerLogo({
  partner,
  loadEager,
}: {
  partner: HomeBrandPartnerPublicItem;
  loadEager: boolean;
}) {
  const remoteSrc = useMemo(
    () => toSafeImgAttributeSrc(partner.logoUrl),
    [partner.logoUrl],
  );
  const [showWordmark, setShowWordmark] = useState(remoteSrc === null);

  useEffect(() => {
    setShowWordmark(remoteSrc === null);
  }, [remoteSrc, partner.id, partner.logoUrl]);

  const cellStyle = logoRailCellStyle();
  const sizesW = HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX;

  if (showWordmark || !remoteSrc) {
    return (
      <div
        className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
        style={cellStyle}
      >
        <span className="line-clamp-2 max-h-full max-w-full text-center text-xs font-semibold uppercase leading-tight text-marco-black sm:text-sm">
          {partner.name.trim() || partner.slug}
        </span>
      </div>
    );
  }

  const src = toDomSafeImgSrcString(remoteSrc);

  return (
    <div
      className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
      style={cellStyle}
    >
      <Image
        src={src}
        alt={partner.name}
        fill
        className={HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS}
        sizes={`${sizesW}px`}
        loading={loadEager ? 'eager' : 'lazy'}
        priority={loadEager}
        fetchPriority={loadEager ? 'high' : 'auto'}
        unoptimized={shouldBypassNextImageOptimizer(src)}
        onError={() => {
          setShowWordmark(true);
        }}
      />
    </div>
  );
}

/**
 * Brand logo cards — Figma 101:4108; responsive grid so four logos fit without horizontal scroll (md+).
 */
export function HomeBrandsSlide({ partners }: HomeBrandsSlideProps) {
  if (!partners || partners.length === 0) {
    return null;
  }

  const partnerPages = chunkIntoPages(partners, 4);

  return (
    <div className="flex w-full shrink-0 snap-x snap-mandatory gap-3">
      {partnerPages.map((page, pageIndex) => (
        <div key={`partners-page-${pageIndex}`} className="grid w-full shrink-0 snap-start grid-cols-2 md:grid-cols-4" style={gridStyle}>
          {page.map((partner, logoIndex) => (
            <BrandPlpLink
              key={partner.id}
              href={partner.href}
              className={`flex w-full min-w-0 items-center justify-center overflow-hidden ${HOME_BRANDS_SLIDE_CARD_PADDING_CLASS}`}
              style={brandCardShellStyle()}
              aria-label={partner.name}
            >
              <PartnerLogo partner={partner} loadEager={pageIndex === 0 && logoIndex < 2} />
            </BrandPlpLink>
          ))}
        </div>
      ))}
    </div>
  );
}
