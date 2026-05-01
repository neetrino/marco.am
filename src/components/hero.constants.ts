/**
 * Home hero — Figma MARCO (node 305:2146) primary asset.
 * Page horizontal inset matches other home sections (`max-w-7xl` + shared padding in `HeroCarousel`).
 */

import type { CSSProperties } from 'react';

/** Legacy yellow mobile panel ratio (unused in current `HeroCarousel` outer box). */
export const HERO_PANEL_ASPECT_W = 141;
export const HERO_PANEL_ASPECT_H = 79;

/** Panel corner radius — `rounded-[32px]` in `HeroCarousel` (ref. soft brick tile) */
export const HERO_PANEL_RADIUS_PX = 32;

/** Vertical brick wall — top aligns with hero; bottom crops under `object-cover` + `object-top` */
export const HERO_PRIMARY_IMAGE_SRC = '/assets/hero/hero-brick-wall-vertical.webp' as const;

/**
 * Mobile home hero — Figma MARCO `1114:3373` (`-355 1`, 399×288, radius 24).
 * Full-bleed raster; no separate headline/slate layers on top.
 */
export const HERO_MOBILE_PRIMARY_IMAGE_SRC =
  '/assets/hero/hero-mobile-home-banner-1114-3373.webp' as const;

/** Figma `1114:3373` frame — mobile hero card aspect (width∶height). */
export const HERO_MOBILE_HOME_BANNER_ASPECT_W = 399;
export const HERO_MOBILE_HOME_BANNER_ASPECT_H = 288;

/** Figma 101:4019–101:4021 — stacked layer fills + 101:4023 chair asset */
export const HERO_PROMO_STACK_LAYER_WHITE = '#ffffff' as const;
export const HERO_PROMO_STACK_LAYER_GRAY = '#c7c7c7' as const;
export const HERO_PROMO_STACK_LAYER_BLUE = '#2f4b5d' as const;
export const HERO_PROMO_CHAIR_IMAGE_SRC = '/assets/hero/hero-promo-chair-101-4023.webp' as const;
/** Raster pixel size — used by Next/Image `width`/`height` (natural asset). */
export const HERO_PROMO_CHAIR_IMAGE_NATURAL_WIDTH_PX = 500;
export const HERO_PROMO_CHAIR_IMAGE_NATURAL_HEIGHT_PX = 500;

/** Figma 101:4025 — elliptical floor shadow under chair */
export const HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC =
  '/assets/hero/hero-promo-chair-shadow-101-4025.svg' as const;

/** Figma 101:4026 — round handle (arrows) on floor ellipse, Group 3 */
export const HERO_PROMO_SLIDER_HANDLE_IMAGE_SRC =
  '/assets/hero/hero-promo-slider-handle-101-4026.svg' as const;

/** Free delivery tile raster — 428×589; full art (text + icon), mask applied in `HomePromoFreeDeliveryBanner` */
export const HERO_FREE_DELIVERY_BANNER_IMAGE_SRC =
  '/assets/hero/hero-free-delivery-banner-428x589.webp' as const;

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

/**
 * Shared TR icon size — free-delivery tile (black / yellow) + 80% tile (white / black).
 */
export const HERO_PROMO_SIDE_TILE_TR_ICON_FRAME_PX = 60;
export const HERO_PROMO_SIDE_TILE_TR_ICON_GLYPH_PX = 28;

export const HERO_FREE_DELIVERY_TILE_ARROW_FRAME_WIDTH_PX = HERO_PROMO_SIDE_TILE_TR_ICON_FRAME_PX;
export const HERO_FREE_DELIVERY_TILE_ARROW_FRAME_HEIGHT_PX = HERO_PROMO_SIDE_TILE_TR_ICON_FRAME_PX;
export const HERO_FREE_DELIVERY_TILE_ARROW_ICON_PX = HERO_PROMO_SIDE_TILE_TR_ICON_GLYPH_PX;

/** Fine horizontal nudge on free-delivery TR arrow only — positive moves right */
export const HERO_FREE_DELIVERY_TILE_ARROW_NUDGE_X_PX = 2;

/** Fine vertical nudge — negative moves up */
export const HERO_FREE_DELIVERY_TILE_ARROW_NUDGE_Y_PX = -1;

