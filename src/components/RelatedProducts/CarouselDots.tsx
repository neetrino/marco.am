'use client';

interface CarouselDotsProps {
  totalItems: number;
  visibleItems: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
}

/**
 * Dots indicator for carousel
 */
export function CarouselDots({ totalItems, visibleItems, currentIndex, onDotClick }: CarouselDotsProps) {
  const totalPages = Math.ceil(totalItems / visibleItems);

  return (
    <div className="mt-8 flex justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, index) => {
        const startIndex = index * visibleItems;
        const endIndex = Math.min(startIndex + visibleItems, totalItems);
        const isActive = currentIndex >= startIndex && currentIndex < endIndex;
        
        return (
          <button
            key={index}
            onClick={() => onDotClick(startIndex)}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              isActive ? 'bg-[#181111] dark:!bg-[#ffca03]' : 'bg-[#d1d5db]'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        );
      })}
    </div>
  );
}




