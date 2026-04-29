'use client';

import { CHECKOUT_ARCA_CARD_LOGOS } from '../utils/checkout-payment-logos';

const sizeClasses = {
  small: 'gap-1 [&_.pm-logo-cell]:h-9 [&_.pm-logo-cell]:w-9 [&_img]:max-h-6 [&_img]:max-w-[1.75rem]',
  medium: 'gap-2 [&_.pm-logo-cell]:h-11 [&_.pm-logo-cell]:w-11 [&_img]:max-h-7 [&_img]:max-w-[2.25rem]',
  large: 'gap-2 [&_.pm-logo-cell]:h-14 [&_.pm-logo-cell]:w-14 [&_img]:max-h-9 [&_img]:max-w-[2.5rem]',
};

const cellClass =
  'pm-logo-cell flex flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]';

interface PaymentMethodLogoProps {
  size?: 'small' | 'medium' | 'large';
}

/** ArCa, Mastercard, and Visa marks (one cell each) for the bank-card payment step. */
export function PaymentMethodLogo({ size = 'medium' }: PaymentMethodLogoProps) {
  return (
    <div className={`flex flex-shrink-0 items-center ${sizeClasses[size]}`} aria-hidden>
      {CHECKOUT_ARCA_CARD_LOGOS.map((src) => (
        <div key={src} className={cellClass}>
          <img src={src} alt="" className="object-contain p-1" />
        </div>
      ))}
    </div>
  );
}