/**
 * Optional horizontal nudge for the free-delivery tile root (CSS px, negative margin-left).
 * Hero desktop: 0 — tile is beside the sofa stack; flex gap handles spacing.
 */
export const HERO_FREE_DELIVERY_TILE_ROW_NUDGE_LEFT_PX = 0;

/**
 * Vertical nudge for the free-delivery tile root beside the sofa stack (CSS px).
 * Negative moves the tile up.
 */
export const HERO_FREE_DELIVERY_TILE_TRANSLATE_Y_PX = -205;

/**
 * Horizontal nudge for the free-delivery tile root (CSS px, paired with translateY).
 * Positive moves the tile right.
 */
export const HERO_FREE_DELIVERY_TILE_TRANSLATE_X_PX = 38;

/** TR arrow `Link` — free-delivery tile (Figma 101:4047) */
export const HERO_PROMO_SIDE_TILE_ARROW_LINK_STYLE: CSSProperties = {
  width: `${HERO_FREE_DELIVERY_TILE_ARROW_FRAME_WIDTH_PX}px`,
  height: `${HERO_FREE_DELIVERY_TILE_ARROW_FRAME_HEIGHT_PX}px`,
  maxWidth: `min(100%, ${HERO_FREE_DELIVERY_TILE_ARROW_FRAME_WIDTH_PX}px)`,
};

/** Figma 305:2154 — 80% / smartphones promo tile (beside free-delivery banner) */
export const HERO_PROMO_SMARTPHONES_BANNER_IMAGE_SRC =
  '/assets/hero/hero-promo-smartphones-banner-305-2154.webp' as const;

/** Fixed frame for the 80% smartphones tile only (free-delivery keeps shared side-tile sizing). */
export const HERO_PROMO_SMARTPHONES_TILE_WIDTH_PX = 360;
export const HERO_PROMO_SMARTPHONES_TILE_HEIGHT_PX = 497;

/**
 * Figma 305:2130 — `Group 9208` top-right control on 80% tile: white circle, black NE arrow.
 * Lower `top` (px) moves the control up inside the tile frame.
 * Lower `right` (px) moves the control toward the right edge of the tile.
 */
export const HERO_PROMO_SMARTPHONES_TILE_TR_ICON_TOP_PX = 108;
export const HERO_PROMO_SMARTPHONES_TILE_TR_ICON_RIGHT_PX = 79;
export const HERO_PROMO_SMARTPHONES_TILE_TR_ICON_FRAME_PX = HERO_PROMO_SIDE_TILE_TR_ICON_FRAME_PX;
export const HERO_PROMO_SMARTPHONES_TILE_TR_ICON_GLYPH_PX = HERO_PROMO_SIDE_TILE_TR_ICON_GLYPH_PX;

/**
 * Figma 305:2159 — bottom white pill CTA on 80% tile (`HomePromoSmartphonesBanner`).
 * Compact pill; Montserrat Bold 14 / line 20; anchored bottom-left in tile space.
 */
export const HERO_PROMO_SMARTPHONES_TILE_CTA_LEFT_PX = 57;
export const HERO_PROMO_SMARTPHONES_TILE_CTA_BOTTOM_PX = 30;
export const HERO_PROMO_SMARTPHONES_TILE_CTA_BORDER_RADIUS_PX = 36;
export const HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_X_PX = 56;
export const HERO_PROMO_SMARTPHONES_TILE_CTA_PADDING_Y_PX = 8;

/** Free-delivery tile (`HomePromoFreeDeliveryBanner`; 80% tile uses fixed px above) — matches banner raster */
export const HERO_SIDE_PROMO_TILE_ASPECT_W = 428;
export const HERO_SIDE_PROMO_TILE_ASPECT_H = 589;

/**
 * Free-delivery van tile width (`HomePromoFreeDeliveryBanner`).
 * Fixed caps +3px vs base for a slightly larger tile.
 */
export const HERO_SIDE_PROMO_TILE_WIDTH_CLASSNAME =
  'w-[min(42vw,203px)] sm:w-[min(38vw,223px)] md:w-[min(32vw,255px)] lg:w-[287px]' as const;

