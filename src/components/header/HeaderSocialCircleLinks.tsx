'use client';

import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, Send } from 'lucide-react';
import { useTranslation } from '../../lib/i18n-client';

/** Public asset — WhatsApp brand glyph (replaces generic chat/SMS-style icon). */
const WHATSAPP_SOCIAL_ICON_SRC = '/icons/whatsapp.png';

/** Public asset — Viber mark (replaces phone-handset Lucide glyph to match Figma). */
const VIBER_SOCIAL_ICON_SRC = '/icons/viber.png';

/** Lucide glyphs sit inside the gray circle (Figma: ~16px mark in ~32px control). */
const SOCIAL_VECTOR_ICON_PX = 16;

/**
 * WhatsApp/Viber PNGs are full circular tiles (light fill + black mark). They fill the
 * whole 32px control — no extra `bg-marco-gray` behind them (avoids double-ring vs Figma).
 */
const SOCIAL_RASTER_FULL_PX = 32;

/** Lucide strokes use `currentColor` — `primary` is true black vs `marco-black` for heavier contrast on gray circles. */
const SOCIAL_LUCIDE_CLASS = 'shrink-0 text-primary';
const SOCIAL_RASTER_IMG_CLASS =
  'size-8 shrink-0 rounded-full object-contain object-center block';

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

const SOCIAL_ENTRIES: SocialEntry[] = [
  { translationKey: 'contact.social.instagram', Icon: Instagram, ariaKey: 'common.ariaLabels.instagram' },
  { translationKey: 'contact.social.facebook', Icon: Facebook, ariaKey: 'common.ariaLabels.facebook' },
  { translationKey: 'contact.social.telegram', Icon: Send, ariaKey: 'common.ariaLabels.telegram' },
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

function socialControlClass(entry: SocialEntry, enabled: boolean): string {
  const base =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[opacity,filter]';
  if (isRasterEntry(entry)) {
    return `${base} bg-transparent p-0 ${enabled ? 'hover:opacity-90' : 'opacity-50'}`;
  }
  return `${base} bg-marco-gray text-primary ${enabled ? 'hover:bg-marco-yellow/40' : 'opacity-50'}`;
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
    <Icon
      size={SOCIAL_VECTOR_ICON_PX}
      className={SOCIAL_LUCIDE_CLASS}
      strokeWidth={2}
      aria-hidden
    />
  );
}

interface HeaderSocialCircleLinksProps {
  className?: string;
}

/** Round social buttons — compact */
export function HeaderSocialCircleLinks({ className = '' }: HeaderSocialCircleLinksProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex shrink-0 items-center gap-4 ${className}`}
      role="list"
      aria-label={t('common.ariaLabels.socialLinks')}
    >
      {SOCIAL_ENTRIES.map((entry) => {
        const { translationKey, ariaKey } = entry;
        const href = t(translationKey)?.trim();
        const hasHref = href.length > 0 && href !== '#';
        const name = t(ariaKey);

        const inner = <SocialGlyph entry={entry} />;
        const surfaceClass = socialControlClass(entry, hasHref);

        if (!hasHref) {
          return (
            <span
              key={translationKey}
              role="listitem"
              className={surfaceClass}
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
            className={surfaceClass}
            aria-label={name}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
