'use client';

import Image from 'next/image';

import { useTranslation } from '../lib/i18n-client';
import {
  FOOTER_PAYMENT_STRIP_COMPACT_IMAGE_MAX_CLASS,
  FOOTER_PAYMENT_STRIP_COMPACT_MAX_WIDTH_CLASS,
  FOOTER_PAYMENT_STRIP_HEIGHT_PX,
  FOOTER_PAYMENT_STRIP_SRC,
  FOOTER_PAYMENT_STRIP_WIDTH_PX,
} from './footer-payment-logos.constants';

type FooterPaymentLogosProps = {
  compact?: boolean;
};

/**
 * Payment marks — single raster from Figma (Visa, Mastercard, ArCa, Idram).
 */
export function FooterPaymentLogos({ compact = false }: FooterPaymentLogosProps) {
  const { t } = useTranslation();

  const containerClass = compact
    ? `flex w-full justify-end ${FOOTER_PAYMENT_STRIP_COMPACT_MAX_WIDTH_CLASS}`
    : 'flex w-full max-w-44 justify-end sm:max-w-48';

  const imageClass = compact
    ? `h-auto w-full object-contain object-right ${FOOTER_PAYMENT_STRIP_COMPACT_IMAGE_MAX_CLASS}`
    : 'h-auto w-full max-h-5 object-contain object-right sm:max-h-6';

  return (
    <div className={containerClass} aria-label={t('common.footer.paymentMethods')}>
      <Image
        src={FOOTER_PAYMENT_STRIP_SRC}
        alt=""
        width={FOOTER_PAYMENT_STRIP_WIDTH_PX}
        height={FOOTER_PAYMENT_STRIP_HEIGHT_PX}
        className={imageClass}
        sizes={compact ? '(max-width: 640px) 100vw, 160px' : '(max-width: 640px) 100vw, 192px'}
      />
    </div>
  );
}
