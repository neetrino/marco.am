import Image from 'next/image';

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

/**
 * Brand logo cards — Figma 101:4108; responsive grid so four logos fit without horizontal scroll (md+).
 */
export function HomeBrandsSlide() {
  return (
    <div
      className="grid w-full grid-cols-2 md:grid-cols-4"
      style={gridStyle}
    >
      {HOME_BRAND_SLIDE_ENTRIES.map((entry) => (
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
  );
}
