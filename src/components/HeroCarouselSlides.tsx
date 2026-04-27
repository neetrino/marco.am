import Image from 'next/image';
import { shouldBypassNextImageOptimizer } from '../lib/utils/should-bypass-next-image-optimizer';
import { HERO_PRIMARY_IMAGE_SRC } from './hero.constants';

export function HeroCarouselSlides() {
  return (
    <div className="absolute inset-0 box-border min-w-0">
      <div className="absolute inset-0 box-border min-w-0">
        {/* Desktop / tablet — existing vertical brick asset */}
        <Image
          src={HERO_PRIMARY_IMAGE_SRC}
          alt=""
          fill
          unoptimized={shouldBypassNextImageOptimizer(HERO_PRIMARY_IMAGE_SRC)}
          className="hidden object-cover object-top md:block"
          sizes="(max-width: 1280px) 100vw, min(100vw, 1280px)"
        />
      </div>
    </div>
  );
}
