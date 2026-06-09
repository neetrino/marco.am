'use client';

import { getCarouselDotState } from './carousel-dots.utils';

interface CarouselDotsProps {
  totalItems: number;
  visibleItems: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
}

/**
 * Dots indicator for related-products carousel (aligned with one-card slide indices).
 */
export function CarouselDots({
  totalItems,
  visibleItems,
  currentIndex,
  onDotClick,
}: CarouselDotsProps) {
  const { totalPages, pageStartIndex, activePage } = getCarouselDotState(totalItems, visibleItems);
  const activeDot = activePage(currentIndex);

  return (
    <div className="mt-8 flex justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onDotClick(pageStartIndex(index))}
          className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
            index === activeDot ? 'bg-[#181111] dark:!bg-[#ffca03]' : 'bg-[#d1d5db]'
          }`}
          aria-label={`Go to slide ${index + 1}`}
          aria-current={index === activeDot ? 'true' : undefined}
        />
      ))}
    </div>
  );
}
