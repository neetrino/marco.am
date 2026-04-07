'use client';

import Image from 'next/image';
import { TeamCarousel } from '../../components/TeamCarousel';
import { useTranslation } from '../../lib/i18n-client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

/**
 * Ð¡Ñ‚Ñ€Ð°Ð½Ð¸Ñ†Ð° About Us
 * Ð¡Ð¾Ð´ÐµÑ€Ð¶Ð¸Ñ‚ Ð´Ð²Ðµ Ð¾ÑÐ½Ð¾Ð²Ð½Ñ‹Ðµ ÑÐµÐºÑ†Ð¸Ð¸:
 * 1. About our online store - Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ Ð¾ Ð¼Ð°Ð³Ð°Ð·Ð¸Ð½Ðµ Ñ Ð¸Ð·Ð¾Ð±Ñ€Ð°Ð¶ÐµÐ½Ð¸ÐµÐ¼
 * 2. Our Team - ÐºÐ°Ñ€ÑƒÑÐµÐ»ÑŒ Ñ Ñ‡Ð»ÐµÐ½Ð°Ð¼Ð¸ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñ‹
 */
export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      {/* Ð¡ÐµÐºÑ†Ð¸Ñ: About our online store */}
      <section className="py-16 md:py-24">
        <div className="page-shell">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Ð˜Ð·Ð¾Ð±Ñ€Ð°Ð¶ÐµÐ½Ð¸Ðµ ÑÐ»ÐµÐ²Ð° */}
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt="Our team working together"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Ð¢ÐµÐºÑÑ‚ ÑÐ¿Ñ€Ð°Ð²Ð° */}
            <div className="space-y-6">
              {/* ÐŸÐ¾Ð´Ð·Ð°Ð³Ð¾Ð»Ð¾Ð²Ð¾Ðº */}
              <p className="text-sm md:text-base font-semibold uppercase tracking-wider text-[#7CB342]">
                {t('about.subtitle')}
              </p>

              {/* Ð—Ð°Ð³Ð¾Ð»Ð¾Ð²Ð¾Ðº */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {t('about.title')}
              </h1>

              {/* Ð¢ÐµÐºÑÑ‚ */}
              <div className="space-y-4 text-gray-600 text-base md:text-lg leading-relaxed">
                <p>
                  {t('about.description.paragraph1')}
                </p>
                <p>
                  {t('about.description.paragraph2')}
                </p>
                <p>
                  {t('about.description.paragraph3')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ð¡ÐµÐºÑ†Ð¸Ñ: Our Team */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="page-shell">
          <div className="text-center mb-12">
            {/* ÐŸÐ¾Ð´Ð·Ð°Ð³Ð¾Ð»Ð¾Ð²Ð¾Ðº */}
            <p className="text-sm md:text-base font-semibold uppercase tracking-wider text-[#7CB342] mb-4">
              {t('about.team.subtitle')}
            </p>

            {/* Ð—Ð°Ð³Ð¾Ð»Ð¾Ð²Ð¾Ðº */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              {t('about.team.title')}
            </h2>

            {/* ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸Ðµ */}
            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
              {t('about.team.description')}
            </p>
          </div>

          {/* ÐšÐ°Ñ€ÑƒÑÐµÐ»ÑŒ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñ‹ */}
          <div className="max-w-6xl mx-auto">
            <TeamCarousel />
          </div>
        </div>
      </section>
    </div>
  );
}
