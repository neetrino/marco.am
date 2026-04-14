'use client';

import Image from 'next/image';

import { useTranslation } from '../lib/i18n-client';

/**
 * Payment marks row — ArCa & Idram from local SVGs; Visa/Mastercard wordmarks (Figma 101:2835).
 */
export function FooterPaymentLogos() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2 sm:gap-3"
      aria-label={t('common.footer.paymentMethods')}
    >
      <div className="flex h-9 min-w-[52px] items-center justify-center rounded bg-white px-2 shadow-sm">
        <span className="font-sans text-[11px] font-bold italic tracking-tight text-[#1a1f71]">VISA</span>
      </div>
      <div className="flex h-9 min-w-[72px] items-center justify-center gap-1 rounded bg-white px-2 shadow-sm">
        <span className="relative h-3 w-5">
          <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#eb001b]" />
          <span className="absolute left-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#f79e1b]" />
        </span>
        <span className="text-[8px] font-semibold leading-none text-marco-black">Mastercard</span>
      </div>
      <div className="flex h-9 w-[52px] items-center justify-center overflow-hidden rounded bg-white px-1 shadow-sm">
        <Image src="/assets/payments/arca.svg" alt="ArCa" width={48} height={28} className="h-7 w-auto object-contain" />
      </div>
      <div className="flex h-9 w-[52px] items-center justify-center overflow-hidden rounded bg-white px-1 shadow-sm">
        <Image src="/assets/payments/idram.svg" alt="Idram" width={48} height={28} className="h-7 w-auto object-contain" />
      </div>
    </div>
  );
}
