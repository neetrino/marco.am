'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Refund Policy page — content from locale files (en / hy / ru).
 */
export default function RefundPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-6 sm:p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{t('refund-policy.title')}</h1>
          <p className="text-gray-600">
            {t('refund-policy.lastUpdated')}{' '}
            {new Date().toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('refund-policy.overview.title')}</h2>
          <p className="text-gray-600">{t('refund-policy.overview.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('refund-policy.eligibility.title')}</h2>
          <p className="text-gray-600">{t('refund-policy.eligibility.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('refund-policy.eligibility.items.condition')}</li>
            <li>{t('refund-policy.eligibility.items.timeline')}</li>
            <li>{t('refund-policy.eligibility.items.proof')}</li>
            <li>{t('refund-policy.eligibility.items.excluded')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('refund-policy.howToInitiate.title')}</h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('refund-policy.howToInitiate.steps.contact')}</li>
            <li>{t('refund-policy.howToInitiate.steps.authorization')}</li>
            <li>{t('refund-policy.howToInitiate.steps.ship')}</li>
          </ol>
          <p className="text-gray-600">{t('refund-policy.howToInitiate.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('refund-policy.refundMethod.title')}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('refund-policy.refundMethod.items.method')}</li>
            <li>{t('refund-policy.refundMethod.items.timing')}</li>
            <li>{t('refund-policy.refundMethod.items.shipping')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('refund-policy.nonRefundable.title')}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('refund-policy.nonRefundable.items.giftCards')}</li>
            <li>{t('refund-policy.nonRefundable.items.personalized')}</li>
            <li>{t('refund-policy.nonRefundable.items.unauthorized')}</li>
            <li>{t('refund-policy.nonRefundable.items.condition')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('refund-policy.contact.title')}</h2>
          <p className="text-gray-600">
            {t('refund-policy.contact.description')}{' '}
            <a href="mailto:marcofurniture@mail.ru" className="text-blue-600 hover:underline">
              marcofurniture@mail.ru
            </a>
          </p>
        </section>
      </Card>
    </div>
  );
}