/**
 * 80% hero tile — larger than {@link HERO_SIDE_PROMO_TILE_WIDTH_CLASSNAME}; same aspect {@link HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME}.
 */
export const HERO_PROMO_SMARTPHONES_TILE_ROW_WIDTH_CLASSNAME =
  'w-[min(50vw,256px)] sm:w-[min(46vw,284px)] md:w-[min(40vw,316px)] lg:w-[368px]' as const;

/** Tailwind aspect matching `HERO_SIDE_PROMO_TILE_ASPECT_W`∶`HERO_SIDE_PROMO_TILE_ASPECT_H` */
export const HERO_SIDE_PROMO_TILE_ASPECT_CLASSNAME = 'aspect-[428/589]' as const;

/**
 * Desktop hero — vertical base for sofa card only (`HeroCarousel`); negative → up (px). Independent of van tile.
 */
export const HERO_PROMO_DESKTOP_SOFA_ROW_TRANSLATE_Y_PX = -360;

/**
 * Extra vertical nudge stacked on {@link HERO_PROMO_DESKTOP_SOFA_ROW_TRANSLATE_Y_PX} for `HomePromoStackedProductCard`; negative → up.
 */
export const HERO_PROMO_DESKTOP_SOFA_CARD_EXTRA_TRANSLATE_Y_PX = -80;

/**
 * Russian (`ru`) desktop only — extra `translateY` on the sofa row (px). Positive moves the card down vs en/hy.
 */
export const HERO_PROMO_DESKTOP_SOFA_CARD_RU_EXTRA_TRANSLATE_Y_PX = 45;

/**
 * Desktop hero — sole vertical position for free-delivery / van tile (`HomePromoFreeDeliveryBanner`); negative → up.
 * Not tied to sofa row; tune separately (lower on screen = less negative).
 */
export const HERO_PROMO_DESKTOP_FREE_DELIVERY_BANNER_TRANSLATE_Y_PX = -430;

/**
 * Desktop hero — 80% tile (`layout="corner"`); nudge vs top-right flex slot (px). Positive X → right, negative Y → up.
 */
export const HERO_PROMO_SMARTPHONES_CORNER_NUDGE_X_PX = 77;
export const HERO_PROMO_SMARTPHONES_CORNER_NUDGE_Y_PX = -96;

/** Figma 314:2400 — mobile-only hero headline (Montserrat Black); tuned down vs Figma so one-line pair centers on narrow widths */
export const HERO_MOBILE_HEADLINE_FONT_SIZE_PX = 34;
export const HERO_MOBILE_HEADLINE_LINE_HEIGHT_PX = 34;

/** Armenian (`hy`) — «Անվճար / Առաքում» on mobile hero (tuned vs default 34px). */
export const HERO_MOBILE_HEADLINE_HY_FONT_SIZE_PX = 30;
export const HERO_MOBILE_HEADLINE_HY_LINE_HEIGHT_PX = 32;

/** Horizontal gap between the two headline words on mobile (`hy`). */
export const HERO_MOBILE_HEADLINE_HY_WORD_GAP_REM = 0.5;

/** Nudge headline left vs padding (px) */
export const HERO_MOBILE_HEADLINE_NUDGE_LEFT_PX = 2;

/**
 * Figma 314:2384 — mobile hero slate rounded panel (`Rectangle 289`).
 * Position vs `marco mobile2` hero: mask frame 399×288 @ y=130; panel @ (146, 227).
 * Size tuned ~+5% vs Figma export for clearer presence on device.
 */
export const HERO_MOBILE_SLATE_PANEL_WIDTH_PX = 267;
export const HERO_MOBILE_SLATE_PANEL_HEIGHT_PX = 186;
export const HERO_MOBILE_SLATE_PANEL_RADIUS_PX = 33;
/** Figma artboard width for mobile home (430) — horizontal placement */
export const HERO_MOBILE_FIGMA_FRAME_WIDTH_PX = 430;
/** Mask group height in Figma — vertical placement baseline */
export const HERO_MOBILE_FIGMA_HERO_MASK_HEIGHT_PX = 288;
/** Panel left edge / frame width */
export const HERO_MOBILE_SLATE_PANEL_LEFT_FRAC =
  146 / HERO_MOBILE_FIGMA_FRAME_WIDTH_PX;
