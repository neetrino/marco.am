'use client';

import Image from 'next/image';
import { CashPaymentIcon } from './CashPaymentIcon';
import { shouldBypassNextImageOptimizer } from '@/lib/utils/should-bypass-next-image-optimizer';
import type { PaymentMethod } from '../utils/payment-methods';

interface PaymentMethodOptionGraphicProps {
  method: PaymentMethod;
  hasLogoError: boolean;
  onLogoError: () => void;
}

const logoCellClass =
  'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]';

export function PaymentMethodOptionGraphic({
  method,
  hasLogoError,
  onLogoError,
}: PaymentMethodOptionGraphicProps) {
  if (method.id === 'cash') {
    return (
      <div className={logoCellClass}>
        <CashPaymentIcon className="h-9 w-9 text-emerald-600" />
      </div>
    );
  }

  if (hasLogoError || method.logos.length === 0) {
    return (
      <div className={logoCellClass}>
        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
    );
  }

  if (method.logos.length === 1) {
    return (
      <div className={logoCellClass}>
        <Image
          src={method.logos[0]}
          alt={method.name}
          width={52}
          height={40}
          className="max-h-10 max-w-[3.25rem] object-contain p-1"
          loading="lazy"
          unoptimized={shouldBypassNextImageOptimizer(method.logos[0])}
          onError={onLogoError}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {method.logos.map((src) => (
        <div key={src} className={logoCellClass}>
          <Image
            src={src}
            alt=""
            width={40}
            height={36}
            className="max-h-9 max-w-[2.5rem] object-contain p-1"
            loading="lazy"
            unoptimized={shouldBypassNextImageOptimizer(src)}
            onError={onLogoError}
          />
        </div>
      ))}
    </div>
  );
}
