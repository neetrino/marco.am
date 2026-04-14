'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useTranslation } from '../lib/i18n-client';
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_HEADING_TEXT_CLASS,
  FOOTER_MUTED_TEXT_CLASS,
  FOOTER_SUPPORT_LINKS,
  FOOTER_SURFACE_CLASS,
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

const FOOTER_LINK_CLASS = `${FOOTER_MUTED_TEXT_CLASS} text-sm transition-colors hover:text-marco-black`;

function FooterNavColumn({
  titleKey,
  items,
}: {
  titleKey: string;
  items: readonly { href: string; labelKey: string }[];
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <p
        className={`text-sm font-bold uppercase tracking-[0.05em] ${FOOTER_HEADING_TEXT_CLASS}`}
      >
        {t(titleKey)}
      </p>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={`${item.href}-${item.labelKey}`}>
            <Link href={item.href} className={FOOTER_LINK_CLASS}>
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
  const phoneRaw = t('contact.phone');
  const telHref = `tel:${phoneRaw.replace(/\s/g, '')}`;

  return (
    <div className="flex flex-col gap-4">
      <p
        className={`text-sm font-bold uppercase tracking-[0.05em] ${FOOTER_HEADING_TEXT_CLASS}`}
      >
        {t('common.footer.marco.headings.contacts')}
      </p>
      <p className={`text-sm leading-relaxed ${FOOTER_MUTED_TEXT_CLASS}`}>{t('contact.address')}</p>
      <div className="flex items-start gap-3">
        <img
          src={FOOTER_CONTACT_PHONE_ICON_SRC}
          alt=""
          width={18}
          height={15}
          className={FOOTER_CONTACT_PHONE_ICON_CLASS}
          aria-hidden
        />
        <a
          href={telHref}
          className="text-sm font-bold text-marco-black transition-colors hover:underline"
        >
          {phoneRaw}
        </a>
      </div>
      <div className="flex items-start gap-3">
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
          className={`text-sm transition-colors hover:text-marco-black ${FOOTER_MUTED_TEXT_CLASS}`}
        >
          {t('contact.email')}
        </a>
      </div>
    </div>
  );
}

function FooterCopyright() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <p className="inline-block text-center text-[9px] leading-tight text-marco-black sm:text-[10px] md:text-[11px] lg:text-xs whitespace-nowrap">
      <span>
        {t('common.footer.marco.copyrightBefore').replace('{year}', String(year))}
      </span>
      <a
        href={NEETRINO_STUDIO_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-marco-black no-underline hover:opacity-80"
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
  const { t } = useTranslation();

  return (
    <footer className={`${FOOTER_SURFACE_CLASS} border-t border-black/5`}>
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="flex max-w-sm flex-col gap-6">
            <div className="relative h-[81px] w-[91px] shrink-0">
              <Image
                src="/assets/brand/marco-group-logo.png"
                alt="MARCO GROUP"
                fill
                className="object-contain object-left-top"
                sizes="91px"
                priority={false}
              />
            </div>
            <p className={`text-sm leading-relaxed ${FOOTER_MUTED_TEXT_CLASS}`}>
              {t('common.footer.marco.brandDescription')}
            </p>
          </div>

          <FooterNavColumn
            titleKey="common.footer.marco.headings.company"
            items={FOOTER_COMPANY_LINKS}
          />
          <FooterNavColumn
            titleKey="common.footer.marco.headings.support"
            items={FOOTER_SUPPORT_LINKS}
          />
          <FooterContactsColumn />
        </div>

        <div className="mt-12 flex flex-col gap-8 border-t border-black/10 pt-8 lg:flex-row lg:items-center lg:justify-between lg:gap-3 xl:gap-5">
          <div className="flex shrink-0 justify-center lg:justify-start">
            <FooterSocialLinks density="compact" />
          </div>
          <div className="scrollbar-hide flex min-w-0 flex-1 justify-center overflow-x-auto px-1 lg:overflow-visible">
            <FooterCopyright />
          </div>
          <div className="flex shrink-0 justify-center lg:justify-end">
            <FooterPaymentLogos compact />
          </div>
        </div>
      </div>
    </footer>
  );
}
