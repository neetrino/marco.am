'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, MapPin, Phone } from 'lucide-react';
import type { Ref } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { MarcoLogo } from './MarcoLogo';
import { HeaderSocialCircleLinks } from './HeaderSocialCircleLinks';
import { useShouldHideHeaderSocialLinks } from './useShouldHideHeaderSocialLinks';
import {
  HEADER_CONTAINER_CLASS,
  HEADER_FIGMA_CLUSTER_GAP_CLASS,
  HEADER_FIGMA_CONTACT_ADDRESS_ICON_TEXT_GAP_CLASS,
  HEADER_FIGMA_CONTACT_CLUSTER_GAP_CLASS,
  HEADER_FIGMA_CONTACT_PHONE_ICON_TEXT_GAP_CLASS,
  HEADER_LOGO_TO_NAV_GAP_CLASS,
  HEADER_FIGMA_NAV_LINK_GAP_CLASS,
  HEADER_NAV_TO_SOCIAL_GAP_CLASS,
  HEADER_FIGMA_PADDING_Y_CLASS,
  getHeaderPrimaryNavDesktopLinkClass,
} from './header.constants';
import { isPrimaryNavHrefActive, primaryNavLinks } from './nav-config';

type HeaderDesktopTopRowProps = {
  innerRef: Ref<HTMLDivElement>;
};

/**
 * Full-width first stripe: logo, primary nav, socials, phone, stores.
 */
export function HeaderDesktopTopRow({ innerRef }: HeaderDesktopTopRowProps) {
  const pathname = usePathname();
  const hideHeaderSocialLinks = useShouldHideHeaderSocialLinks();
  const { t } = useTranslation();
  const phoneDisplay = t('contact.phone').trim();
  const telHref =
    phoneDisplay.length > 0 ? `tel:${phoneDisplay.replace(/[^\d+]/gu, '')}` : 'tel:';

  return (
    <div
      ref={innerRef}
      className={`${HEADER_CONTAINER_CLASS} flex w-full min-w-0 flex-nowrap items-center ${HEADER_FIGMA_PADDING_Y_CLASS} ${HEADER_FIGMA_CLUSTER_GAP_CLASS}`}
    >
      <div className="flex min-w-0 flex-1 flex-nowrap items-center">
        <MarcoLogo />
        <nav
          className={`flex h-10 shrink-0 flex-nowrap items-center ${HEADER_LOGO_TO_NAV_GAP_CLASS} ${HEADER_FIGMA_NAV_LINK_GAP_CLASS} text-xs font-bold capitalize leading-[18px] text-marco-text dark:text-white/88`}
          aria-label="Main"
        >
          {primaryNavLinks.map((item) => {
            const label = t(item.translationKey);
            const active = isPrimaryNavHrefActive(pathname, item.href);
            const navClass = getHeaderPrimaryNavDesktopLinkClass(active);
            if (item.external === true) {
              return (
                <a
                  key={item.translationKey}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navClass}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </a>
              );
            }
            return (
              <Link
                key={item.translationKey}
                href={item.href}
                className={navClass}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        {!hideHeaderSocialLinks && (
          <HeaderSocialCircleLinks
            className={`${HEADER_NAV_TO_SOCIAL_GAP_CLASS} h-10 shrink-0 items-center`}
          />
        )}
        <div className="ml-4 min-h-0 min-w-0 flex-1" aria-hidden />
      </div>
      <div
        className={`flex h-10 min-w-0 shrink-0 flex-nowrap items-center ${HEADER_FIGMA_CONTACT_CLUSTER_GAP_CLASS}`}
      >
        <a
          href={telHref}
          className={`flex h-10 shrink-0 items-center ${HEADER_FIGMA_CONTACT_PHONE_ICON_TEXT_GAP_CLASS} text-marco-text transition-colors hover:text-marco-black dark:text-white/82 dark:hover:text-white`}
        >
          <Phone className="size-[19px] shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="inline-flex items-center gap-1">
            <span className="whitespace-nowrap text-[13px] font-medium leading-[13px]">{phoneDisplay}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-marco-text opacity-80 dark:text-white/70" strokeWidth={2.25} aria-hidden />
          </span>
        </a>
        <Link
          href="/stores"
          className={`flex h-10 shrink-0 items-center ${HEADER_FIGMA_CONTACT_ADDRESS_ICON_TEXT_GAP_CLASS} text-marco-text transition-colors hover:text-marco-black dark:text-white/82 dark:hover:text-white`}
        >
          <MapPin className="size-[19px] shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="inline-flex items-center gap-1">
            <span className="whitespace-nowrap text-xs font-medium leading-[13px]">
              {t('common.navigation.addresses')}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 text-marco-text opacity-80 dark:text-white/70" strokeWidth={2.25} aria-hidden />
          </span>
        </Link>
      </div>
    </div>
  );
}
