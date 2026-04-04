'use client';

import { FigmaSamsungCard } from '../ProductCard/FigmaSamsungCard';
import { MarcoCompactFigmaCard } from './MarcoCompactFigmaCard';
import { MarcoSlideDots } from './MarcoSlideDots';
import { MARCO_SPECIAL_ROW } from './marcoHomeAssets';

type MarcoSpecialOffersRowProps = {
  className?: string;
};

/**
 * Ряд из 4 карточек — Figma Frame 254 / SPECIAL (node 101:3471).
 */
export function MarcoSpecialOffersRow({ className = '' }: MarcoSpecialOffersRowProps) {
  return (
    <div
      className={`relative h-[486px] w-[1543.671px] font-montserrat-arm ${className}`}
      data-node-id="101:3471"
    >
      <FigmaSamsungCard className="left-0" />

      <MarcoCompactFigmaCard
        className="left-[412.42px]"
        brand="Apple"
        brandColor="#0f0f0f"
        title='MacBook Air 13" M3 Chip 8GB 256GB - Silver'
        price="499,000 ֏"
        ratingCount="(108)"
        imageSrc={MARCO_SPECIAL_ROW.product2img}
      />

      <MarcoCompactFigmaCard
        className="left-[824.84px]"
        brand="Bosch"
        brandColor="#af1b1b"
        title="Automatic Coffee Machine VeroCup 100"
        price="189,000 ֏"
        ratingCount="(15)"
        imageSrc={MARCO_SPECIAL_ROW.product3img}
      />

      <MarcoCompactFigmaCard
        className="left-[1237.25px]"
        brand="LG"
        brandColor="#d51212"
        title='OLED C3 55" 4K Smart TV Cinema HDR'
        price="680,000 ֏"
        ratingCount="(89)"
        imageSrc={MARCO_SPECIAL_ROW.product4img}
      />

      <MarcoSlideDots />
    </div>
  );
}
