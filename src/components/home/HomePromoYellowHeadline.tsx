'use client';

import { HERO_YELLOW_HEADLINE_TRANSLATE_Y_PX } from '../hero.constants';

type HomePromoYellowHeadlineProps = {
  emphasisText: string;
  accentText: string;
};

/**
 * MARCO — Figma 101:4074. Used only in desktop hero (`md+`); composition is scaled as one unit via
 * parent `zoom`, so typography stays fixed desktop sizes.
 */
export function HomePromoYellowHeadline({ emphasisText, accentText }: HomePromoYellowHeadlineProps) {
  return (
    <p
      className="pointer-events-none mb-8 box-border flex w-full max-w-[580px] flex-wrap items-center gap-x-2.5 font-black tracking-tight md:min-h-[60px]"
      style={{ transform: `translateY(${HERO_YELLOW_HEADLINE_TRANSLATE_Y_PX}px)` }}
    >
      <span className="text-[50px] leading-[60px] text-marco-black">
        {emphasisText}
      </span>
      <span className="text-[54px] leading-[60px] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.14)]">
        {accentText}
      </span>
    </p>
  );
}
