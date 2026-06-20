'use client';

import { Card } from '@shop/ui';

import { t } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-client';
import { formatLegalPageDate } from '@/lib/legal-page-date';

import { CookiesOptOutToolsParagraph } from './CookiesOptOutToolsParagraph';

/**
 * Cookie Policy page — static shell prerendered in the default language;
 * localized client-side from bundled locale files (en / hy / ru).
 */
export default function CookiesPage() {
  const { lang } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-6 sm:p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">{t(lang, 'cookies.title')}</h1>
          <p className="text-gray-600" suppressHydrationWarning>
            {t(lang, 'cookies.lastUpdated')} {formatLegalPageDate()}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'cookies.whatAreCookies.title')}</h2>
          <p className="text-gray-600">{t(lang, 'cookies.whatAreCookies.description1')}</p>
          <p className="text-gray-600">{t(lang, 'cookies.whatAreCookies.description2')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'cookies.howWeUseCookies.title')}</h2>
          <p className="text-gray-600">{t(lang, 'cookies.howWeUseCookies.description')}</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
            <li>
              <strong>{t(lang, 'cookies.howWeUseCookies.types.essential.title')}</strong>{' '}
              {t(lang, 'cookies.howWeUseCookies.types.essential.description')}
            </li>
            <li>
              <strong>{t(lang, 'cookies.howWeUseCookies.types.performance.title')}</strong>{' '}
              {t(lang, 'cookies.howWeUseCookies.types.performance.description')}
            </li>
            <li>
              <strong>{t(lang, 'cookies.howWeUseCookies.types.functionality.title')}</strong>{' '}
              {t(lang, 'cookies.howWeUseCookies.types.functionality.description')}
            </li>
            <li>
              <strong>{t(lang, 'cookies.howWeUseCookies.types.targeting.title')}</strong>{' '}
              {t(lang, 'cookies.howWeUseCookies.types.targeting.description')}
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'cookies.typesOfCookies.title')}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(lang, 'cookies.typesOfCookies.sessionCookies.title')}
              </h3>
              <p className="text-gray-600">{t(lang, 'cookies.typesOfCookies.sessionCookies.description')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(lang, 'cookies.typesOfCookies.persistentCookies.title')}
              </h3>
              <p className="text-gray-600">{t(lang, 'cookies.typesOfCookies.persistentCookies.description')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(lang, 'cookies.typesOfCookies.thirdPartyCookies.title')}
              </h3>
              <p className="text-gray-600">{t(lang, 'cookies.typesOfCookies.thirdPartyCookies.description')}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'cookies.managingCookies.title')}</h2>
          <p className="text-gray-600">{t(lang, 'cookies.managingCookies.description')}</p>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(lang, 'cookies.managingCookies.browserSettings.title')}
              </h3>
              <p className="text-gray-600 mb-2">{t(lang, 'cookies.managingCookies.browserSettings.description1')}</p>
              <p className="text-gray-600">{t(lang, 'cookies.managingCookies.browserSettings.description2')}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4 mt-2">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t(lang, 'cookies.managingCookies.browserSettings.browsers.chrome')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t(lang, 'cookies.managingCookies.browserSettings.browsers.firefox')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t(lang, 'cookies.managingCookies.browserSettings.browsers.safari')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {t(lang, 'cookies.managingCookies.browserSettings.browsers.edge')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(lang, 'cookies.managingCookies.optOutTools.title')}
              </h3>
              <CookiesOptOutToolsParagraph lang={lang} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'cookies.cookiesWeUse.title')}</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(lang, 'cookies.cookiesWeUse.essential.title')}
              </h3>
              <p className="text-gray-600">{t(lang, 'cookies.cookiesWeUse.essential.description')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(lang, 'cookies.cookiesWeUse.analytics.title')}
              </h3>
              <p className="text-gray-600">{t(lang, 'cookies.cookiesWeUse.analytics.description')}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(lang, 'cookies.cookiesWeUse.preference.title')}
              </h3>
              <p className="text-gray-600">{t(lang, 'cookies.cookiesWeUse.preference.description')}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'cookies.updates.title')}</h2>
          <p className="text-gray-600">{t(lang, 'cookies.updates.description')}</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{t(lang, 'cookies.contact.title')}</h2>
          <p className="text-gray-600">
            {t(lang, 'cookies.contact.description')}{' '}
            <a href="mailto:marcofurniture@mail.ru" className="text-blue-600 hover:underline">
              marcofurniture@mail.ru
            </a>
          </p>
        </section>
      </Card>
    </div>
  );
}
