'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Terms of Service page — content from locale files (en / hy / ru).
 */
export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-6 sm:p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{t('terms.title')}</h1>
          <p className="text-gray-600">
            {t('terms.lastUpdated')}{' '}
            {new Date().toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.agreementToTerms.title')}</h2>
          <p className="text-gray-600">{t('terms.agreementToTerms.description1')}</p>
          <p className="text-gray-600">{t('terms.agreementToTerms.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.useLicense.title')}</h2>
          <p className="text-gray-600">{t('terms.useLicense.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.useLicense.restrictions.modify')}</li>
            <li>{t('terms.useLicense.restrictions.commercial')}</li>
            <li>{t('terms.useLicense.restrictions.reverse')}</li>
            <li>{t('terms.useLicense.restrictions.copyright')}</li>
            <li>{t('terms.useLicense.restrictions.transfer')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.accountRegistration.title')}</h2>
          <p className="text-gray-600">{t('terms.accountRegistration.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.accountRegistration.requirements.accurate')}</li>
            <li>{t('terms.accountRegistration.requirements.maintain')}</li>
            <li>{t('terms.accountRegistration.requirements.security')}</li>
            <li>{t('terms.accountRegistration.requirements.responsibility')}</li>
            <li>{t('terms.accountRegistration.requirements.notify')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.productInformation.title')}</h2>
          <p className="text-gray-600">{t('terms.productInformation.description1')}</p>
          <p className="text-gray-600">{t('terms.productInformation.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.pricingAndPayment.title')}</h2>
          <p className="text-gray-600">{t('terms.pricingAndPayment.description1')}</p>
          <p className="text-gray-600">{t('terms.pricingAndPayment.description2')}</p>
          <p className="text-gray-600">{t('terms.pricingAndPayment.description3')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.shippingAndDelivery.title')}</h2>
          <p className="text-gray-600">{t('terms.shippingAndDelivery.description1')}</p>
          <p className="text-gray-600">{t('terms.shippingAndDelivery.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.returnsAndRefunds.title')}</h2>
          <p className="text-gray-600">{t('terms.returnsAndRefunds.description1')}</p>
          <p className="text-gray-600">{t('terms.returnsAndRefunds.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.prohibitedUses.title')}</h2>
          <p className="text-gray-600">{t('terms.prohibitedUses.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('terms.prohibitedUses.items.violate')}</li>
            <li>{t('terms.prohibitedUses.items.transmit')}</li>
            <li>{t('terms.prohibitedUses.items.impersonate')}</li>
            <li>{t('terms.prohibitedUses.items.infringe')}</li>
            <li>{t('terms.prohibitedUses.items.automated')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.limitationOfLiability.title')}</h2>
          <p className="text-gray-600">{t('terms.limitationOfLiability.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.revisionsAndErrata.title')}</h2>
          <p className="text-gray-600">{t('terms.revisionsAndErrata.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.governingLaw.title')}</h2>
          <p className="text-gray-600">{t('terms.governingLaw.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('terms.contactInformation.title')}</h2>
          <p className="text-gray-600">
            {t('terms.contactInformation.description')}{' '}
            <a href="mailto:marcofurniture@mail.ru" className="text-blue-600 hover:underline">
              marcofurniture@mail.ru
            </a>
          </p>
        </section>
      </Card>
    </div>
  );
}
