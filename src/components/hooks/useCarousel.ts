'use client';

import { useState, useEffect, useRef, type MouseEvent, type TouchEvent } from 'react';

import {
  getCarouselDotState,
  getCarouselPageMaxIndex,
  snapCarouselIndexToPage,
} from '../RelatedProducts/carousel-dots.utils';

interface UseCarouselProps {
  itemCount: number;
  visibleItems: number;
  /** Set to 0 to disable auto-rotation. Default: 5000ms. */
  autoRotateInterval?: number;
  /** When true, prev/next and drag snap move by full pages (e.g. 4 cards). */
  pageByVisibleCount?: boolean;
}

/**
 * Hook for managing carousel state and interactions
 */
export function useCarousel({
  itemCount,
  visibleItems,
  autoRotateInterval = 5000,
  pageByVisibleCount = false,
}: UseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const safeVisible = Math.max(1, visibleItems);
  const { totalPages } = getCarouselDotState(itemCount, safeVisible);
  const maxIndex = pageByVisibleCount
    ? getCarouselPageMaxIndex(itemCount, safeVisible)
    : Math.max(0, itemCount - safeVisible);

  const clampIndex = (index: number): number => {
    if (pageByVisibleCount) {
      return snapCarouselIndexToPage(index, itemCount, safeVisible);
    }
    return Math.max(0, Math.min(maxIndex, index));
  };

  // Auto-rotate carousel (skip when interval is 0 or fewer items than viewport)
  useEffect(() => {
    if (autoRotateInterval <= 0 || itemCount <= visibleItems || isDragging) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const clamped = Math.min(prevIndex, maxIndex);
        return clamped >= maxIndex ? 0 : clamped + 1;
      });
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [itemCount, visibleItems, isDragging, maxIndex, autoRotateInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => {
      if (pageByVisibleCount) {
        const currentPage = Math.floor(Math.min(prevIndex, maxIndex) / safeVisible);
        const prevPage = currentPage <= 0 ? totalPages - 1 : currentPage - 1;
        return prevPage * safeVisible;
      }
      const clamped = Math.min(prevIndex, maxIndex);
      return clamped === 0 ? maxIndex : clamped - 1;
    });
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => {
      if (pageByVisibleCount) {
        const currentPage = Math.floor(Math.min(prevIndex, maxIndex) / safeVisible);
        const nextPage = currentPage >= totalPages - 1 ? 0 : currentPage + 1;
        return nextPage * safeVisible;
      }
      const clamped = Math.min(prevIndex, maxIndex);
      return clamped >= maxIndex ? 0 : clamped + 1;
    });
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(clampIndex(index));
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    setHasMoved(false);
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(currentIndex);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.pageX - carouselRef.current.offsetLeft;
    const deltaX = Math.abs(x - startX);
    
    // Only consider it dragging if mouse moved more than 5px
    if (deltaX > 5) {
      setHasMoved(true);
      e.preventDefault();
      const walk = (x - startX) * 2; // Scroll speed multiplier
      const cardWidth = 100 / visibleItems;
      const newIndex = Math.round((scrollLeft - walk / (carouselRef.current.offsetWidth / 100)) / cardWidth);
      setCurrentIndex(clampIndex(newIndex));
    }
  };

  const handleMouseUp = () => {
    const wasDragging = isDragging;
    const didMove = hasMoved;
    setIsDragging(false);
    if (pageByVisibleCount && wasDragging) {
      setCurrentIndex((prev) => clampIndex(prev));
    }
    // Reset hasMoved after a short delay to allow click events to process
    if (wasDragging && didMove) {
      setTimeout(() => setHasMoved(false), 150);
    } else {
      setHasMoved(false);
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    setHasMoved(false);
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(currentIndex);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const deltaX = Math.abs(x - startX);
    
    // Only consider it dragging if touch moved more than 5px
    if (deltaX > 5) {
      setHasMoved(true);
      const walk = (x - startX) * 2;
      const cardWidth = 100 / visibleItems;
      const newIndex = Math.round((scrollLeft - walk / (carouselRef.current.offsetWidth / 100)) / cardWidth);
      setCurrentIndex(clampIndex(newIndex));
    }
  };

  const handleTouchEnd = () => {
    const wasDragging = isDragging;
    const didMove = hasMoved;
    setIsDragging(false);
    if (pageByVisibleCount && wasDragging) {
      setCurrentIndex((prev) => clampIndex(prev));
    }
    if (wasDragging && didMove) {
      setTimeout(() => setHasMoved(false), 150);
    } else {
      setHasMoved(false);
    }
  };

  return {
    currentIndex,
    isDragging,
    hasMoved,
    carouselRef,
    goToPrevious,
    goToNext,
    goToIndex,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}




