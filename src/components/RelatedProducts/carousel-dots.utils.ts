function safeVisibleCount(visibleItems: number): number {
  return Math.max(1, visibleItems);
}

/** Last slide index when paging by full visible rows (e.g. indices 0, 4, 8 for 4-up). */
export function getCarouselPageMaxIndex(itemCount: number, visibleItems: number): number {
  const visible = safeVisibleCount(visibleItems);
  const totalPages = Math.max(1, Math.ceil(itemCount / visible));
  return Math.max(0, (totalPages - 1) * visible);
}

/** Snap a raw index to the nearest page start. */
export function snapCarouselIndexToPage(
  index: number,
  itemCount: number,
  visibleItems: number,
): number {
  const visible = safeVisibleCount(visibleItems);
  const maxIndex = getCarouselPageMaxIndex(itemCount, visible);
  const page = Math.round(index / visible);
  const snapped = page * visible;
  return Math.max(0, Math.min(maxIndex, snapped));
}

type CarouselDotState = {
  totalPages: number;
  pageStartIndex: (page: number) => number;
  activePage: (currentIndex: number) => number;
};

/** Dot count + page helpers for paged carousels (four cards per dot on desktop PDP). */
export function getCarouselDotState(itemCount: number, visibleItems: number): CarouselDotState {
  const visible = safeVisibleCount(visibleItems);
  const totalPages = Math.max(1, Math.ceil(itemCount / visible));

  return {
    totalPages,
    pageStartIndex: (page: number) => page * visible,
    activePage: (currentIndex: number) => {
      const maxIndex = getCarouselPageMaxIndex(itemCount, visible);
      const clamped = Math.min(Math.max(0, currentIndex), maxIndex);
      return Math.floor(clamped / visible);
    },
  };
}
