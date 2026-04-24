'use client';

import Link from 'next/link';
import { CartIcon } from '../../components/icons/CartIcon';

interface EmptyCartProps {
  t: (key: string) => string;
}

export function EmptyCart({ t }: EmptyCartProps) {
  return (
    <div className="marco-header-container py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('common.cart.title')}</h1>
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="mx-auto mb-4 flex justify-center text-gray-400" aria-hidden>
            <CartIcon size={96} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('common.cart.empty')}
          </h2>
          <Link
            href="/products"
            className="mt-6 inline-flex h-10 w-auto items-center justify-center self-center rounded-[999px] bg-marco-yellow px-6 text-sm font-medium text-marco-black transition-[filter,opacity] hover:brightness-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-yellow/60"
          >
            {t('common.buttons.browseProducts')}
          </Link>
        </div>
      </div>
    </div>
  );
}
