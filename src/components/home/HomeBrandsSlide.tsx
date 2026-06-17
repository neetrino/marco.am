'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import { BrandPlpLink } from '@/components/BrandPlpLink';

import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';
import {
  GEEPAS_BRAND_LOGO_UI_SCALE,
  isGeepasBrandLogo,
} from '@/lib/brand-logo-display';
import {
  HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_HEIGHT_PX,
  HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX,
  HOME_BRANDS_SLIDE_CARD_OVERSIZED_MIN_HEIGHT_PX,
  isBrandLogoCellOversizedSlug,
} from '@/lib/brand-logo-cell-oversize';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '@/lib/utils/image-utils';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';

import {
  HOME_BRANDS_RAIL_LOGO_CELL_HEIGHT_PX,
  HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX,
  HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS,
  HOME_BRAND_SLIDE_ENTRIES,
  HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX,
  HOME_BRANDS_SLIDE_CARD_PADDING_CLASS,
  HOME_BRANDS_SLIDE_CORNER_RADIUS_PX,
  HOME_BRANDS_SLIDE_GAP_PX,
  HOME_BRANDS_SLIDE_SURFACE_HEX,
} from './home-brands-slide.constants';

function brandCardShellStyle(slug: string, displayName: string): CSSProperties {
  const oversized = isBrandLogoCellOversizedSlug(slug, displayName);
  return {
    minHeight: `${oversized ? HOME_BRANDS_SLIDE_CARD_OVERSIZED_MIN_HEIGHT_PX : HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX}px`,
    borderRadius: `${HOME_BRANDS_SLIDE_CORNER_RADIUS_PX}px`,
    backgroundColor: HOME_BRANDS_SLIDE_SURFACE_HEX,
  };
}

const gridStyle = {
  gap: `${HOME_BRANDS_SLIDE_GAP_PX}px`,
} as const;

function logoRailCellStyle(slug: string, displayName: string): CSSProperties {
  const oversized = isBrandLogoCellOversizedSlug(slug, displayName);
  return {
    height: `${oversized ? HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_HEIGHT_PX : HOME_BRANDS_RAIL_LOGO_CELL_HEIGHT_PX}px`,
    maxWidth: `${oversized ? HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX : HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX}px`,
  };
}

type HomeBrandsSlideProps = {
  /** From public API; when null or empty, static Figma placeholders are used. */
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

  const cellStyle = logoRailCellStyle(partner.slug, partner.name);
  const sizesW = isBrandLogoCellOversizedSlug(partner.slug, partner.name)
    ? HOME_BRANDS_RAIL_LOGO_OVERSIZED_CELL_MAX_WIDTH_PX
    : HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX;

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
  const geepasBoost = isGeepasBrandLogo(partner.slug, partner.name);

  return (
    <div
      className={`relative mx-auto flex w-full shrink-0 items-center justify-center${geepasBoost ? ' overflow-visible' : ' overflow-hidden'}`}
      style={cellStyle}
    >
      <Image
        src={src}
        alt={partner.name}
        fill
        className={`${HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS}${geepasBoost ? ' origin-center' : ''}`}
        style={geepasBoost ? { transform: `scale(${GEEPAS_BRAND_LOGO_UI_SCALE})` } : undefined}
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
  if (partners !== null && partners.length === 0) {
    return null;
  }

  const hasPartners = partners !== null && partners.length > 0;
  const partnerPages = hasPartners ? chunkIntoPages(partners, 4) : [];
  const fallbackPages = chunkIntoPages(HOME_BRAND_SLIDE_ENTRIES, 4);

  if (partners && partners.length > 0) {
    return (
      <div className="flex w-full shrink-0 snap-x snap-mandatory gap-3">
        {partnerPages.map((page, pageIndex) => (
          <div key={`partners-page-${pageIndex}`} className="grid w-full shrink-0 snap-start grid-cols-2 md:grid-cols-4" style={gridStyle}>
            {page.map((partner, logoIndex) => (
              <BrandPlpLink
                key={partner.id}
                href={partner.href}
                className={`flex w-full min-w-0 items-center justify-center overflow-hidden ${HOME_BRANDS_SLIDE_CARD_PADDING_CLASS}`}
                style={brandCardShellStyle(partner.slug, partner.name)}
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

  return (
    <div className="flex w-full shrink-0 snap-x snap-mandatory gap-3">
      {fallbackPages.map((page, pageIndex) => (
        <div key={`fallback-page-${pageIndex}`} className="grid w-full shrink-0 snap-start grid-cols-2 md:grid-cols-4" style={gridStyle}>
          {page.map((entry, logoIndex) => (
            <div
              key={entry.id}
              className={`flex w-full min-w-0 items-center justify-center overflow-hidden ${HOME_BRANDS_SLIDE_CARD_PADDING_CLASS}`}
              style={brandCardShellStyle(entry.id, entry.alt)}
            >
              <div
                className="relative mx-auto w-full shrink-0"
                style={logoRailCellStyle(entry.id, entry.alt)}
              >
                <Image
                  src={entry.src}
                  alt={entry.alt}
                  fill
                  className={HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS}
                  sizes={`${HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX}px`}
                  priority={pageIndex === 0 && logoIndex < 2}
                  loading={pageIndex === 0 && logoIndex < 2 ? 'eager' : 'lazy'}
                  fetchPriority={pageIndex === 0 && logoIndex < 2 ? 'high' : 'auto'}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
