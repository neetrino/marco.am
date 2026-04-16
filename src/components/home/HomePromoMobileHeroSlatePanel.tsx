'use client';

import {
  HERO_MOBILE_SLATE_PANEL_BOX_STYLE,
  HERO_MOBILE_SLATE_PANEL_RADIUS_PX,
  HERO_PROMO_STACK_LAYER_BLUE,
} from '../hero.constants';

const slateFillStyle = {
  ...HERO_MOBILE_SLATE_PANEL_BOX_STYLE,
  backgroundColor: HERO_PROMO_STACK_LAYER_BLUE,
  borderRadius: HERO_MOBILE_SLATE_PANEL_RADIUS_PX,
} as const;

/** MARCO — Figma 314:2384: rounded slate panel on mobile hero (decorative). */
export function HomePromoMobileHeroSlatePanel() {
  return (
    <div
      className="pointer-events-none absolute z-[9] box-border md:hidden"
      style={slateFillStyle}
      aria-hidden
    />
  );
}