/**
 * Panel top − mask top = 227 − 130 (px); as fraction of mask height for responsive top.
 */
export const HERO_MOBILE_SLATE_PANEL_TOP_FRAC =
  (227 - 130) / HERO_MOBILE_FIGMA_HERO_MASK_HEIGHT_PX;

/** Width / Figma frame — `min(..., ...%)` on slate panel */
export const HERO_MOBILE_SLATE_PANEL_WIDTH_FRAC =
  HERO_MOBILE_SLATE_PANEL_WIDTH_PX / HERO_MOBILE_FIGMA_FRAME_WIDTH_PX;

/** Shared absolute box for slate background + mobile CTA overlay (Figma 314:2384). */
export const HERO_MOBILE_SLATE_PANEL_BOX_STYLE: CSSProperties = {
  left: `${HERO_MOBILE_SLATE_PANEL_LEFT_FRAC * 100}%`,
  top: `${HERO_MOBILE_SLATE_PANEL_TOP_FRAC * 100}%`,
  width: `min(${HERO_MOBILE_SLATE_PANEL_WIDTH_PX}px, ${HERO_MOBILE_SLATE_PANEL_WIDTH_FRAC * 100}%)`,
  aspectRatio: `${HERO_MOBILE_SLATE_PANEL_WIDTH_PX} / ${HERO_MOBILE_SLATE_PANEL_HEIGHT_PX}`,
  maxWidth: `min(${HERO_MOBILE_SLATE_PANEL_WIDTH_PX}px, calc(100% - 1rem))`,
};

/**
 * Figma 314:2399 — product label on slate; inset vs slate top-left tuned from export (86, 22) px.
 */
export const HERO_MOBILE_SLATE_LABEL_LEFT_PX = 86;
export const HERO_MOBILE_SLATE_LABEL_TOP_PX = 22;
export const HERO_MOBILE_SLATE_LABEL_MAX_WIDTH_PX = 112;
export const HERO_MOBILE_SLATE_LABEL_FONT_SIZE_PX = 14;
export const HERO_MOBILE_SLATE_LABEL_LINE_HEIGHT_PX = 20;
export const HERO_MOBILE_SLATE_LABEL_LEFT_FRAC =
  HERO_MOBILE_SLATE_LABEL_LEFT_PX / HERO_MOBILE_SLATE_PANEL_WIDTH_PX;
export const HERO_MOBILE_SLATE_LABEL_TOP_FRAC =
  HERO_MOBILE_SLATE_LABEL_TOP_PX / HERO_MOBILE_SLATE_PANEL_HEIGHT_PX;
export const HERO_MOBILE_SLATE_LABEL_MAX_WIDTH_FRAC =
  HERO_MOBILE_SLATE_LABEL_MAX_WIDTH_PX / HERO_MOBILE_SLATE_PANEL_WIDTH_PX;

/**
 * Figma 314:2394 — mobile slate CTA pill (`212×56`, text 314:2395, icon group 314:2396).
 * Width/padding/icon tuned slightly under Figma; nudged vs export for device fit.
 */
export const HERO_MOBILE_SLATE_CTA_WIDTH_PX = 186;
export const HERO_MOBILE_SLATE_CTA_HEIGHT_PX = 53;
export const HERO_MOBILE_SLATE_CTA_ICON_CIRCLE_PX = 43;
export const HERO_MOBILE_SLATE_CTA_PILL_RADIUS_PX = HERO_MOBILE_SLATE_CTA_HEIGHT_PX / 2;
/** Left inset — larger = label + icon chip sit further right inside the pill. */
export const HERO_MOBILE_SLATE_CTA_PADDING_LEFT_PX = 38;
export const HERO_MOBILE_SLATE_CTA_PADDING_RIGHT_PX = 0;
export const HERO_MOBILE_SLATE_CTA_LABEL_ICON_GAP_PX = 11;

/** Armenian (`hy`) — extra air between label and arrow chip (mobile hero CTA). */
export const HERO_MOBILE_SLATE_CTA_HY_LABEL_ICON_GAP_PX = 16;
export const HERO_MOBILE_SLATE_CTA_ARROW_ICON_PX = 21;

