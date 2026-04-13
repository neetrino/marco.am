'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ProductImagePlaceholder } from '../ProductImagePlaceholder';

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
      className="relative mt-14 block aspect-square w-full overflow-hidden rounded-lg bg-[#f9fafb] p-4"
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
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
          onError={onImageError}
        />
      )}
    </Link>
  );
}
