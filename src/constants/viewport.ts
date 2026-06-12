import type { Viewport } from 'next';

/** Prevents pinch-zoom and iOS input-focus zoom on mobile viewports. */
export const APP_VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
