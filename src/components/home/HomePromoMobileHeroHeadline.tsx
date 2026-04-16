'use client';

import {
  HERO_MOBILE_HEADLINE_FONT_SIZE_PX,
  HERO_MOBILE_HEADLINE_LINE_HEIGHT_PX,
} from '../hero.constants';
import { useTranslation } from '../../lib/i18n-client';

type HomePromoMobileHeroHeadlineProps = {
  emphasisText: string;
  accentText: string;
};

const mobileHeadlineTypography = {
  fontSize: `${HERO_MOBILE_HEADLINE_FONT_SIZE_PX}px`,
  lineHeight: `${HERO_MOBILE_HEADLINE_LINE_HEIGHT_PX}px`,
} as const;

const mobileHeadlineTypographyRu = {
  fontSize: `${HERO_MOBILE_HEADLINE_FONT_SIZE_PX - 4}px`,
  lineHeight: `${HERO_MOBILE_HEADLINE_LINE_HEIGHT_PX - 4}px`,
} as const;

const mobileHeadlineTypographyEn = {
  fontSize: `${HERO_MOBILE_HEADLINE_FONT_SIZE_PX + 2}px`,
  lineHeight: `${HERO_MOBILE_HEADLINE_LINE_HEIGHT_PX + 2}px`,
} as const;

/** MARCO — Figma 314:2400: black + white two-word headline on mobile hero only. */
export function HomePromoMobileHeroHeadline({
  emphasisText,
  accentText,
}: HomePromoMobileHeroHeadlineProps) {
  const { lang } = useTranslation();
  const headlineTypography =
    lang === 'ru'
      ? mobileHeadlineTypographyRu
      : lang === 'en'
        ? mobileHeadlineTypographyEn
        : mobileHeadlineTypography;

  if (lang === 'ru') {
    return (
      <div className="pointer-events-none box-border -translate-y-3 flex w-full max-w-full min-w-0 flex-col items-stretch">
        <p
          className="mb-0 w-full text-left font-black tracking-tight text-marco-black"
          style={headlineTypography}
        >
          {emphasisText}
        </p>
        <p
          className="mb-0 w-full text-right font-black tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.14)]"
          style={headlineTypography}
        >
          {accentText}
        </p>
      </div>
    );
  }

  return (
    <p
      className="pointer-events-none box-border flex w-full max-w-full min-w-0 flex-row flex-nowrap items-baseline justify-center font-black tracking-tight sm:gap-x-1.5"
      style={{ columnGap: lang === 'en' ? '0.55rem' : '0.25rem' }}
    >
      <span className="shrink-0 text-marco-black" style={headlineTypography}>
        {emphasisText}
      </span>
      <span
        className="shrink-0 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.14)]"
        style={headlineTypography}
      >
        {accentText}
      </span>
    </p>
  );
}
