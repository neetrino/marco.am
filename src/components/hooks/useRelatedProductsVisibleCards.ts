'use client';

import { useEffect, useState } from 'react';

import {
  RELATED_PRODUCTS_DESKTOP_BREAKPOINT_PX,
  RELATED_PRODUCTS_DESKTOP_CARDS_PER_PAGE,
  RELATED_PRODUCTS_MOBILE_CARDS_PER_PAGE,
} from '@/lib/product-pdp/related-products-carousel.constants';

/**
 * PDP related rail — four cards per page on desktop (`lg+`), two on smaller viewports.
 */
export function useRelatedProductsVisibleCards(): number {
  const [visibleCards, setVisibleCards] = useState(RELATED_PRODUCTS_DESKTOP_CARDS_PER_PAGE);

  useEffect(() => {
    const updateVisibleCards = () => {
      setVisibleCards(
        window.innerWidth >= RELATED_PRODUCTS_DESKTOP_BREAKPOINT_PX
          ? RELATED_PRODUCTS_DESKTOP_CARDS_PER_PAGE
          : RELATED_PRODUCTS_MOBILE_CARDS_PER_PAGE,
      );
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  return visibleCards;
}
