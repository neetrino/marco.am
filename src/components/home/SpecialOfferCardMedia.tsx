'use client';

import Image from 'next/image';

import { ProductPdpPrefetchLink } from '../ProductPdpPrefetchLink';
import type { ProductPdpNavigationSeed } from '@/lib/product-pdp/pdp-navigation-seed';
import { ProductImagePlaceholder } from '../ProductImagePlaceholder';

import { shouldBypassNextImageOptimizer } from '../../lib/utils/should-bypass-next-image-optimizer';
import { SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX } from './home-special-offers.constants';
import { SpecialOfferImageSlider } from './SpecialOfferImageSlider';

/** Tailwind-safe image well radius — full bleed on mobile (`max-md`). */
const SPECIAL_OFFERS_IMAGE_WELL_RADIUS_CLASS = 'max-md:rounded-none md:rounded-[19px]';

interface SpecialOfferCardMediaProps {
  slug: string;
  title: string;
  images: string[];
  showPlaceholder: boolean;
  onImageError: () => void;
  layout?: 'default' | 'mobileGrid' | 'homeGrid';
  imagePriority?: boolean;
  /** No product URL yet — keep image well layout without navigation. */
  navigationDisabled?: boolean;
  navigationSeed?: ProductPdpNavigationSeed;
}

export function SpecialOfferCardMedia({
  slug,
  title,
  images,
  showPlaceholder,
  onImageError,
  layout = 'default',
  imagePriority = false,
  navigationDisabled = false,
  navigationSeed,
}: SpecialOfferCardMediaProps) {
  const translateY = 0;
  const nudgeLeftPx = 0;
  const imageFillClass = 'object-cover object-center';
  const imageWellPaddingClass = 'p-0';
  const imageWellBgClass = 'bg-transparent';

  if (showPlaceholder) {
    return (
      <div
        className={`pointer-events-auto relative z-0 mt-0 flex w-full items-center justify-center overflow-hidden bg-white p-6 max-md:z-20 max-md:p-0 ${SPECIAL_OFFERS_IMAGE_WELL_RADIUS_CLASS}`}
        style={{
          height: SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
        }}
      >
        <div
          className="h-full w-full"
          style={{
            transform: `translate(-${nudgeLeftPx}px, ${translateY}px)`,
          }}
        >
          <ProductImagePlaceholder className="h-full w-full" aria-label={title} />
        </div>
      </div>
    );
  }

  if (images.length > 1) {
    return (
      <SpecialOfferImageSlider
        layout={layout}
        slug={slug}
        title={title}
        images={images}
        onImageError={onImageError}
        imagePriority={imagePriority}
        navigationDisabled={navigationDisabled}
        navigationSeed={navigationSeed}
      />
    );
  }

  const singleSrc = images[0] as string;

  const singleImageWellClass = `pointer-events-auto relative z-0 mt-0 flex w-full items-center justify-center overflow-hidden ${imageWellBgClass} ${imageWellPaddingClass} max-md:z-20 ${SPECIAL_OFFERS_IMAGE_WELL_RADIUS_CLASS}`;
  const singleImageWellStyle = {
    height: SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
  } as const;

  const singleImageInner = (
    <Image
      src={singleSrc}
      alt={title}
      fill
      className={imageFillClass}
      style={{
        transform: `translate(-${nudgeLeftPx}px, ${translateY}px)`,
      }}
      sizes="(max-width: 768px) 42vw, (max-width: 1200px) 22vw, 280px"
      priority={imagePriority}
      loading={imagePriority ? 'eager' : 'lazy'}
      unoptimized={shouldBypassNextImageOptimizer(singleSrc)}
      onError={onImageError}
    />
  );

  if (navigationDisabled) {
    return (
      <div className={singleImageWellClass} style={singleImageWellStyle}>
        {singleImageInner}
      </div>
    );
  }

  return (
    <ProductPdpPrefetchLink
      href={`/products/${slug}`}
      productSlug={slug}
      navigationSeed={navigationSeed}
      className={singleImageWellClass}
      style={singleImageWellStyle}
    >
      {singleImageInner}
    </ProductPdpPrefetchLink>
  );
}
