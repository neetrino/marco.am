'use client';

import Link from 'next/link';
import { Card } from '@shop/ui';

import { t } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-client';
import { formatLegalPageDate } from '@/lib/legal-page-date';

/**
 * Privacy Policy page — static shell prerendered in the default language;
 * localized client-side from bundled locale files (en / hy / ru).
 */
export default function PrivacyPage() {
  const { lang } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-6 sm:p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{t(lang, 'privacy.title')}</h1>
          <p className="text-gray-600" suppressHydrationWarning>
            {t(lang, 'privacy.lastUpdated')} {formatLegalPageDate()}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'privacy.introduction.title')}</h2>
          <p className="text-gray-600">{t(lang, 'privacy.introduction.description1')}</p>
          <p className="text-gray-600">{t(lang, 'privacy.introduction.description2')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'privacy.informationWeCollect.title')}</h2>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {t(lang, 'privacy.informationWeCollect.personalInformation.title')}
            </h3>
            <p className="text-gray-600">{t(lang, 'privacy.informationWeCollect.personalInformation.description')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t(lang, 'privacy.informationWeCollect.personalInformation.items.register')}</li>
              <li>{t(lang, 'privacy.informationWeCollect.personalInformation.items.order')}</li>
              <li>{t(lang, 'privacy.informationWeCollect.personalInformation.items.newsletter')}</li>
              <li>{t(lang, 'privacy.informationWeCollect.personalInformation.items.contact')}</li>
              <li>{t(lang, 'privacy.informationWeCollect.personalInformation.items.surveys')}</li>
            </ul>
            <p className="text-gray-600">{t(lang, 'privacy.informationWeCollect.personalInformation.details')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {t(lang, 'privacy.informationWeCollect.automaticallyCollected.title')}
            </h3>
            <p className="text-gray-600">{t(lang, 'privacy.informationWeCollect.automaticallyCollected.description')}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'privacy.howWeUse.title')}</h2>
          <p className="text-gray-600">{t(lang, 'privacy.howWeUse.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t(lang, 'privacy.howWeUse.items.process')}</li>
            <li>{t(lang, 'privacy.howWeUse.items.confirmations')}</li>
            <li>{t(lang, 'privacy.howWeUse.items.support')}</li>
            <li>{t(lang, 'privacy.howWeUse.items.marketing')}</li>
            <li>{t(lang, 'privacy.howWeUse.items.improve')}</li>
            <li>{t(lang, 'privacy.howWeUse.items.fraud')}</li>
            <li>{t(lang, 'privacy.howWeUse.items.legal')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'privacy.informationSharing.title')}</h2>
          <p className="text-gray-600">{t(lang, 'privacy.informationSharing.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t(lang, 'privacy.informationSharing.items.providers')}</li>
            <li>{t(lang, 'privacy.informationSharing.items.law')}</li>
            <li>{t(lang, 'privacy.informationSharing.items.transfer')}</li>
            <li>{t(lang, 'privacy.informationSharing.items.consent')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'privacy.dataSecurity.title')}</h2>
          <p className="text-gray-600">{t(lang, 'privacy.dataSecurity.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'privacy.yourRights.title')}</h2>
          <p className="text-gray-600">{t(lang, 'privacy.yourRights.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t(lang, 'privacy.yourRights.items.access')}</li>
            <li>{t(lang, 'privacy.yourRights.items.correct')}</li>
            <li>{t(lang, 'privacy.yourRights.items.delete')}</li>
            <li>{t(lang, 'privacy.yourRights.items.object')}</li>
            <li>{t(lang, 'privacy.yourRights.items.portability')}</li>
            <li>{t(lang, 'privacy.yourRights.items.withdraw')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'privacy.cookies.title')}</h2>
          <p className="text-gray-600">{t(lang, 'privacy.cookies.description1')}</p>
          <p className="text-gray-600">
            {t(lang, 'privacy.cookies.description2')}{' '}
            <Link href="/cookies" className="text-blue-600 hover:underline">
              {t(lang, 'privacy.cookies.linkText')}
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'privacy.contact.title')}</h2>
          <p className="text-gray-600">
            {t(lang, 'privacy.contact.description')}{' '}
            <a href="mailto:marcofurniture@mail.ru" className="text-blue-600 hover:underline">
              marcofurniture@mail.ru
            </a>
          </p>
        </section>
      </Card>
    </div>
  );
}
