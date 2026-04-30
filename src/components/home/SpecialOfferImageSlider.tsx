'use client';

import Image from 'next/image';

import { useTranslation } from '../../lib/i18n-client';
import { ProductPdpPrefetchLink } from '../ProductPdpPrefetchLink';
import { shouldBypassNextImageOptimizer } from '../../lib/utils/should-bypass-next-image-optimizer';

import {
  SPECIAL_OFFERS_GALLERY_DOTS_BELOW_WELL_MOBILE_EXTRA_PX,
  SPECIAL_OFFERS_GALLERY_DOTS_BELOW_WELL_PX,
  SPECIAL_OFFERS_GALLERY_DOTS_GAP_PX,
  SPECIAL_OFFERS_GALLERY_DOTS_OVERLAP_PX,
  SPECIAL_OFFERS_GALLERY_DOT_HIT_PX,
  SPECIAL_OFFERS_GALLERY_PIP_ACTIVE,
  SPECIAL_OFFERS_GALLERY_PIP_INACTIVE,
  SPECIAL_OFFERS_GALLERY_PIP_SIZE_PX,
  SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX,
  SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX,
} from './home-special-offers.constants';
import { useSpecialOfferImageGallery } from './useSpecialOfferImageGallery';

interface SpecialOfferImageSliderProps {
  slug: string;
  title: string;
  images: string[];
  onImageError: () => void;
  layout?: 'default' | 'mobileGrid';
  imagePriority?: boolean;
  navigationDisabled?: boolean;
}

function galleryDotAriaLabel(raw: string, n: number, total: number): string {
  return raw.replace('{{n}}', String(n)).replace('{{total}}', String(total));
}

interface DotsProps {
  images: string[];
  activeIndex: number;
  ariaTemplate: string;
  paginationAria: string;
  onPick: (index: number) => void;
  dotsBelowWellPx: number;
}

function SpecialOfferGalleryDots({
  images,
  activeIndex,
  ariaTemplate,
  paginationAria,
  onPick,
  dotsBelowWellPx,
}: DotsProps) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex justify-center"
      style={{
        bottom: -dotsBelowWellPx,
        gap: SPECIAL_OFFERS_GALLERY_DOTS_GAP_PX,
      }}
      role="group"
      aria-label={paginationAria}
    >
      {images.map((_, index) => {
        const active = index === activeIndex;
        const hitPx = SPECIAL_OFFERS_GALLERY_DOT_HIT_PX;
        return (
          <button
            key={index}
            type="button"
            aria-label={galleryDotAriaLabel(ariaTemplate, index + 1, images.length)}
            aria-current={active ? 'true' : undefined}
            className="pointer-events-auto flex shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:ring-2 focus-visible:ring-marco-black/25"
            style={{
              width: hitPx,
              height: hitPx,
              marginLeft: index === 0 ? 0 : -SPECIAL_OFFERS_GALLERY_DOTS_OVERLAP_PX,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPick(index);
            }}
          >
            <span
              className="rounded-full"
              style={{
                width: SPECIAL_OFFERS_GALLERY_PIP_SIZE_PX,
                height: SPECIAL_OFFERS_GALLERY_PIP_SIZE_PX,
                backgroundColor: active
                  ? SPECIAL_OFFERS_GALLERY_PIP_ACTIVE
                  : SPECIAL_OFFERS_GALLERY_PIP_INACTIVE,
              }}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Multi-image strip with snap scroll + bottom pips (Figma `101:3353`).
 */
export function SpecialOfferImageSlider({
  slug,
  title,
  images,
  onImageError,
  layout = 'default',
  imagePriority = false,
  navigationDisabled = false,
}: SpecialOfferImageSliderProps) {
  const { t } = useTranslation();
  const { scrollerRef, activeIndex, goToIndex } = useSpecialOfferImageGallery(
    images.length,
  );

  const ariaTemplate = t('home.special_offers.gallery_dot_aria');
  const paginationAria = t('home.special_offers.gallery_pagination_aria');

  const wellRadiusPx = SPECIAL_OFFERS_IMAGE_WELL_RADIUS_PX;
  const wellHeightPx = SPECIAL_OFFERS_IMAGE_WELL_HEIGHT_PX;
  const imageTranslateY = 0;
  const imageNudgeLeftPx = 0;
  const imageFillClass = 'object-cover object-center';
  const imagePaddingClass = 'p-0';
  const imageWellBgClass = 'bg-transparent';
  const dotsBelowWellPx =
    SPECIAL_OFFERS_GALLERY_DOTS_BELOW_WELL_PX +
    (layout === 'mobileGrid' ? SPECIAL_OFFERS_GALLERY_DOTS_BELOW_WELL_MOBILE_EXTRA_PX : 0);

  return (
    <div
      className="relative isolate z-10 w-full max-md:z-20"
      style={{ height: wellHeightPx }}
    >
      {/* Images only — clipped; dots stay outside this layer so they paint on top. */}
      <div
        className={`absolute inset-0 overflow-hidden ${imageWellBgClass}`}
        style={{ borderRadius: wellRadiusPx }}
      >
        <div
          ref={scrollerRef}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, index) => {
            const slideInner = (
              <Image
                src={src}
                alt=""
                fill
                className={imageFillClass}
                style={{
                  transform: `translate(-${imageNudgeLeftPx}px, ${imageTranslateY}px)`,
                }}
                sizes="(max-width: 768px) 42vw, (max-width: 1200px) 22vw, 280px"
                priority={imagePriority && index === 0}
                loading={imagePriority && index === 0 ? 'eager' : 'lazy'}
                unoptimized={shouldBypassNextImageOptimizer(src)}
                onError={onImageError}
              />
            );
            const slideClass = `relative block h-full w-full ${imagePaddingClass}`;
            const slideAria = `${title} — ${index + 1} / ${images.length}`;
            return (
              <div
                key={`${src}-${index}`}
                className="relative h-full min-w-full shrink-0 snap-center snap-always"
              >
                {navigationDisabled ? (
                  <div className={slideClass} aria-label={slideAria}>
                    {slideInner}
                  </div>
                ) : (
                  <ProductPdpPrefetchLink
                    href={`/products/${slug}`}
                    productSlug={slug}
                    className={slideClass}
                    aria-label={slideAria}
                  >
                    {slideInner}
                  </ProductPdpPrefetchLink>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <SpecialOfferGalleryDots
        images={images}
        activeIndex={activeIndex}
        ariaTemplate={ariaTemplate}
        paginationAria={paginationAria}
        dotsBelowWellPx={dotsBelowWellPx}
        onPick={goToIndex}
      />
    </div>
  );
}
