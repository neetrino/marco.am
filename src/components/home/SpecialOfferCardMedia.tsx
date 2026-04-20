'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ProductImagePlaceholder } from '../ProductImagePlaceholder';

import {
  SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
  SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX,
} from './home-special-offers.constants';
import { SpecialOfferImageSlider } from './SpecialOfferImageSlider';

interface SpecialOfferCardMediaProps {
  slug: string;
  title: string;
  images: string[];
  showPlaceholder: boolean;
  onImageError: () => void;
  layout?: 'default' | 'mobileGrid';
}

export function SpecialOfferCardMedia({
  slug,
  title,
  images,
  showPlaceholder,
  onImageError,
  layout = 'default',
}: SpecialOfferCardMediaProps) {
  const translateY = 0;
  const nudgeLeftPx = 0;
  const imageFillClass = 'object-cover object-center';
  const imageWellPaddingClass = 'p-0';
  const imageWellBgClass = 'bg-transparent';
  if (showPlaceholder) {
    return (
      <div
        className="relative z-0 mt-0 flex w-full items-center justify-center overflow-hidden bg-white p-6 max-md:z-20"
        style={{
          height: SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
          borderRadius: SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX,
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
      />
    );
  }

  const singleSrc = images[0] as string;

  return (
    <Link
      href={`/products/${slug}`}
      className={`relative z-0 mt-0 flex w-full items-center justify-center overflow-hidden ${imageWellBgClass} ${imageWellPaddingClass} max-md:z-20`}
      style={{
        height: SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
        borderRadius: SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX,
      }}
    >
      <Image
        src={singleSrc}
        alt={title}
        fill
        className={imageFillClass}
        style={{
          transform: `translate(-${nudgeLeftPx}px, ${translateY}px)`,
        }}
        sizes="(max-width: 1024px) 260px, 20vw"
        unoptimized
        onError={onImageError}
      />
    </Link>
  );
}
