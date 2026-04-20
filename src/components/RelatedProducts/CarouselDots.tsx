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
    <div className="mt-6 flex justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, index) => {
        const startIndex = index * visibleItems;
        const endIndex = Math.min(startIndex + visibleItems, totalItems);
        const isActive = currentIndex >= startIndex && currentIndex < endIndex;
        
        return (
          <button
            key={index}
            onClick={() => onDotClick(startIndex)}
            className={`rounded-full transition-colors ${
              isActive ? 'bg-marco-black' : 'bg-gray-300'
            }`}
            style={{ width: 8, height: 8 }}
            aria-label={`Go to slide ${index + 1}`}
          />
        );
      })}
    </div>
  );
}




