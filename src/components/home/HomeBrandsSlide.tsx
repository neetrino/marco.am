import Image from 'next/image';
import Link from 'next/link';

import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import {
  HOME_BRAND_LOGO_CLASS_DEFAULT,
  HOME_BRAND_LOGO_CLASS_LARGE,
  HOME_BRAND_SLIDE_ENTRIES,
  HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX,
  HOME_BRANDS_SLIDE_CORNER_RADIUS_PX,
  HOME_BRANDS_SLIDE_GAP_PX,
  HOME_BRANDS_SLIDE_SURFACE_HEX,
  type HomeBrandLogoScale,
} from './home-brands-slide.constants';

const brandCardShellStyle = {
  minHeight: `${HOME_BRANDS_SLIDE_CARD_MIN_HEIGHT_PX}px`,
  borderRadius: `${HOME_BRANDS_SLIDE_CORNER_RADIUS_PX}px`,
  backgroundColor: HOME_BRANDS_SLIDE_SURFACE_HEX,
} as const;

const gridStyle = {
  gap: `${HOME_BRANDS_SLIDE_GAP_PX}px`,
} as const;

function brandSlideLogoClass(logoScale: HomeBrandLogoScale | undefined): string {
  return logoScale === 'large' ? HOME_BRAND_LOGO_CLASS_LARGE : HOME_BRAND_LOGO_CLASS_DEFAULT;
}

function brandSlideCardPaddingClass(logoScale: HomeBrandLogoScale | undefined): string {
  return logoScale === 'large'
    ? 'px-2 py-3.5 sm:px-3 sm:py-4'
    : 'px-2 py-4 sm:px-3 sm:py-5';
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
  logoScale,
}: {
  partner: HomeBrandPartnerPublicItem;
  logoScale: HomeBrandLogoScale | undefined;
}) {
  const url = partner.logoUrl?.trim();
  if (!url) {
    return (
      <span
        className={`line-clamp-2 text-center text-xs font-semibold uppercase leading-tight text-marco-black sm:text-sm ${brandSlideLogoClass(logoScale)}`}
      >
        {partner.name}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={partner.name}
      className={brandSlideLogoClass(logoScale)}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * Brand logo cards — Figma 101:4108; responsive grid so four logos fit without horizontal scroll (md+).
 */
export function HomeBrandsSlide({ partners }: HomeBrandsSlideProps) {
  const hasPartners = partners && partners.length > 0;
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
                className={`flex w-full min-w-0 items-center justify-center overflow-hidden ${brandSlideCardPaddingClass(partner.logoScale)}`}
                style={brandCardShellStyle}
                aria-label={partner.name}
              >
                <PartnerLogo partner={partner} logoScale={partner.logoScale} />
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
              className={`flex w-full min-w-0 items-center justify-center overflow-hidden ${brandSlideCardPaddingClass(entry.logoScale)}`}
              style={brandCardShellStyle}
            >
              <Image
                src={entry.src}
                alt={entry.alt}
                width={entry.width}
                height={entry.height}
                className={brandSlideLogoClass(entry.logoScale)}
                sizes="(max-width: 768px) 120px, 25vw"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