/**
 * English (`en`) — «Buy now» pill slightly smaller than default (mobile hero).
 */
export const HERO_MOBILE_SLATE_CTA_EN_WIDTH_PX = 168;
export const HERO_MOBILE_SLATE_CTA_EN_HEIGHT_PX = 48;
export const HERO_MOBILE_SLATE_CTA_EN_ICON_CIRCLE_PX = 38;
export const HERO_MOBILE_SLATE_CTA_EN_PILL_RADIUS_PX = HERO_MOBILE_SLATE_CTA_EN_HEIGHT_PX / 2;
export const HERO_MOBILE_SLATE_CTA_EN_PADDING_LEFT_PX = 30;
export const HERO_MOBILE_SLATE_CTA_EN_ARROW_ICON_PX = 19;
/** Shift black arrow chip vs default placement (px). */
export const HERO_MOBILE_SLATE_CTA_EN_ICON_NUDGE_X_PX = 0;

/**
 * Russian (`ru`) — mobile hero «Купить сейчас» pill smaller than default (between default and `hy`).
 */
export const HERO_MOBILE_SLATE_CTA_RU_WIDTH_PX = 172;
export const HERO_MOBILE_SLATE_CTA_RU_HEIGHT_PX = 48;
export const HERO_MOBILE_SLATE_CTA_RU_ICON_CIRCLE_PX = 38;
export const HERO_MOBILE_SLATE_CTA_RU_PILL_RADIUS_PX = HERO_MOBILE_SLATE_CTA_RU_HEIGHT_PX / 2;
export const HERO_MOBILE_SLATE_CTA_RU_PADDING_LEFT_PX = 26;
export const HERO_MOBILE_SLATE_CTA_RU_ARROW_ICON_PX = 19;

/** Russian — shift black arrow chip left (px, negative = left). */
export const HERO_MOBILE_SLATE_CTA_RU_ICON_NUDGE_X_PX = -4;

/**
 * Armenian (`hy`) — «Գնել հիմա» pill slightly smaller than default mobile CTA.
 */
export const HERO_MOBILE_SLATE_CTA_HY_WIDTH_PX = 168;
export const HERO_MOBILE_SLATE_CTA_HY_HEIGHT_PX = 46;
export const HERO_MOBILE_SLATE_CTA_HY_ICON_CIRCLE_PX = 36;
export const HERO_MOBILE_SLATE_CTA_HY_PILL_RADIUS_PX = HERO_MOBILE_SLATE_CTA_HY_HEIGHT_PX / 2;
export const HERO_MOBILE_SLATE_CTA_HY_PADDING_LEFT_PX = 28;
export const HERO_MOBILE_SLATE_CTA_HY_ARROW_ICON_PX = 18;

/** Armenian — shift black arrow chip left vs default placement (px, negative = left). */
export const HERO_MOBILE_SLATE_CTA_HY_ICON_NUDGE_X_PX = -5;

/**
 * Negative margin on the arrow chip — pulls the black circle toward the label.
 */
export const HERO_MOBILE_SLATE_CTA_ICON_PULL_LEFT_PX = 2;
/** Whole CTA row — nudge vs slate panel (`HomePromoMobileHeroSlateCta` wrapper). */
export const HERO_MOBILE_SLATE_CTA_NUDGE_RIGHT_PX = 10;
/** Positive — shift whole button up (px); applied as `translateY(-n)`. */
export const HERO_MOBILE_SLATE_CTA_NUDGE_UP_PX = 5;

/**
 * Figma 314:2385 `Group 9209` — chair + floor graphic; height includes shadow.
 * Dev: `height` 183.5873260498047 (metadata).
 */
export const HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX = 183.5873260498047;

/**
 * Figma 314:2386 — mobile hero chair (`863-removebg-preview 1`); raster {@link HERO_PROMO_CHAIR_IMAGE_SRC}.
 * Dev frame `w`×`h` 244×176.631103515625; image crop `h` 138.14%, `top` −38.05% (same as export).
 */
