import { MapPin } from 'lucide-react';

import {
  FOOTER_CONTACT_MAIL_ICON_SRC,
  FOOTER_CONTACT_PHONE_ICON_SRC,
} from '@/components/footer-social.constants';
import type { ContactLocation } from '@/lib/contact-locations';

const CONTACT_PAGE_PHONE_ICON_CLASS =
  'mt-0.5 h-[13px] w-auto shrink-0 translate-y-[4px]';
const CONTACT_PAGE_MAIL_ICON_CLASS =
  'mt-0.5 h-[12px] w-auto shrink-0 translate-y-[3px]';
const CONTACT_DIVIDER_CLASS =
  'ml-0 block h-px shrink-0 self-start bg-[var(--app-border)] w-full max-w-sm';

const CONTACT_EMAILS = ['marcogrouparmenia@mail.ru', 'marcofurniture@mail.ru'] as const;

type ContactInfoColumnProps = {
  readonly writeToUsTitle: string;
  readonly pageTitle: string;
  readonly locations: readonly ContactLocation[];
};

/** Server-rendered store contacts — paints before client form/map hydrate. */
export function ContactInfoColumn({
  writeToUsTitle,
  pageTitle,
  locations,
}: ContactInfoColumnProps) {
  return (
    <div className="flex w-full flex-col md:max-w-lg">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-soft)]">
        {writeToUsTitle}
      </p>
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">
        {pageTitle}
      </h1>
      <div className="w-full max-w-md">
        {locations.map((location, idx) => (
          <div
            key={location.id}
            id={`contact-loc-${location.id}`}
            className={`space-y-2 rounded-xl border border-transparent px-3 py-2 transition-colors ${
              idx === locations.length - 1 ? 'pb-0' : 'pb-4'
            }`}
          >
            <div className="flex items-start gap-2">
              <MapPin
                className={`mt-0.5 h-[18px] w-[18px] shrink-0 text-marco-yellow ${
                  idx === 0 ? 'translate-y-[3px]' : 'translate-y-[2px]'
                }`}
                strokeWidth={2}
                aria-hidden
              />
              <p className="text-sm font-medium leading-snug text-[var(--app-text)] sm:text-base">
                {location.address}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <img
                src={FOOTER_CONTACT_PHONE_ICON_SRC}
                alt=""
                width={16}
                height={13}
                className={CONTACT_PAGE_PHONE_ICON_CLASS}
                aria-hidden
              />
              <div className="flex flex-col gap-px">
                {location.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/[^\d+]/gu, '')}`}
                    className="text-sm font-semibold leading-snug text-[var(--app-text)] transition-colors hover:text-marco-yellow sm:text-base"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>
            {idx < locations.length - 1 ? (
              <div className={CONTACT_DIVIDER_CLASS} aria-hidden />
            ) : null}
          </div>
        ))}
        <div className={`${CONTACT_DIVIDER_CLASS} mt-2`} aria-hidden />
        <div className="space-y-2.5 pt-6">
          {CONTACT_EMAILS.map((email) => (
            <div key={email} className="flex items-start gap-2">
              <img
                src={FOOTER_CONTACT_MAIL_ICON_SRC}
                alt=""
                width={18}
                height={14}
                className={CONTACT_PAGE_MAIL_ICON_CLASS}
                aria-hidden
              />
              <a
                href={`mailto:${email}`}
                className="break-all text-xs font-semibold leading-snug text-[var(--app-text)] transition-colors hover:text-marco-yellow sm:text-sm"
              >
                {email}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
