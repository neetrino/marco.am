/** Storefront branch photos — served from R2 via `/assets/stores/*` rewrite. */
export const STORE_LOCATION_IMAGE_SIZE = {
  width: 1024,
  height: 1024,
} as const;

export const ALEC_MANOOGIAN_STORE_IMAGE = {
  src: '/assets/stores/alec-manoogian.webp',
  ...STORE_LOCATION_IMAGE_SIZE,
} as const;

export const AVAN_STORE_IMAGE = {
  src: '/assets/stores/avan.webp',
  ...STORE_LOCATION_IMAGE_SIZE,
} as const;

export const PARAKAR_STORE_IMAGE = {
  src: '/assets/stores/parakar.webp',
  ...STORE_LOCATION_IMAGE_SIZE,
} as const;
