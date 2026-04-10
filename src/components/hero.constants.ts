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

/** Free delivery tile raster — 428×589; full art (text + icon), mask applied in `HomePromoFreeDeliveryBanner` */
export const HERO_FREE_DELIVERY_BANNER_IMAGE_SRC =
  '/assets/hero/hero-free-delivery-banner-428x589.png' as const;

/** Figma 101:4039 / mask — outer `border-radius` on free-delivery card (Subtract group) */
export const HERO_FREE_DELIVERY_TILE_MASK_CORNER_RADIUS_PX = 36;

/** Figma — concave top-right circular bite (`clip-path` / subtract from rectangle) */
export const HERO_FREE_DELIVERY_TILE_MASK_BITE_RADIUS_PX = 80;

/** Free-delivery tile pill CTA — compact strip */
export const HERO_FREE_DELIVERY_TILE_CTA_WIDTH_PX = 168;
export const HERO_FREE_DELIVERY_TILE_CTA_HEIGHT_PX = 38;
export const HERO_FREE_DELIVERY_TILE_CTA_BORDER_RADIUS_PX = 38;

/**
 * Raster: lower ~⅓ is blurred; CTA anchor slightly below band midpoint (tweak visually).
 */
export const HERO_FREE_DELIVERY_TILE_CTA_ANCHOR_FROM_TOP_FRAC = 0.86;

/** Fine vertical nudge after centering (`translateY`) — px up */
export const HERO_FREE_DELIVERY_TILE_CTA_NUDGE_UP_PX = 1;

/** Figma 305:2154 — 80% / smartphones promo tile (beside free-delivery banner) */
export const HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC =
  '/assets/hero/hero-promo-smartphones-banner-305-2154.png' as const;

/** CTA icon on 80% smartphones tile (`HomePromoSmartphonesBanner`) — diagonal arrow */
export const HERO_PROMO_SMARTPHONES_TILE_CTA_ICON_SRC =
  '/assets/hero/hero-promo-smartphones-tile-cta-icon.png' as const;

/** Fixed frame for the 80% smartphones tile only (free-delivery keeps shared side-tile sizing). */
export const HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX = 360;
export const HERO_PROMO_SMARTPHONES_TILE_HEIGHT_PX = 497;

/** Figma 101:4057 — white pill CTA on black 80% tile (`HomePromoSmartphonesBanner`) */
export const HERO_PROMO_SMARTPHONES_TILE_CTA_LEFT_FRAC = 0.38;
/** Lower value = visually higher on the tile */
export const HERO_PROMO_SMARTPHONES_TILE_CTA_ANCHOR_FROM_TOP_FRAC = 0.88;
export const HERO_PROMO_SMARTPHONES_TILE_CTA_MIN_WIDTH_PX = 176;
export const HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_X_PX = 22;
export const HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_Y_PX = 9;
/** Full capsule (thin strip) */
export const HERO_PROMO_SMARTPHONES_TILE_CTA_BORDER_RADIUS_PX = 9999;

/** Fine shift after anchor + `translate(-50%,-50%)` — positive moves the pill down */
export const HERO_PROMO_SMARTPHONES_TILE_CTA_NUDGE_DOWN_PX = 8;

/** Fine horizontal shift — positive moves the pill right */
export const HERO_PROMO_SMARTPHONES_TILE_CTA_NUDGE_X_PX = 6;

/** Free-delivery tile (`HomePromoFreeDeliveryBanner`; 80% tile uses fixed px above) — matches banner raster */
export const HERO_SIDE_PROMO_TILE_ASPECT_W = 428;
export const HERO_SIDE_PROMO_TILE_ASPECT_H = 589;

/**
 * Responsive width shared by both side promo tiles so they stay one size and align.
 * `lg+` max 280px (was 236px) for a larger, matched pair.
 */
export const HERO_SIDE_PROMO_TILE_WIDTH_CLASSNAME =
  'w-[min(42vw,200px)] sm:w-[min(38vw,220px)] md:w-[min(32vw,250px)] lg:w-[280px]' as const;

/** Tailwind aspect matching `HERO_SIDE_PROMO_TILE_ASPECT_W`∶`HERO_SIDE_PROMO_TILE_ASPECT_H` */
export const HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME = 'aspect-[428/589]' as const;

/** Hero headline box — design size (px); mirrored in `HomePromoYellowHeadline` Tailwind classes */
export const HERO_HEADLINE_MAX_WIDTH_PX = 580;
export const HERO_HEADLINE_HEIGHT_PX = 56;

/** Hero headline offset from yellow panel edges — sync with `HeroCarousel` (`top-[36px]`, `left-[40px]`) */
export const HERO_HEADLINE_OFFSET_TOP_PX = 36;
export const HERO_HEADLINE_OFFSET_LEFT_PX = 40;

/**
 * Hero chat FAB — Figma ref. 101:4070 100px; UI scaled down for the hero panel.
 */
export const HERO_CHAT_FAB_SIZE_PX = 64;
/** Narrow viewports — compact circle so it does not crowd the stacked card */
export const HERO_CHAT_FAB_SIZE_COMPACT_PX = 48;

/**
 * Figma 101:4071 — `mynaui:message-solid` (same path as `@mynaui/icons-react` MessageSolid, MIT).
 */
export const HERO_CHAT_FAB_MESSAGE_SOLID_PATH_D =
  'M11.953 2.25c-2.317 0-4.118 0-5.52.15-1.418.153-2.541.47-3.437 1.186-.92.736-1.35 1.693-1.553 2.9-.193 1.152-.193 2.618-.193 4.446v.183c0 1.782 0 3.015.2 3.934.108.495.278.925.545 1.323.264.392.6.722 1.001 1.042.631.505 1.375.81 2.254 1V21a.75.75 0 0 0 1.123.65c.586-.335 1.105-.7 1.58-1.044l.304-.221a22 22 0 0 1 1.036-.73c.844-.548 1.65-.905 2.707-.905h.047c2.317 0 4.118 0 5.52-.15 1.418-.153 2.541-.47 3.437-1.186.4-.32.737-.65 1-1.042.268-.398.438-.828.546-1.323.2-.919.2-2.152.2-3.934v-.183c0-1.828 0-3.294-.193-4.445-.203-1.208-.633-2.165-1.553-2.901-.896-.717-2.019-1.033-3.437-1.185-1.402-.151-3.203-.151-5.52-.151z' as const;

/** Icon fill — Figma dev (slate; pairs with promo stack blue) */
export const HERO_CHAT_FAB_ICON_FILL = '#2d4656' as const;

/** Figma 101:4068 — pill label left of chat FAB (`bg` = `HERO_PROMO_STACK_LAYER_BLUE`); UI scaled down */
export const HERO_CHAT_PILL_PADDING_INLINE_PX = 18;
export const HERO_CHAT_PILL_PADDING_BLOCK_PX = 8;
export const HERO_CHAT_PILL_MIN_HEIGHT_PX = 40;
export const HERO_CHAT_PILL_MAX_WIDTH_PX = 236;
export const HERO_CHAT_PILL_BORDER_RADIUS_PX = 48;
export const HERO_CHAT_PILL_BOX_SHADOW = '0 4px 24px rgba(150, 150, 150, 0.28)' as const;
