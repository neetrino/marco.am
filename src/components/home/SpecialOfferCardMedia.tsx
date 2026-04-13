'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ProductImagePlaceholder } from '../ProductImagePlaceholder';

import {
  SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
  SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX,
} from './home-special-offers.constants';

interface SpecialOfferCardMediaProps {
  slug: string;
  title: string;
  image: string | null;
  showPlaceholder: boolean;
  onImageError: () => void;
}

export function SpecialOfferCardMedia({
  slug,
  title,
  image,
  showPlaceholder,
  onImageError,
}: SpecialOfferCardMediaProps) {
  return (
    <Link
      href={`/products/${slug}`}
      className="relative mt-0 flex w-full items-center justify-center overflow-hidden bg-gray-50 p-6"
      style={{
        height: SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
        borderRadius: SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX,
      }}
    >
      {showPlaceholder ? (
        <ProductImagePlaceholder
          className="h-full w-full"
          aria-label={title}
        />
      ) : (
        <Image
          src={image as string}
          alt={title}
          fill
          className="object-contain mix-blend-multiply"
          sizes="(max-width: 1024px) 260px, 20vw"
          unoptimized
          onError={onImageError}
        />
      )}
    </Link>
  );
}