export const HERO_MOBILE_CHAIR_FRAME_WIDTH_PX = 244;
export const HERO_MOBILE_CHAIR_FRAME_HEIGHT_PX = 176.631103515625;
export const HERO_MOBILE_CHAIR_LEFT_FRAC = 6 / HERO_MOBILE_FIGMA_FRAME_WIDTH_PX;
/** Shift whole chair group left (px) — `translateX(-n)` on mobile hero. */
export const HERO_MOBILE_CHAIR_GROUP_NUDGE_LEFT_PX = 0;
/** Positive — shift whole chair + floor group up (px); subtracted in `translateY(down - up)`. */
export const HERO_MOBILE_CHAIR_GROUP_NUDGE_UP_PX = 0;
/** Positive — shift whole chair + floor group down (px); added in `translateY(down - up)`. */
export const HERO_MOBILE_CHAIR_GROUP_NUDGE_DOWN_PX = 6;
/** Slight scale — “closer” look; paired with bottom `transform-origin` on the group. */
export const HERO_MOBILE_CHAIR_GROUP_SCALE = 1.06;
export const HERO_MOBILE_CHAIR_IMAGE_HEIGHT_PCT = 138.14;
export const HERO_MOBILE_CHAIR_IMAGE_TOP_PCT = -38.05;

/**
 * Figma 314:2387 `Group 3` — floor ellipse under chair; asset {@link HERO_PROMO_CHAIR_SHADOW_IMAGE_SRC}.
 * Positions relative to `Group 9209` (origin 6,227 page; shadow vs group top-left).
 */
export const HERO_MOBILE_FLOOR_SHADOW_LEFT_FRAC =
  (43.36433410644531 - 6) / HERO_MOBILE_CHAIR_FRAME_WIDTH_PX;
export const HERO_MOBILE_FLOOR_SHADOW_TOP_FRAC =
  (341.35731506347656 - 227) / HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX;
export const HERO_MOBILE_FLOOR_SHADOW_WIDTH_FRAC =
  169.28050231933594 / HERO_MOBILE_CHAIR_FRAME_WIDTH_PX;
export const HERO_MOBILE_FLOOR_SHADOW_HEIGHT_FRAC =
  69.23001098632812 / HERO_MOBILE_CHAIR_GROUP_HEIGHT_PX;

/**
 * Horizontal nudge for floor ellipse + arc knob (px); positive = right, negative = left.
 * Does not move the chair raster.
 */
export const HERO_MOBILE_FLOOR_ARC_GROUP_NUDGE_RIGHT_PX = -2;

/**
 * Vertical nudge for floor ellipse + arc (px); positive = down, negative = up.
 */
export const HERO_MOBILE_FLOOR_ARC_GROUP_NUDGE_DOWN_PX = -2;

/** Uniform scale for floor ellipse + knob; applied with bottom-centered `transform-origin` on mobile hero. */
export const HERO_MOBILE_FLOOR_ARC_GROUP_SCALE = 1.06;

/**
 * Figma 314:2390 `Ellipse 4` — knob on the floor arc; same asset as {@link HERO_PROMO_SLIDER_HANDLE_IMAGE_SRC}.
 * Width vs floor shadow; placed bottom-center on shadow (midpoint of arc).
 */
export const HERO_MOBILE_FLOOR_ARC_KNOB_WIDTH_FRAC =
  15.674118041992188 / 169.28050231933594;
/** Positive — shift knob down vs shadow bottom (`bottom: -n px`). */
export const HERO_MOBILE_FLOOR_ARC_KNOB_NUDGE_DOWN_PX = 6;

/** Hero headline box — design size (px); mirrored in `HomePromoYellowHeadline` Tailwind classes */
export const HERO_HEADLINE_MAX_WIDTH_PX = 580;
export const HERO_HEADLINE_HEIGHT_PX = 60;

/** Fine vertical nudge for the yellow headline block (CSS px; positive moves down). */
export const HERO_YELLOW_HEADLINE_TRANSLATE_Y_PX = 2;

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

/**
 * Desktop hero composition width (Figma / `max-w-7xl`). Entire md+ promo block is laid out in
 * this width and scaled with one `zoom` so inner cards stay pixel-locked like 100% desktop.
 */
export const HERO_DESKTOP_COMPOSITION_WIDTH_PX = 1280;
