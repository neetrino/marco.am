"use client";

import Image from "next/image";
import { ProductLabels } from "../ProductLabels";
import { ProductPdpPrefetchLink } from "../ProductPdpPrefetchLink";
import { ProductImagePlaceholder } from "../ProductImagePlaceholder";
import { ProductWarrantyBadge } from "./ProductWarrantyBadge";
import type { ProductLabel } from "../ProductLabels";
import type { ProductWarrantyYears } from "@/lib/constants/product-warranty";

interface ProductCardImageProps {
  id?: string;
  slug: string;
  image: string | null;
  title: string;
  labels?: ProductLabel[];
  inStock?: boolean;
  brand?: {
    id: string;
    name: string;
    logoUrl?: string | null;
  } | null;
  categories?: Array<{ id: string; slug: string; title: string }>;
  price?: number;
  originalPrice?: number | null;
  compareAtPrice?: number | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  warrantyYears?: ProductWarrantyYears | null;
  imageError: boolean;
  onImageError: () => void;
  isCompact?: boolean;
  /** Eager load for above-the-fold tiles only (default: lazy). */
  imagePriority?: boolean;
  /**
   * When true, image is not wrapped in PDP link (parent provides navigation, e.g. full-card link).
   */
  omitPdpLink?: boolean;
}

/**
 * Component for displaying product image with labels.
 * Shows placeholder icon when no image or image failed to load.
 */
export function ProductCardImage({
  id,
  slug,
  image,
  title,
  labels,
  inStock,
  brand,
  categories,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent,
  isSpecialPrice = false,
  warrantyYears,
  imageError,
  onImageError,
  isCompact: _isCompact = false,
  imagePriority = false,
  omitPdpLink = false,
}: ProductCardImageProps) {
  const showPlaceholder = imageError || !image;

  const imageBlock = showPlaceholder ? (
    <ProductImagePlaceholder
      className="w-full h-full"
      aria-label={title ? `No image for ${title}` : "No image"}
    />
  ) : (
    <Image
      src={image}
      alt={title}
      fill
      className="object-cover object-center"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      priority={imagePriority}
      loading={imagePriority ? 'eager' : 'lazy'}
      unoptimized
      onError={onImageError}
    />
  );

  return (
    <div className="aspect-square bg-gray-100 relative overflow-hidden">
      {omitPdpLink ? (
        <div className="relative block h-full w-full">{imageBlock}</div>
      ) : (
        <ProductPdpPrefetchLink
          href={`/products/${slug}`}
          productSlug={slug}
          navigationSeed={
            id && typeof price === 'number'
              ? {
                  id,
                  slug,
                  title,
                  image,
                  labels,
                  warrantyYears: warrantyYears ?? null,
                  inStock,
                  brand: brand
                    ? {
                        id: brand.id,
                        name: brand.name,
                        logo: brand.logoUrl ?? null,
                      }
                    : null,
                  categories: categories ?? [],
                  price,
                  oldPrice:
                    originalPrice && originalPrice > price
                      ? originalPrice
                      : compareAtPrice ?? null,
                  discountBadge:
                    isSpecialPrice
                      ? { type: 'special_price', value: 0, label: 'special_price' }
                      : discountPercent && discountPercent > 0
                        ? {
                            type: 'percentage',
                            value: discountPercent,
                            label: `-${discountPercent}%`,
                          }
                        : null,
                }
              : undefined
          }
          className="relative block h-full w-full"
        >
          {imageBlock}
        </ProductPdpPrefetchLink>
      )}
      {warrantyYears ? (
        <div className="absolute left-2 top-2 z-30">
          <ProductWarrantyBadge years={warrantyYears} size="catalog" />
        </div>
      ) : null}
      {labels && labels.length > 0 && <ProductLabels labels={labels} />}
    </div>
  );
}




