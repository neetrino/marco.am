'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

import { useTranslation } from '../lib/i18n-client';
import {
  FOOTER_COMPANY_LINKS,
  FOOTER_HEADING_TEXT_CLASS,
  FOOTER_MUTED_TEXT_CLASS,
  FOOTER_SUPPORT_LINKS,
  FOOTER_SURFACE_CLASS,
  NEETRINO_STUDIO_HREF,
} from './footer.constants';
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
        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-marco-yellow" strokeWidth={2} aria-hidden />
        <a
          href={telHref}
          className="text-sm font-bold text-marco-black transition-colors hover:underline"
        >
          {phoneRaw}
        </a>
      </div>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <Mail className="h-4 w-4 text-marco-yellow" strokeWidth={2} aria-hidden />
        </span>
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
    <p className="max-w-3xl text-center text-sm text-marco-black">
      <span>
        {t('common.footer.marco.copyrightBefore').replace('{year}', String(year))}
      </span>
      <a
        href={NEETRINO_STUDIO_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-marco-black underline decoration-marco-black underline-offset-2 hover:opacity-80"
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

        <div className="mt-12 grid grid-cols-1 gap-8 border-t border-black/10 pt-8 lg:grid-cols-3 lg:items-center">
          <div className="flex justify-start">
            <FooterSocialLinks />
          </div>
          <FooterCopyright />
          <div className="flex justify-start lg:justify-end">
            <FooterPaymentLogos />
          </div>
        </div>
      </div>
    </footer>
  );
}
