import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';
import { resolveBrandStaticLogo } from '@/lib/brand-static-logo-assets';

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

const brandCardShellStyle = {
  minHeight: `${HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX}px`,
  borderRadius: `${HOME_BRANDS_SLIDE_CORNER_RADIUS_PX}px`,
  backgroundColor: HOME_BRANDS_SLIDE_SURFACE_HEX,
} as const;

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
  const remote = partner.logoUrl?.trim();
  const bundled = !remote ? resolveBrandStaticLogo(partner.slug) : null;

  if (bundled) {
    return (
      <div
        className="relative mx-auto w-full shrink-0"
        style={logoRailCellStyle()}
      >
        <Image
          src={bundled.src}
          alt={partner.name}
          fill
          className={HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS}
          sizes={`${HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX}px`}
          loading={loadEager ? 'eager' : 'lazy'}
          priority={loadEager}
          fetchPriority={loadEager ? 'high' : 'auto'}
        />
      </div>
    );
  }

  if (remote) {
    return (
      <div
        className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
        style={logoRailCellStyle()}
      >
        <img
          src={remote}
          alt={partner.name}
          className={HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS}
          loading={loadEager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={loadEager ? 'high' : 'auto'}
        />
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto flex w-full shrink-0 items-center justify-center overflow-hidden"
      style={logoRailCellStyle()}
    >
      <span className="line-clamp-2 max-h-full max-w-full text-center text-xs font-semibold uppercase leading-tight text-marco-black sm:text-sm">
        {partner.name}
      </span>
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
            {page.map((partner) => (
              <Link
                key={partner.id}
                href={partner.href}
                className={`flex w-full min-w-0 items-center justify-center overflow-hidden ${HOME_BRANDS_SLIDE_CARD_PADDING_CLASS}`}
                style={brandCardShellStyle}
                aria-label={partner.name}
              >
                <PartnerLogo partner={partner} loadEager={pageIndex === 0} />
              </Link>
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
          {page.map((entry) => (
            <div
              key={entry.id}
              className={`flex w-full min-w-0 items-center justify-center overflow-hidden ${HOME_BRANDS_SLIDE_CARD_PADDING_CLASS}`}
              style={brandCardShellStyle}
            >
              <div
                className="relative mx-auto w-full shrink-0"
                style={logoRailCellStyle()}
              >
                <Image
                  src={entry.src}
                  alt={entry.alt}
                  fill
                  className={HOME_BRANDS_RAIL_LOGO_IMAGE_CLASS}
                  sizes={`${HOME_BRANDS_RAIL_LOGO_CELL_MAX_WIDTH_PX}px`}
                  priority={pageIndex === 0}
                  fetchPriority={pageIndex === 0 ? 'high' : 'auto'}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
