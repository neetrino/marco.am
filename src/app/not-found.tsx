'use client';

import Link from 'next/link';
import { useTranslation } from '../lib/i18n-client';

/**
 * Custom 404 Not Found Page
 * 
 * This page is displayed when a route is not found.
 * Client component - automatically dynamic, no prerendering needed.
 */
export default function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4 -mt-[106px] md:-mt-[138px] text-black">
        <h1 className="text-8xl md:text-9xl font-bold text-black mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-black mb-4">{t('common.notFound.title')}</h2>
        <p className="text-black mb-8 max-w-md mx-auto">
          {t('common.notFound.description')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition-colors font-medium"
          >
            {t('common.notFound.goHome')}
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
          >
            {t('common.buttons.browseProducts')}
          </Link>
        </div>
      </div>
    </div>
  );
}
