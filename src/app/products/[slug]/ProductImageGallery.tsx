"use client";

import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Maximize2 } from "lucide-react";
import { ProductLabels } from "../../../components/ProductLabels";
import { ProductImagePlaceholder } from "../../../components/ProductImagePlaceholder";
import { t } from "../../../lib/i18n";
import type { LanguageCode } from "../../../lib/language";
import type { Product } from "./types";

interface ProductImageGalleryProps {
  images: string[];
  product: Product;
  discountPercent: number | null;
  language: LanguageCode;
  currentImageIndex: number;
  onImageIndexChange: Dispatch<SetStateAction<number>>;
  thumbnailStartIndex: number;
  onThumbnailStartIndexChange: (index: number) => void;
  /** Hint browser to decode the hero image first when only `/visual` data is available yet. */
  mainImageHighPriority?: boolean;
}

const THUMBNAILS_PER_VIEW = 3;

export function ProductImageGallery({
  images,
  product,
  discountPercent,
  language,
  currentImageIndex,
  onImageIndexChange,
  thumbnailStartIndex,
  onThumbnailStartIndexChange,
  mainImageHighPriority = false,
}: ProductImageGalleryProps) {
  const [showZoom, setShowZoom] = useState(false);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const galleryImages = images.filter(Boolean);
  const safeCurrentImageIndex =
    galleryImages.length === 0 ? 0 : Math.min(currentImageIndex, galleryImages.length - 1);

  const markFailed = (index: number) => {
    setFailedIndices((prev) => new Set(prev).add(index));
  };

  const mainImageFailed = failedIndices.has(safeCurrentImageIndex);
  const currentSrc = galleryImages[safeCurrentImageIndex] ?? null;
  const hasMultipleImages = galleryImages.length > 1;

  const goToPreviousImage = () => {
    if (!hasMultipleImages) return;
    const prevIndex =
      safeCurrentImageIndex === 0 ? galleryImages.length - 1 : safeCurrentImageIndex - 1;
    onImageIndexChange(prevIndex);
    if (galleryImages.length > THUMBNAILS_PER_VIEW) {
      if (prevIndex < thumbnailStartIndex) {
        onThumbnailStartIndexChange(prevIndex);
      } else if (prevIndex >= thumbnailStartIndex + THUMBNAILS_PER_VIEW) {
        onThumbnailStartIndexChange(prevIndex - THUMBNAILS_PER_VIEW + 1);
      }
    }
  };

  const goToNextImage = () => {
    if (!hasMultipleImages) return;
    const nextIndex =
      safeCurrentImageIndex === galleryImages.length - 1 ? 0 : safeCurrentImageIndex + 1;
    onImageIndexChange(nextIndex);
    if (galleryImages.length > THUMBNAILS_PER_VIEW) {
      if (nextIndex < thumbnailStartIndex) {
        onThumbnailStartIndexChange(nextIndex);
      } else if (nextIndex >= thumbnailStartIndex + THUMBNAILS_PER_VIEW) {
        onThumbnailStartIndexChange(nextIndex - THUMBNAILS_PER_VIEW + 1);
      }
    }
  };

  // Auto-scroll thumbnails to show selected image
  useEffect(() => {
    if (galleryImages.length > THUMBNAILS_PER_VIEW) {
      if (safeCurrentImageIndex < thumbnailStartIndex) {
        // Selected image is above visible range - scroll up
        onThumbnailStartIndexChange(safeCurrentImageIndex);
      } else if (safeCurrentImageIndex >= thumbnailStartIndex + THUMBNAILS_PER_VIEW) {
        // Selected image is below visible range - scroll down
        onThumbnailStartIndexChange(safeCurrentImageIndex - THUMBNAILS_PER_VIEW + 1);
      }
    }
  }, [safeCurrentImageIndex, galleryImages.length, thumbnailStartIndex, onThumbnailStartIndexChange]);

  // Show only 3 thumbnails at a time, scrollable with navigation arrows
  const visibleThumbnails = galleryImages.slice(
    thumbnailStartIndex,
    thumbnailStartIndex + THUMBNAILS_PER_VIEW
  );

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        {/* Left Column - Desktop Thumbnails (Vertical) */}
        <div className="hidden w-28 shrink-0 flex-col gap-4 md:flex">
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            {visibleThumbnails.map((image, index) => {
              const actualIndex = thumbnailStartIndex + index;
              const isActive = actualIndex === safeCurrentImageIndex;
              return (
                <button
                  key={actualIndex}
                  onClick={() => onImageIndexChange(actualIndex)}
                  className={`relative w-full aspect-[3/4] rounded-lg overflow-hidden border bg-white transition-all duration-300 flex-shrink-0 ${
                    isActive
                      ? "border-[3px] border-marco-yellow"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  {failedIndices.has(actualIndex) ? (
                    <ProductImagePlaceholder className="w-full h-full" aria-label="" />
                  ) : (
                    <img
                      src={image}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300"
                      onError={() => markFailed(actualIndex)}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Image */}
        <div className="mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none md:flex-1">
          <div className="relative aspect-square bg-white rounded-lg overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          {currentSrc && !mainImageFailed ? (
            <img
              src={currentSrc}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              fetchPriority={mainImageHighPriority ? 'high' : 'auto'}
              decoding="async"
              onError={() => markFailed(safeCurrentImageIndex)}
            />
          ) : (
            <ProductImagePlaceholder
              className="w-full h-full"
              aria-label={t(language, "common.messages.noImage")}
            />
          )}
          
          {/* Discount Badge on Image - Blue circle in top-right */}
          {discountPercent && (
            <div className="absolute top-4 right-4 w-14 h-14 bg-marco-yellow text-marco-black rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              -{discountPercent}%
            </div>
          )}

          {product.labels && <ProductLabels labels={product.labels} />}
          
          {/* Control Buttons - Bottom left */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-3 z-10">
            {/* Fullscreen Button */}
            <button 
              onClick={() => setShowZoom(true)} 
              className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:bg-white/90 transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
              aria-label={t(language, 'common.ariaLabels.fullscreenImage')}
            >
              <Maximize2 className="w-5 h-5 text-gray-800" />
            </button>
          </div>

          {/* Hover-only gallery navigation on main image */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={goToPreviousImage}
                className="pointer-events-none absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.18)] backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-white"
                aria-label={t(language, 'common.ariaLabels.previousThumbnail')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goToNextImage}
                className="pointer-events-none absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.18)] backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100 hover:bg-white"
                aria-label={t(language, 'common.ariaLabels.nextThumbnail')}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          </div>
        </div>

        {/* Mobile Thumbnails (Horizontal Scroll) */}
        <div className="md:hidden">
          <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full justify-center gap-3 px-1">
              {galleryImages.map((image, index) => {
                const isActive = index === safeCurrentImageIndex;
                return (
                  <button
                    key={index}
                    onClick={() => onImageIndexChange(index)}
                    className={`relative w-[58px] aspect-[3/4] shrink-0 overflow-hidden rounded-lg border bg-white transition-all duration-300 ${
                      isActive
                        ? "border-[3px] border-marco-yellow"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                    }`}
                  >
                    {failedIndices.has(index) ? (
                      <ProductImagePlaceholder className="w-full h-full" aria-label="" />
                    ) : (
                      <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300"
                        onError={() => markFailed(index)}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {showZoom && currentSrc && !failedIndices.has(safeCurrentImageIndex) && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowZoom(false)}>
          <img src={currentSrc} alt="" className="max-w-full max-h-full object-contain" />
          <button 
            className="absolute top-4 right-4 text-white text-2xl"
            aria-label={t(language, 'common.buttons.close')}
            onClick={(e) => {
              e.stopPropagation();
              setShowZoom(false);
            }}
          >
            {t(language, 'common.buttons.close')}
          </button>
        </div>
      )}
    </>
  );
}
