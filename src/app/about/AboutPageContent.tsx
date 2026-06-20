'use client';

import { t } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-client';

import { AboutHeroVideo } from './components/AboutHeroVideo';

/** https://www.youtube.com/watch?v=3aAcDWgG4K8 */
const ABOUT_HERO_YOUTUBE_VIDEO_ID = '3aAcDWgG4K8';

const aboutParagraphKeys = [
  'about.description.paragraph1',
  'about.description.paragraph2',
] as const;

const partnerParagraphKeys = [
  'about.partners.paragraph1',
  'about.partners.paragraph2',
  'about.partners.paragraph3',
] as const;

/** About page — static shell prerendered in the default language; localized client-side. */
export function AboutPageContent() {
  const { lang: language } = useTranslation();
  const title = t(language, 'about.title');

  return (
    <div className="min-h-screen bg-white">
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <AboutHeroVideo videoId={ABOUT_HERO_YOUTUBE_VIDEO_ID} title={title} />

            <div className="space-y-6 lg:py-4">
              <div className="h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7CB342] md:text-base">
                {t(language, 'about.subtitle')}
              </p>

              <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
                {title}
              </h1>

              <div className="space-y-4 text-base leading-relaxed text-gray-600 md:text-lg">
                {aboutParagraphKeys.map((key) => (
                  <p key={key}>{t(language, key)}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-marco-border/70 bg-marco-gray/40 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-5 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#7CB342] md:text-base">
              {t(language, 'about.partners.subtitle')}
            </p>

            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl lg:text-6xl">
              {t(language, 'about.partners.title')}
            </h2>

            <div className="space-y-4 text-base leading-relaxed text-gray-600 md:text-lg">
              {partnerParagraphKeys.map((key) => (
                <p key={key}>{t(language, key)}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
