'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ProductImagePlaceholder } from '../ProductImagePlaceholder';

import {
  SPECIAL_OFFERS_IMAGE_NUDGE_LEFT_PX,
  SPECIAL_OFFERS_IMAGE_TRANSLATE_Y_MOBILE_EXTRA_PX,
  SPECIAL_OFFERS_IMAGE_TRANSLATE_Y_PX,
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

function imageTranslateYPx(layout: SpecialOfferCardMediaProps['layout']): number {
  const extra =
    layout === 'mobileGrid' ? SPECIAL_OFFERS_IMAGE_TRANSLATE_Y_MOBILE_EXTRA_PX : 0;
  return SPECIAL_OFFERS_IMAGE_TRANSLATE_Y_PX + extra;
}

export function SpecialOfferCardMedia({
  slug,
  title,
  images,
  showPlaceholder,
  onImageError,
  layout = 'default',
}: SpecialOfferCardMediaProps) {
  const translateY = imageTranslateYPx(layout);
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
            transform: `translate(-${SPECIAL_OFFERS_IMAGE_NUDGE_LEFT_PX}px, ${translateY}px)`,
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
      className="relative z-0 mt-0 flex w-full items-center justify-center overflow-hidden bg-white p-6 max-md:z-20"
      style={{
        height: SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
        borderRadius: SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX,
      }}
    >
      <Image
        src={singleSrc}
        alt={title}
        fill
        className="object-contain mix-blend-multiply"
        style={{
          transform: `translate(-${SPECIAL_OFFERS_IMAGE_NUDGE_LEFT_PX}px, ${translateY}px)`,
        }}
        sizes="(max-width: 1024px) 260px, 20vw"
        unoptimized
        onError={onImageError}
      />
    </Link>
  );
}
