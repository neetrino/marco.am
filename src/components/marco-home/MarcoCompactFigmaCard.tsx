'use client';

import { MarcoCompactCardChrome } from './MarcoCompactCardChrome';
import { MarcoCompactCardInner } from './MarcoCompactCardInner';

export type MarcoCompactFigmaCardProps = {
  className?: string;
  brand: string;
  brandColor: string;
  title: string;
  price: string;
  ratingCount: string;
  imageSrc: string;
  discountLabel?: string;
};

/**
 * Карточки Product2–4 из секций SPECIAL / NEWS (Figma).
 */
export function MarcoCompactFigmaCard({
  className = '',
  brand,
  brandColor,
  title,
  price,
  ratingCount,
  imageSrc,
  discountLabel = '-15%',
}: MarcoCompactFigmaCardProps) {
  return (
    <div
      className={`absolute top-0 h-[486px] w-[306.418px] rounded-[32px] bg-surface-default ${className}`}
    >
      <MarcoCompactCardInner
        brand={brand}
        brandColor={brandColor}
        title={title}
        price={price}
        ratingCount={ratingCount}
        imageSrc={imageSrc}
      />
      <MarcoCompactCardChrome discountLabel={discountLabel} />
    </div>
  );
}
