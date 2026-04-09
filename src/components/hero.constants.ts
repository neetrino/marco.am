/**
 * Home hero — Figma MARCO (node 305:2146) primary asset.
 * Inset values are applied via `.hero-section-inset` in `globals.css`.
 */

/** Yellow panel shape — `aspect-[141/79]` in `HeroCarousel` */
export const HERO_PANEL_ASPECT_W = 141;
export const HERO_PANEL_ASPECT_H = 79;

/** Panel corner radius — `rounded-[32px]` in `HeroCarousel` (ref. soft brick tile) */
export const HERO_PANEL_RADIUS_PX = 32;

/** Vertical brick wall — top aligns with hero; bottom crops under `object-cover` + `object-top` */
export const HERO_PRIMARY_IMAGE_SRC = '/assets/hero/hero-brick-wall-vertical.png' as const;

/** Figma 101:4019–101:4021 — stacked layer fills + 101:4023 chair asset */
export const HERO_PROMO_STACK_LAYER_WHITE = '#ffffff' as const;
export const HERO_PROMO_STACK_LAYER_GRAY = '#c7c7c7' as const;
export const HERO_PROMO_STACK_LAYER_BLUE = '#2f4b5d' as const;
export const HERO_PROMO_CHAIR_IMAGE_SRC = '/assets/hero/hero-promo-chair-101-4023.png' as const;

/** Figma 101:4025 — elliptical floor shadow under chair */
export const HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC =
  '/assets/hero/hero-promo-chair-shadow-101-4025.svg' as const;

/** Figma 101:4026 — round handle (arrows) on floor ellipse, Group 3 */
export const HERO_PROMO_SLIDER_HANDLE_IMAGE_SRC =
  '/assets/hero/hero-promo-slider-handle-101-4026.svg' as const;

/** Figma 305:2151 — free delivery warehouse banner (beside stacked blue card) */
export const HERO_FREE_DELIVERY_BANNER_IMAGE_SRC =
  '/assets/hero/hero-free-delivery-banner-305-2151.png' as const;

/** CTA icon on free-delivery side tile (`HomePromoFreeDeliveryBanner`) — black disc, yellow arrow */
export const HERO_FREE_DELIVERY_TILE_CTA_ICON_SRC =
  '/assets/hero/hero-promo-free-delivery-cta-icon.png' as const;

/** Figma 305:2154 — 80% / smartphones promo tile (beside free-delivery banner) */
export const HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC =
  '/assets/hero/hero-promo-smartphones-banner-305-2154.png' as const;

/** Fixed frame for the 80% smartphones tile only (free-delivery keeps shared side-tile sizing). */
export const HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX = 360;
export const HERO_PROMO_SMARTPHONES_TILE_HEIGHT_PX = 497;

/** Figma 305:2151 frame — free-delivery tile (`HomePromoFreeDeliveryBanner`; 80% tile uses fixed px above) */
export const HERO_SIDE_PROMO_TILE_ASPECT_W = 404;
export const HERO_SIDE_PROMO_TILE_ASPECT_H = 557;

/**
 * Responsive width shared by both side promo tiles so they stay one size and align.
 * `lg+` max 280px (was 236px) for a larger, matched pair.
 */
export const HERO_SIDE_PROMO_TILE_WIDTH_CLASSNAME =
  'w-[min(42vw,200px)] sm:w-[min(38vw,220px)] md:w-[min(32vw,250px)] lg:w-[280px]' as const;

/** Tailwind aspect matching `HERO_SIDE_PROMO_TILE_ASPECT_W`∶`HERO_SIDE_PROMO_TILE_ASPECT_H` */
export const HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME = 'aspect-[404/557]' as const;

/** Hero headline box — design size (px); mirrored in `HomePromoYellowHeadline` Tailwind classes */
export const HERO_HEADLINE_MAX_WIDTH_PX = 580;
export const HERO_HEADLINE_HEIGHT_PX = 56;

/** Hero headline offset from yellow panel edges — sync with `HeroCarousel` (`top-[36px]`, `left-[40px]`) */
export const HERO_HEADLINE_OFFSET_TOP_PX = 36;
export const HERO_HEADLINE_OFFSET_LEFT_PX = 40;
