'use client';

import { useId } from 'react';

import {
  SPECIAL_OFFERS_CART_FIGMA_ICON_HEIGHT_PX,
  SPECIAL_OFFERS_CART_FIGMA_ICON_WIDTH_PX,
} from './home-special-offers.constants';

/** Solid yellow circle fill for the add-to-cart control (no stroke). */
export function SpecialOfferCartFigmaCircle() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 block h-full w-full"
      viewBox="0 0 104 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="52" cy="52" r="52" fill="#FFCA03" />
    </svg>
  );
}

const CART_PLUS_PATH =
  'M14.4928 9.90476H12.0773V6.19048H8.45411V3.71429H12.0773V0H14.4928V3.71429H18.1159V6.19048H14.4928V9.90476ZM7.24638 26C6.58078 26 6.01181 25.7579 5.53945 25.2737C5.0671 24.7894 4.83092 24.2061 4.83092 23.5238C4.83092 22.8415 5.0671 22.2582 5.53945 21.774C6.01181 21.2897 6.58078 21.0476 7.24638 21.0476C7.91197 21.0476 8.48094 21.2897 8.9533 21.774C9.42566 22.2582 9.66184 22.8415 9.66184 23.5238C9.66184 24.2061 9.42566 24.7894 8.9533 25.2737C8.48094 25.7579 7.91197 26 7.24638 26ZM19.3237 26C18.6581 26 18.0891 25.7579 17.6167 25.2737C17.1444 24.7894 16.9082 24.2061 16.9082 23.5238C16.9082 22.8415 17.1444 22.2582 17.6167 21.774C18.0891 21.2897 18.6581 21.0476 19.3237 21.0476C19.9893 21.0476 20.5582 21.2897 21.0306 21.774C21.503 22.2582 21.7391 22.8415 21.7391 23.5238C21.7391 24.2061 21.503 24.7894 21.0306 25.2737C20.5582 25.7579 19.9893 26 19.3237 26ZM2.41546 3.71429H0V1.2381H3.96135L9.08213 12.381H17.5362L22.2544 3.71429H24.9919L19.6779 13.553C19.4632 13.9712 19.168 14.2904 18.7923 14.5105C18.4165 14.7416 18.0086 14.8571 17.5684 14.8571H8.58293L7.24638 17.3333H21.7391V19.8095H7.24638C6.34461 19.8095 5.65754 19.4078 5.18519 18.6044C4.70209 17.8011 4.68599 16.9867 5.13688 16.1613L6.76328 13.1238L2.41546 3.71429Z';

/** Figma node 101:3553 — white cart + icon inside the circle. */
export function SpecialOfferCartFigmaIcon() {
  const clipId = useId().replace(/:/g, '');

  return (
    <svg
      className="relative z-10 block shrink-0"
      style={{
        width: SPECIAL_OFFERS_CART_FIGMA_ICON_WIDTH_PX,
        height: SPECIAL_OFFERS_CART_FIGMA_ICON_HEIGHT_PX,
      }}
      viewBox="0 0 25 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <path fill="white" d={CART_PLUS_PATH} />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="25" height="26" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
