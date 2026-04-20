import { type RefObject, useEffect, useState } from 'react';

import {
  SPECIAL_OFFERS_CARD_GAP_PX,
  SPECIAL_OFFERS_RAIL_LG_MIN_WIDTH_PX,
  SPECIAL_OFFERS_VISIBLE_COLUMNS,
} from './home-special-offers.constants';

/**
 * Pixel width for each special-offers card so exactly four fit in the scroller (`md+`, see {@link SPECIAL_OFFERS_RAIL_LG_MIN_WIDTH_PX}).
 */
export function useSpecialOffersRailSlotWidth(
  scrollerRef: RefObject<HTMLDivElement | null>,
  isRailVisible: boolean,
): number | null {
  const [railSlotWidthPx, setRailSlotWidthPx] = useState<number | null>(null);

  useEffect(() => {
    if (!isRailVisible) {
      setRailSlotWidthPx(null);
      return;
    }
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const syncRailSlotWidth = () => {
      const current = scrollerRef.current;
      if (!current) {
        setRailSlotWidthPx(null);
        return;
      }
      if (typeof window !== 'undefined' && window.innerWidth < SPECIAL_OFFERS_RAIL_LG_MIN_WIDTH_PX) {
        setRailSlotWidthPx(null);
        return;
      }
      const n = SPECIAL_OFFERS_VISIBLE_COLUMNS;
      const gapsPx = (n - 1) * SPECIAL_OFFERS_CARD_GAP_PX;
      const slot = Math.floor((current.clientWidth - gapsPx) / n);
      setRailSlotWidthPx(Math.max(0, slot));
    };

    syncRailSlotWidth();
    const ro = new ResizeObserver(syncRailSlotWidth);
    ro.observe(el);

    const onWinResize = () => {
      syncRailSlotWidth();
    };
    window.addEventListener('resize', onWinResize);

    return () => {
      window.removeEventListener('resize', onWinResize);
      ro.disconnect();
    };
  }, [isRailVisible, scrollerRef]);

  return railSlotWidthPx;
}
