'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin } from 'lucide-react';

import { useTranslation } from '../lib/i18n-client';
import {
  FOOTER_BRAND_COLUMN_GAP_CLASS,
  FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS,
  FOOTER_BRAND_DESCRIPTION_TEXT_CLASS,
  FOOTER_BRAND_LOGO_BOX_CLASS,
  FOOTER_BRAND_LOGO_SHIFT_CLASS,
  FOOTER_COMPANY_LINKS,
  FOOTER_GRID_COMPANY_SUPPORT_WRAPPER_CLASS,
  FOOTER_GRID_CONTACTS_WRAPPER_CLASS,
  FOOTER_COPYRIGHT_STRIP_MARGIN_TOP_CLASS,
  FOOTER_COPYRIGHT_STRIP_PADDING_TOP_CLASS,
  FOOTER_COLUMN_PIPE_BAR_CLASS,
  FOOTER_COLUMN_PIPE_CLASS,
  FOOTER_HEADING_TEXT_CLASS,
  FOOTER_MAIN_GRID_CLASS,
  FOOTER_NAV_BODY_TEXT_CLASS,
  FOOTER_NAV_COLUMN_HEADING_LEADING_CLASS,
  FOOTER_NAV_COLUMN_HEADING_LIST_GAP_CLASS,
  FOOTER_NAV_COLUMN_HEADING_TRACK_CLASS,
  FOOTER_NAV_COLUMN_LINK_LEADING_CLASS,
  FOOTER_NAV_COLUMN_LINK_WORD_SPACING_CLASS,
  FOOTER_NAV_COLUMN_LIST_ITEM_GAP_CLASS,
  FOOTER_NAV_HEADING_TEXT_CLASS,
  FOOTER_MUTED_TEXT_CLASS,
  FOOTER_SUPPORT_LINKS,
  FOOTER_SURFACE_CLASS,
  FOOTER_TABLET_COLUMN_CENTER_CLASS,
  NEETRINO_STUDIO_HREF,
} from './footer.constants';
import {
  FOOTER_CONTACT_MAIL_ICON_CLASS,
  FOOTER_CONTACT_MAIL_ICON_SRC,
  FOOTER_CONTACT_PHONE_ICON_CLASS,
  FOOTER_CONTACT_PHONE_ICON_SRC,
} from './footer-social.constants';
import { FooterPaymentLogos } from './FooterPaymentLogos';
import { FooterSocialLinks } from './FooterSocialLinks';

const FOOTER_LINK_CLASS = `${FOOTER_MUTED_TEXT_CLASS} ${FOOTER_NAV_BODY_TEXT_CLASS} transition-colors hover:text-marco-black dark:hover:text-white`;
const FOOTER_SECONDARY_EMAIL = 'marcogrouparmenia@mail.ru';
const FOOTER_PRIMARY_PHONES = ['+374 93 52 04 06', '+374 98 19 04 06', '+374 41 34 04 06'] as const;

const FOOTER_NAV_COLUMN_LINK_CLASS = `${FOOTER_LINK_CLASS} ${FOOTER_NAV_COLUMN_LINK_WORD_SPACING_CLASS} ${FOOTER_NAV_COLUMN_LINK_LEADING_CLASS}`;

function FooterNavColumn({
  titleKey,
  items,
}: {
  titleKey: string;
  items: readonly { href: string; labelKey: string }[];
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex h-full w-full max-w-full flex-col ${FOOTER_NAV_COLUMN_HEADING_LIST_GAP_CLASS} ${FOOTER_TABLET_COLUMN_CENTER_CLASS}`}
    >
      <p
        className={`${FOOTER_NAV_HEADING_TEXT_CLASS} ${FOOTER_NAV_COLUMN_HEADING_LEADING_CLASS} ${FOOTER_NAV_COLUMN_HEADING_TRACK_CLASS} ${FOOTER_HEADING_TEXT_CLASS}`}
      >
        {t(titleKey)}
      </p>
      <ul className={`flex flex-col ${FOOTER_NAV_COLUMN_LIST_ITEM_GAP_CLASS}`}>
        {items.map((item) => (
          <li key={`${item.href}-${item.labelKey}`}>
            <Link href={item.href} className={FOOTER_NAV_COLUMN_LINK_CLASS}>
              {t(item.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterContactsColumn() {
  const { t } = useTranslation();

  return (
    <div
      className={`flex h-full w-full max-w-full flex-col gap-2 ${FOOTER_TABLET_COLUMN_CENTER_CLASS}`}
    >
      <p
        className={`${FOOTER_NAV_HEADING_TEXT_CLASS} ${FOOTER_NAV_COLUMN_HEADING_LEADING_CLASS} ${FOOTER_NAV_COLUMN_HEADING_TRACK_CLASS} ${FOOTER_HEADING_TEXT_CLASS}`}
      >
        {t('common.footer.marco.headings.contacts')}
      </p>
      <div className="flex items-start gap-2 md:max-[1023px]:justify-center min-[1024px]:max-[1366px]:justify-center">
        <MapPin
          className="mt-0 h-[18px] w-[18px] shrink-0 -translate-x-px translate-y-[3px] self-start text-marco-yellow"
          strokeWidth={2}
          aria-hidden
        />
        <p
          className={`${FOOTER_NAV_BODY_TEXT_CLASS} leading-snug whitespace-pre-line ${FOOTER_MUTED_TEXT_CLASS}`}
        >
          {t('contact.address')}
        </p>
      </div>
      <div className="flex items-start gap-2 md:max-[1023px]:justify-center min-[1024px]:max-[1366px]:justify-center">
        <img
          src={FOOTER_CONTACT_PHONE_ICON_SRC}
          alt=""
          width={18}
          height={15}
          className={FOOTER_CONTACT_PHONE_ICON_CLASS}
          aria-hidden
        />
        <div className="flex flex-col gap-0.5">
          {FOOTER_PRIMARY_PHONES.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s/g, '')}`}
              className={`${FOOTER_NAV_BODY_TEXT_CLASS} transition-colors hover:text-marco-black hover:underline dark:hover:text-white ${FOOTER_MUTED_TEXT_CLASS}`}
            >
              {phone}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-start gap-2 md:max-[1023px]:justify-center min-[1024px]:max-[1366px]:justify-center">
        <img
          src={FOOTER_CONTACT_MAIL_ICON_SRC}
          alt=""
          width={20}
          height={14}
          className={FOOTER_CONTACT_MAIL_ICON_CLASS}
          aria-hidden
        />
        <a
          href={`mailto:${t('contact.email')}`}
          className={`${FOOTER_NAV_BODY_TEXT_CLASS} transition-colors hover:text-marco-black dark:hover:text-white ${FOOTER_MUTED_TEXT_CLASS}`}
        >
          {t('contact.email')}
        </a>
      </div>
      <div className="flex items-start gap-2 md:max-[1023px]:justify-center min-[1024px]:max-[1366px]:justify-center">
        <img
          src={FOOTER_CONTACT_MAIL_ICON_SRC}
          alt=""
          width={20}
          height={14}
          className={FOOTER_CONTACT_MAIL_ICON_CLASS}
          aria-hidden
        />
        <a
          href={`mailto:${FOOTER_SECONDARY_EMAIL}`}
          className={`${FOOTER_NAV_BODY_TEXT_CLASS} transition-colors hover:text-marco-black dark:hover:text-white ${FOOTER_MUTED_TEXT_CLASS}`}
        >
          {FOOTER_SECONDARY_EMAIL}
        </a>
      </div>
    </div>
  );
}

