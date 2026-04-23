'use client';

import Image from 'next/image';
import { useTranslation } from '../../lib/i18n-client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const aboutParagraphKeys = [
  'about.description.paragraph1',
  'about.description.paragraph2',
] as const;

const partnerParagraphKeys = [
  'about.partners.paragraph1',
  'about.partners.paragraph2',
  'about.partners.paragraph3',
] as const;

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt={t('about.imageAlt')}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            <div className="space-y-6">
              <p className="text-sm md:text-base font-semibold uppercase tracking-wider text-[#7CB342]">
                {t('about.subtitle')}
              </p>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {t('about.title')}
              </h1>

              <div className="space-y-4 text-gray-600 text-base md:text-lg leading-relaxed">
                {aboutParagraphKeys.map((key) => (
                  <p key={key}>{t(key)}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm md:text-base font-semibold uppercase tracking-wider text-[#7CB342] mb-4">
              {t('about.partners.subtitle')}
            </p>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {t('about.partners.title')}
            </h2>

            <div className="space-y-4 text-gray-600 text-base md:text-lg leading-relaxed">
              {partnerParagraphKeys.map((key) => (
                <p key={key}>{t(key)}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
