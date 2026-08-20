'use client';

import { Card } from '@shop/ui';

import { loadTranslation } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-client';
import type { LanguageCode } from '@/lib/language';
import enPrivacy from '@/locales/en/privacy.json';

type PrivacyCopy = typeof enPrivacy;
type PrivacySection = PrivacyCopy['sections'][number];

/**
 * Privacy Policy page — static shell prerendered in the default language;
 * localized client-side from bundled locale files (en / hy / ru).
 */
export default function PrivacyPage() {
  const { lang } = useTranslation();
  const copy = getPrivacyCopy(lang);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-6 sm:p-8 space-y-8">
        <h1 className="text-4xl font-bold text-gray-900">{copy.title}</h1>
        <div className="space-y-3">
          {copy.intro.map((text) => (
            <p key={text} className="text-gray-600">
              {text}
            </p>
          ))}
        </div>
        {copy.sections.map((section) => (
          <PrivacySectionBlock key={section.title} section={section} />
        ))}
      </Card>
    </div>
  );
}

function getPrivacyCopy(lang: LanguageCode): PrivacyCopy {
  const data = loadTranslation(lang, 'privacy');
  if (isPrivacyCopy(data)) {
    return data;
  }
  return enPrivacy;
}

function isPrivacyCopy(value: unknown): value is PrivacyCopy {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('title' in value) || !('intro' in value) || !('sections' in value)) {
    return false;
  }
  const candidate = value as { title: unknown; intro: unknown; sections: unknown };
  return (
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.intro) &&
    Array.isArray(candidate.sections)
  );
}

function PrivacySectionBlock({ section }: { section: PrivacySection }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
      {'intro' in section && section.intro ? (
        <p className="text-gray-600">{section.intro}</p>
      ) : null}
      {'paragraphs' in section && section.paragraphs
        ? section.paragraphs.map((text) => (
            <p key={text} className="text-gray-600">
              {text}
            </p>
          ))
        : null}
      {'items' in section && section.items ? (
        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {'closing' in section && section.closing
        ? section.closing.map((text) => (
            <p key={text} className="text-gray-600">
              {text}
            </p>
          ))
        : null}
    </section>
  );
}