function FooterCopyright() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <p className="inline-block whitespace-nowrap text-center text-[10px] leading-tight text-gray-500 dark:text-[#c7c7c7] sm:text-[11px] md:text-xs lg:text-[13px]">
      <span>
        {t('common.footer.marco.copyrightBefore').replace('{year}', String(year))}
      </span>
      <a
        href={NEETRINO_STUDIO_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-marco-black no-underline hover:opacity-80 dark:text-white"
      >
        {t('common.footer.marco.creditStudio')}
      </a>
      <span>{t('common.footer.marco.copyrightAfter')}</span>
    </p>
  );
}

/**
 * Site-wide footer — MARCO marketing layout (Figma 101:2835).
 */
export function Footer() {
  const pathname = usePathname();
  const { t } = useTranslation();

  if (pathname?.startsWith('/supersudo')) {
    return null;
  }

  return (
    <footer className={`${FOOTER_SURFACE_CLASS} border-t border-black/5 dark:border-white/10`}>
      <div className="marco-header-container pb-7 pt-6">
        <div className={FOOTER_MAIN_GRID_CLASS}>
          <div
            className={`relative flex max-w-sm flex-col md:max-[1023px]:items-center min-[1024px]:max-[1366px]:items-center lg:self-start ${FOOTER_BRAND_COLUMN_GAP_CLASS}`}
          >
            <div className={`${FOOTER_BRAND_LOGO_BOX_CLASS} ${FOOTER_BRAND_LOGO_SHIFT_CLASS}`}>
              <Image
                src="/assets/brand/marco-group-logo.webp"
                alt="MARCO GROUP"
                fill
                className="object-contain object-left-top md:max-[1023px]:object-center min-[1024px]:max-[1366px]:object-center"
                sizes="320px"
                priority={false}
              />
            </div>
            <p
              className={`${FOOTER_BRAND_DESCRIPTION_OVERLAP_CLASS} ${FOOTER_BRAND_DESCRIPTION_TEXT_CLASS} ${FOOTER_SURFACE_CLASS} ${FOOTER_MUTED_TEXT_CLASS}`}
            >
              {t('common.footer.marco.brandDescription')}
            </p>
          </div>

          <div className={FOOTER_GRID_COMPANY_SUPPORT_WRAPPER_CLASS}>
            <FooterNavColumn
              titleKey="common.footer.marco.headings.company"
              items={FOOTER_COMPANY_LINKS}
            />
          </div>
          <div className={FOOTER_COLUMN_PIPE_CLASS} aria-hidden>
            <div className={FOOTER_COLUMN_PIPE_BAR_CLASS} />
          </div>
          <div className={FOOTER_GRID_COMPANY_SUPPORT_WRAPPER_CLASS}>
            <FooterNavColumn
              titleKey="common.footer.marco.headings.support"
              items={FOOTER_SUPPORT_LINKS}
            />
          </div>
          <div className={FOOTER_COLUMN_PIPE_CLASS} aria-hidden>
            <div className={FOOTER_COLUMN_PIPE_BAR_CLASS} />
          </div>
          <div className={FOOTER_GRID_CONTACTS_WRAPPER_CLASS}>
            <FooterContactsColumn />
          </div>
        </div>

        <div
          className={`${FOOTER_COPYRIGHT_STRIP_MARGIN_TOP_CLASS} flex w-full flex-row items-center justify-between gap-2 border-t border-black/10 dark:border-white/10 ${FOOTER_COPYRIGHT_STRIP_PADDING_TOP_CLASS}`}
        >
          <div className="flex shrink-0 justify-start">
            <FooterSocialLinks density="compact" />
          </div>
          <div className="scrollbar-hide flex min-w-0 flex-1 justify-center overflow-x-auto px-2">
            <FooterCopyright />
          </div>
          <div className="flex shrink-0 justify-end">
            <FooterPaymentLogos compact />
          </div>
        </div>
      </div>
    </footer>
  );
}
