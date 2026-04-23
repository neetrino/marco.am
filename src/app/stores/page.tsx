'use client';

import { Card, Button } from '@shop/ui';
import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

export default function StoresPage() {
  const { t, lang } = useTranslation();
  const stores = [
    {
      id: 1,
      name: 'Main Store',
      address:
        lang === 'hy'
          ? 'Ք․ Երևան Ալեք Մանուկյան 23'
          : lang === 'ru'
            ? 'г. Ереван, Алек Манукян 23'
            : '23 Alek Manukyan St, Yerevan',
      phone: '+374 10 123456',
      emails: ['marcofurniture@mail.ru', 'marcogrouparmenia@mail.ru'],
      hours:
        lang === 'hy'
          ? 'Երկ-Շբթ: 09:00 - 20:00'
          : lang === 'ru'
            ? 'Пн-Сб: 09:00 - 20:00'
            : 'Mon-Sat: 9:00 AM - 8:00 PM',
      image: 'https://via.placeholder.com/400x300?text=Main+Store',
    },
    {
      id: 2,
      name: 'Shopping Mall Branch',
      address:
        lang === 'hy'
          ? 'Արգավանդ Օդանավակայան 1'
          : lang === 'ru'
            ? 'Аргаванд, Аэропорт 1'
            : '1 Airport St, Argavand',
      phone: '+374 10 234567',
      emails: ['marcofurniture@mail.ru', 'marcogrouparmenia@mail.ru'],
      hours:
        lang === 'hy'
          ? 'Երկ-Կիր: 10:00 - 22:00'
          : lang === 'ru'
            ? 'Пн-Вс: 10:00 - 22:00'
            : 'Mon-Sun: 10:00 AM - 10:00 PM',
      image: 'https://via.placeholder.com/400x300?text=Mall+Branch',
    },
    {
      id: 3,
      name: 'Downtown Location',
      address:
        lang === 'hy'
          ? 'Գ. Փարաքար Մեսրոպ Մաշտոցի 1'
          : lang === 'ru'
            ? 'с. Паракар, Месроп Маштоц 1'
            : '1 Mesrop Mashtots St, Parakar',
      phone: '+374 77 51 04 06',
      emails: ['marcofurniture@mail.ru', 'marcogrouparmenia@mail.ru'],
      hours:
        lang === 'hy'
          ? 'Երկ-Ուրբ: 08:00 - 19:00'
          : lang === 'ru'
            ? 'Пн-Пт: 08:00 - 19:00'
            : 'Mon-Fri: 8:00 AM - 7:00 PM',
      image: 'https://via.placeholder.com/400x300?text=Downtown',
    },
  ];

  return (
    <div className="marco-header-container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('stores.title')}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('stores.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stores.map((store) => (
          <Card key={store.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200 relative">
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <span className="text-gray-600 text-lg font-semibold">{store.name}</span>
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{store.name}</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-gray-600 text-sm">{store.address}</p>
                </div>

                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-gray-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <a
                    href={`tel:${store.phone}`}
                    className="text-gray-600 text-sm hover:text-gray-900 transition-colors"
                  >
                    {store.phone}
                  </a>
                </div>

                <div className="space-y-1">
                  {store.emails.map((email) => (
                    <div key={email} className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-gray-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <a
                        href={`mailto:${email}`}
                        className="text-gray-600 text-sm hover:text-gray-900 transition-colors"
                      >
                        {email}
                      </a>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-gray-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-600 text-sm">{store.hours}</p>
                </div>
              </div>

              <Link href="/contact">
                <Button
                  variant="outline"
                  size="sm"
                  className="!h-11 w-full !rounded-full !border-0 !bg-marco-yellow !px-6 !text-sm font-semibold uppercase tracking-wide !text-marco-black dark:!text-[#050505] hover:!brightness-95"
                >
                  {t('stores.getDirections')}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('stores.cantFind.title')}</h2>
        <p className="text-gray-600 mb-6">
          {t('stores.cantFind.description')}
        </p>
        <Link href="/contact">
          <Button
            variant="primary"
            size="lg"
            className="!h-11 !rounded-full !border-0 !bg-marco-black !px-8 !text-sm font-semibold uppercase tracking-wide !text-white hover:!brightness-95"
          >
            {t('stores.cantFind.contactUs')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
