'use client';

import Link from 'next/link';
import { Card } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';

/**
 * Privacy Policy page — content from locale files (en / hy / ru).
 */
export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-6 sm:p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{t('privacy.title')}</h1>
          <p className="text-gray-600">
            {t('privacy.lastUpdated')}{' '}
            {new Date().toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.introduction.title')}</h2>
          <p className="text-gray-600">{t('privacy.introduction.description1')}</p>
          <p className="text-gray-600">{t('privacy.introduction.description2')}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.informationWeCollect.title')}</h2>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('privacy.informationWeCollect.personalInformation.title')}
            </h3>
            <p className="text-gray-600">{t('privacy.informationWeCollect.personalInformation.description')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('privacy.informationWeCollect.personalInformation.items.register')}</li>
              <li>{t('privacy.informationWeCollect.personalInformation.items.order')}</li>
              <li>{t('privacy.informationWeCollect.personalInformation.items.newsletter')}</li>
              <li>{t('privacy.informationWeCollect.personalInformation.items.contact')}</li>
              <li>{t('privacy.informationWeCollect.personalInformation.items.surveys')}</li>
            </ul>
            <p className="text-gray-600">{t('privacy.informationWeCollect.personalInformation.details')}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('privacy.informationWeCollect.automaticallyCollected.title')}
            </h3>
            <p className="text-gray-600">{t('privacy.informationWeCollect.automaticallyCollected.description')}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.howWeUse.title')}</h2>
          <p className="text-gray-600">{t('privacy.howWeUse.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('privacy.howWeUse.items.process')}</li>
            <li>{t('privacy.howWeUse.items.confirmations')}</li>
            <li>{t('privacy.howWeUse.items.support')}</li>
            <li>{t('privacy.howWeUse.items.marketing')}</li>
            <li>{t('privacy.howWeUse.items.improve')}</li>
            <li>{t('privacy.howWeUse.items.fraud')}</li>
            <li>{t('privacy.howWeUse.items.legal')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.informationSharing.title')}</h2>
          <p className="text-gray-600">{t('privacy.informationSharing.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('privacy.informationSharing.items.providers')}</li>
            <li>{t('privacy.informationSharing.items.law')}</li>
            <li>{t('privacy.informationSharing.items.transfer')}</li>
            <li>{t('privacy.informationSharing.items.consent')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.dataSecurity.title')}</h2>
          <p className="text-gray-600">{t('privacy.dataSecurity.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.yourRights.title')}</h2>
          <p className="text-gray-600">{t('privacy.yourRights.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>{t('privacy.yourRights.items.access')}</li>
            <li>{t('privacy.yourRights.items.correct')}</li>
            <li>{t('privacy.yourRights.items.delete')}</li>
            <li>{t('privacy.yourRights.items.object')}</li>
            <li>{t('privacy.yourRights.items.portability')}</li>
            <li>{t('privacy.yourRights.items.withdraw')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.cookies.title')}</h2>
          <p className="text-gray-600">{t('privacy.cookies.description1')}</p>
          <p className="text-gray-600">
            {t('privacy.cookies.description2')}{' '}
            <Link href="/cookies" className="text-blue-600 hover:underline">
              {t('privacy.cookies.linkText')}
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t('privacy.contact.title')}</h2>
          <p className="text-gray-600">
            {t('privacy.contact.description')}{' '}
            <a href="mailto:marcofurniture@mail.ru" className="text-blue-600 hover:underline">
              marcofurniture@mail.ru
            </a>
          </p>
        </section>
      </Card>
    </div>
  );
}
