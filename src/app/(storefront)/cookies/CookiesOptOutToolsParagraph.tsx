import type { LanguageCode } from '@/lib/language';
import { t } from '@/lib/i18n';

/** Renders cookie opt-out copy with safe inline links (no client-side DOMPurify). */
export function CookiesOptOutToolsParagraph({ lang }: { lang: LanguageCode }) {
  const description = t(lang, 'cookies.managingCookies.optOutTools.description');
  const daaLabel = t(lang, 'cookies.managingCookies.optOutTools.digitalAdvertisingAlliance');
  const yocLabel = t(lang, 'cookies.managingCookies.optOutTools.yourOnlineChoices');
  const [beforeDaa, afterDaa = ''] = description.split('{digitalAdvertisingAlliance}');
  const [middle, afterYoc = ''] = afterDaa.split('{yourOnlineChoices}');

  return (
    <p className="text-gray-600">
      {beforeDaa}
      <a
        href="http://www.aboutads.info/choices/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {daaLabel}
      </a>
      {middle}
      <a
        href="http://www.youronlinechoices.eu/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {yocLabel}
      </a>
      {afterYoc}
    </p>
  );
}
