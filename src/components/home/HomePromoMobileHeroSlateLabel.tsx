'use client';

import { Montserrat } from 'next/font/google';
import type { CSSProperties } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_MOBILE_SLATE_LABEL_FONT_SIZE_PX,
  HERO_MOBILE_SLATE_LABEL_LEFT_FRAC,
  HERO_MOBILE_SLATE_LABEL_LINE_HEIGHT_PX,
  HERO_MOBILE_SLATE_LABEL_MAX_WIDTH_FRAC,
  HERO_MOBILE_SLATE_LABEL_TOP_FRAC,
  HERO_MOBILE_SLATE_PANEL_BOX_STYLE,
} from '../hero.constants';

const montserratSlateLabel = Montserrat({
  weight: '400',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

const slateLabelInnerStyle: CSSProperties = {
  left: `${HERO_MOBILE_SLATE_LABEL_LEFT_FRAC * 100}%`,
  top: `${HERO_MOBILE_SLATE_LABEL_TOP_FRAC * 100}%`,
  width: `${HERO_MOBILE_SLATE_LABEL_MAX_WIDTH_FRAC * 100}%`,
  fontSize: HERO_MOBILE_SLATE_LABEL_FONT_SIZE_PX,
  lineHeight: `${HERO_MOBILE_SLATE_LABEL_LINE_HEIGHT_PX}px`,
};

/**
 * Figma 314:2399 — three-line white label (Montserrat Regular; size from {@link HERO_MOBILE_SLATE_LABEL_FONT_SIZE_PX}) on mobile slate.
 */
export function HomePromoMobileHeroSlateLabel() {
  const { t } = useTranslation();

  return (
    <div
      className={`pointer-events-none absolute z-[10] box-border md:hidden ${montserratSlateLabel.className}`}
      style={{
        ...HERO_MOBILE_SLATE_PANEL_BOX_STYLE,
      }}
    >
      <div
        className="absolute flex flex-col justify-center leading-[0] not-italic text-white"
        style={slateLabelInnerStyle}
      >
        <p className="mb-0">{t('home.promo_mobile_slate_label_line1')}</p>
        <p className="mb-0">{t('home.promo_mobile_slate_label_line2')}</p>
        <p className="mb-0">{t('home.promo_mobile_slate_label_line3')}</p>
      </div>
    </div>
  );
}
