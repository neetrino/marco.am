'use client';

import { Card } from '@shop/ui';

import { t } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-client';
import { formatLegalPageDate } from '@/lib/legal-page-date';

/**
 * Terms of Service page — static shell prerendered in the default language;
 * localized client-side from bundled locale files (en / hy / ru).
 */
export default function TermsPage() {
  const { lang } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-6 sm:p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{t(lang, 'terms.title')}</h1>
          <p className="text-gray-600" suppressHydrationWarning>
            {t(lang, 'terms.lastUpdated')} {formatLegalPageDate()}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.agreementToTerms.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.agreementToTerms.description1')}</p>
          <p className="text-gray-600">{t(lang, 'terms.agreementToTerms.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.useLicense.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.useLicense.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t(lang, 'terms.useLicense.restrictions.modify')}</li>
            <li>{t(lang, 'terms.useLicense.restrictions.commercial')}</li>
            <li>{t(lang, 'terms.useLicense.restrictions.reverse')}</li>
            <li>{t(lang, 'terms.useLicense.restrictions.copyright')}</li>
            <li>{t(lang, 'terms.useLicense.restrictions.transfer')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.accountRegistration.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.accountRegistration.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t(lang, 'terms.accountRegistration.requirements.accurate')}</li>
            <li>{t(lang, 'terms.accountRegistration.requirements.maintain')}</li>
            <li>{t(lang, 'terms.accountRegistration.requirements.security')}</li>
            <li>{t(lang, 'terms.accountRegistration.requirements.responsibility')}</li>
            <li>{t(lang, 'terms.accountRegistration.requirements.notify')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.productInformation.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.productInformation.description1')}</p>
          <p className="text-gray-600">{t(lang, 'terms.productInformation.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.pricingAndPayment.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.pricingAndPayment.description1')}</p>
          <p className="text-gray-600">{t(lang, 'terms.pricingAndPayment.description2')}</p>
          <p className="text-gray-600">{t(lang, 'terms.pricingAndPayment.description3')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.shippingAndDelivery.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.shippingAndDelivery.description1')}</p>
          <p className="text-gray-600">{t(lang, 'terms.shippingAndDelivery.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.returnsAndRefunds.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.returnsAndRefunds.description1')}</p>
          <p className="text-gray-600">{t(lang, 'terms.returnsAndRefunds.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.prohibitedUses.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.prohibitedUses.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t(lang, 'terms.prohibitedUses.items.violate')}</li>
            <li>{t(lang, 'terms.prohibitedUses.items.transmit')}</li>
            <li>{t(lang, 'terms.prohibitedUses.items.impersonate')}</li>
            <li>{t(lang, 'terms.prohibitedUses.items.infringe')}</li>
            <li>{t(lang, 'terms.prohibitedUses.items.automated')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.limitationOfLiability.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.limitationOfLiability.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.revisionsAndErrata.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.revisionsAndErrata.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.governingLaw.title')}</h2>
          <p className="text-gray-600">{t(lang, 'terms.governingLaw.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'terms.contactInformation.title')}</h2>
          <p className="text-gray-600">
            {t(lang, 'terms.contactInformation.description')}{' '}
            <a href="mailto:marcofurniture@mail.ru" className="text-blue-600 hover:underline">
              marcofurniture@mail.ru
            </a>
          </p>
        </section>
      </Card>
    </div>
  );
}
