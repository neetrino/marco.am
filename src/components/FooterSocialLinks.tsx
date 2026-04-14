'use client';

import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Send } from 'lucide-react';

import { useTranslation } from '../lib/i18n-client';
import { FOOTER_SOCIAL_BUTTON_CLASS } from './footer.constants';

const WHATSAPP_SOCIAL_ICON_SRC = '/icons/whatsapp.png';
const VIBER_SOCIAL_ICON_SRC = '/icons/viber.png';

const SOCIAL_VECTOR_ICON_PX = 18;

const SOCIAL_RASTER_FULL_PX = 40;

const SOCIAL_LUCIDE_CLASS = 'shrink-0 text-marco-black';
const SOCIAL_RASTER_IMG_CLASS =
  'size-10 shrink-0 rounded-full object-contain object-center block';

type LucideSocialEntry = {
  translationKey: string;
  ariaKey: string;
  Icon: LucideIcon;
};

type ImageSocialEntry = {
  translationKey: string;
  ariaKey: string;
  imageSrc: string;
};

type SocialEntry = LucideSocialEntry | ImageSocialEntry;

const FOOTER_SOCIAL_ENTRIES: SocialEntry[] = [
  {
    translationKey: 'contact.social.instagram',
    Icon: Instagram,
    ariaKey: 'common.ariaLabels.instagram',
  },
  {
    translationKey: 'contact.social.facebook',
    Icon: Facebook,
    ariaKey: 'common.ariaLabels.facebook',
  },
  {
    translationKey: 'contact.social.telegram',
    Icon: Send,
    ariaKey: 'common.ariaLabels.telegram',
  },
  {
    translationKey: 'contact.social.whatsapp',
    ariaKey: 'common.ariaLabels.whatsapp',
    imageSrc: WHATSAPP_SOCIAL_ICON_SRC,
  },
  {
    translationKey: 'contact.social.viber',
    ariaKey: 'common.ariaLabels.viber',
    imageSrc: VIBER_SOCIAL_ICON_SRC,
  },
];

function isRasterEntry(entry: SocialEntry): entry is ImageSocialEntry {
  return 'imageSrc' in entry;
}

function SocialGlyph({ entry }: { entry: SocialEntry }) {
  if (isRasterEntry(entry)) {
    return (
      <img
        src={entry.imageSrc}
        alt=""
        width={SOCIAL_RASTER_FULL_PX}
        height={SOCIAL_RASTER_FULL_PX}
        className={SOCIAL_RASTER_IMG_CLASS}
        aria-hidden
      />
    );
  }
  const { Icon } = entry;
  return (
    <Icon size={SOCIAL_VECTOR_ICON_PX} className={SOCIAL_LUCIDE_CLASS} strokeWidth={2} aria-hidden />
  );
}

/**
 * Footer row — yellow circular controls (Figma 101:2835).
 */
export function FooterSocialLinks() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-wrap items-center gap-4"
      role="list"
      aria-label={t('common.ariaLabels.socialLinks')}
    >
      {FOOTER_SOCIAL_ENTRIES.map((entry) => {
        const { translationKey, ariaKey } = entry;
        const href = t(translationKey)?.trim();
        const hasHref = href.length > 0 && href !== '#';
        const name = t(ariaKey);
        const inner = <SocialGlyph entry={entry} />;

        if (!hasHref) {
          return (
            <span
              key={translationKey}
              role="listitem"
              className={`${FOOTER_SOCIAL_BUTTON_CLASS} opacity-50`}
              aria-label={name}
            >
              {inner}
            </span>
          );
        }

        return (
          <a
            key={translationKey}
            role="listitem"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={FOOTER_SOCIAL_BUTTON_CLASS}
            aria-label={name}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
