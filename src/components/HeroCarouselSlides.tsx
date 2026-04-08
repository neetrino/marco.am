import Image from 'next/image';
import { HERO_PRIMARY_IMAGE_SRC } from './hero.constants';

export function HeroCarouselSlides() {
  return (
    <div className="relative box-border h-full min-h-[inherit] w-full">
      <div className="absolute inset-0 box-border bg-marco-yellow">
        <Image
          src={HERO_PRIMARY_IMAGE_SRC}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </div>
    </div>
  );
}
