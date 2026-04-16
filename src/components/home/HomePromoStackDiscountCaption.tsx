'use client';

import { Montserrat } from 'next/font/google';
import { useTranslation } from '../../lib/i18n-client';
import {
  HERO_PROMO_STACK_DISCOUNT_CAPTION_FONT_SIZE_PX,
  HERO_PROMO_STACK_DISCOUNT_CAPTION_LINE_HEIGHT_PX,
  HERO_PROMO_STACK_DISCOUNT_CAPTION_MARGIN_LEFT_PX,
  HERO_PROMO_STACK_DISCOUNT_CAPTION_NUDGE_RIGHT_PX,
  HERO_PROMO_STACK_DISCOUNT_CAPTION_NUDGE_UP_PX,
} from './hero-promo-stack.constants';

/** Montserrat SemiBold (600) — matches Figma "Montserrat arm"; subsets per `next/font` supported list. */
const montserratDiscountCaption = Montserrat({
  weight: '600',
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
});

/** Three-line promo under gray + blue stack layers — white text, line breaks per copy. */
export function HomePromoStackDiscountCaption() {
  const { t } = useTranslation();

  return (
    <div
      className={`pointer-events-none -mt-2 w-full max-w-full pr-1 text-left not-italic text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] sm:-mt-3 [&_p]:mb-0 ${montserratDiscountCaption.className}`}
      style={{
        marginLeft: `${
          HERO_PROMO_STACK_DISCOUNT_CAPTION_MARGIN_LEFT_PX +
          HERO_PROMO_STACK_DISCOUNT_CAPTION_NUDGE_RIGHT_PX
        }px`,
        transform: `translateY(-${HERO_PROMO_STACK_DISCOUNT_CAPTION_NUDGE_UP_PX}px)`,
        fontSize: HERO_PROMO_STACK_DISCOUNT_CAPTION_FONT_SIZE_PX,
        lineHeight: `${HERO_PROMO_STACK_DISCOUNT_CAPTION_LINE_HEIGHT_PX}px`,
      }}
    >
      <p>{t('home.promo_stack_discount_line1')}</p>
      <p>{t('home.promo_stack_discount_line2')}</p>
      <p>{t('home.promo_stack_discount_line3')}</p>
    </div>
  );
}
