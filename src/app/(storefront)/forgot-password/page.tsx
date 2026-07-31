'use client';

import Link from 'next/link';
import { Card } from '@shop/ui';
import { useTranslation } from '@/lib/i18n-client';

const CONTACT_BUTTON_CLASS =
  'inline-flex justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-900 w-full sm:w-auto';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('login.forgotPasswordPage.title')}</h1>
        <p className="text-gray-600 mb-8">{t('login.forgotPasswordPage.body')}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Link href="/contact" className={CONTACT_BUTTON_CLASS}>
            {t('login.forgotPasswordPage.contactCta')}
          </Link>
          <Link
            href="/login"
            className="text-sm text-center sm:text-left text-gray-600 hover:text-gray-900"
          >
            {t('login.forgotPasswordPage.backToLogin')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
