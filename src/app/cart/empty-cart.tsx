'use client';

import Link from 'next/link';
import { Button } from '@shop/ui';
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
          <Link href="/products">
            <Button variant="primary" size="lg" className="mt-6">
              {t('common.buttons.browseProducts')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}




