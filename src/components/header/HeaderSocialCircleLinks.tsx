'use client';

import type { LucideIcon } from 'lucide-react';
import { Facebook, Instagram, MessageCircle, PhoneCall, Send } from 'lucide-react';
import { useTranslation } from '../../lib/i18n-client';

interface SocialEntry {
  translationKey: string;
  ariaKey: string;
  Icon: LucideIcon;
}

const SOCIAL_ENTRIES: SocialEntry[] = [
  { translationKey: 'contact.social.instagram', Icon: Instagram, ariaKey: 'common.ariaLabels.instagram' },
  { translationKey: 'contact.social.facebook', Icon: Facebook, ariaKey: 'common.ariaLabels.facebook' },
  { translationKey: 'contact.social.telegram', Icon: Send, ariaKey: 'common.ariaLabels.telegram' },
  { translationKey: 'contact.social.whatsapp', Icon: MessageCircle, ariaKey: 'common.ariaLabels.whatsapp' },
  { translationKey: 'contact.social.viber', Icon: PhoneCall, ariaKey: 'common.ariaLabels.viber' },
];

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
      {SOCIAL_ENTRIES.map(({ translationKey, ariaKey, Icon }) => {
        const href = t(translationKey)?.trim();
        const hasHref = href.length > 0 && href !== '#';
        const name = t(ariaKey);

        const inner = (
          <Icon className="h-4 w-4 text-marco-black" strokeWidth={1.75} aria-hidden />
        );

        if (!hasHref) {
          return (
            <span
              key={translationKey}
              role="listitem"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-marco-gray opacity-50"
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-marco-gray text-marco-black transition-colors hover:bg-marco-yellow/40"
            aria-label={name}
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
