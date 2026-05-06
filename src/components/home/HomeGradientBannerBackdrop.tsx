'use client';

import { useLayoutEffect, useRef } from 'react';

import {
  HOME_GRADIENT_BANNER_IMAGE_PATH,
  HOME_GRADIENT_BANNER_SURFACE_BASE_HEX,
} from './home-gradient-banner.constants';

type HomeGradientBannerBackdropProps = {
  readonly className?: string;
  readonly imageUrl?: string;
};

/**
 * Applies the slate banner raster via `background-*` in `useLayoutEffect` so layout is committed
 * before the browser paints (avoids late-discovered CSS background flashes vs streaming markup).
 */
export function HomeGradientBannerBackdrop({
  className,
  imageUrl = HOME_GRADIENT_BANNER_IMAGE_PATH,
}: HomeGradientBannerBackdropProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    node.style.backgroundColor = HOME_GRADIENT_BANNER_SURFACE_BASE_HEX;
    node.style.backgroundImage = `url("${imageUrl}")`;
    node.style.backgroundSize = 'cover';
    node.style.backgroundPosition = 'center';
    node.style.backgroundRepeat = 'no-repeat';
  }, [imageUrl]);

  return <div ref={ref} className={className} aria-hidden />;
}
