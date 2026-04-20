"use client";

import Link from "next/link";
import Image from "next/image";
import { ProductLabels } from "../ProductLabels";
import { ProductImagePlaceholder } from "../ProductImagePlaceholder";
import type { ProductLabel } from "../ProductLabels";
import { SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC } from "../home/home-special-offers.constants";

interface ProductCardImageProps {
  slug: string;
  image: string | null;
  title: string;
  labels?: ProductLabel[];
  imageError: boolean;
  onImageError: () => void;
  isCompact?: boolean;
}

/**
 * Component for displaying product image with labels.
 * Shows placeholder icon when no image or image failed to load.
 */
export function ProductCardImage({
  slug,
  image: _image,
  title,
  labels,
  imageError,
  onImageError,
  isCompact: _isCompact = false,
}: ProductCardImageProps) {
  const displayImageSrc = SPECIAL_OFFERS_UNIFIED_NATURE_IMAGE_SRC;
  const showPlaceholder = imageError;

  return (
    <div className="aspect-square bg-gray-100 relative overflow-hidden">
      <Link href={`/products/${slug}`} className="block w-full h-full">
        {showPlaceholder ? (
          <ProductImagePlaceholder
            className="w-full h-full"
            aria-label={title ? `No image for ${title}` : "No image"}
          />
        ) : (
          <Image
            src={displayImageSrc}
            alt={title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            unoptimized
            onError={onImageError}
          />
        )}
      </Link>
      {labels && labels.length > 0 && <ProductLabels labels={labels} />}
    </div>
  );
}




