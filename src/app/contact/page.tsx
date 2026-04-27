'use client';

import { Button, Card, Input } from '@shop/ui';
import { MapPin } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import {
  getContactLocations,
  mapsEmbedUrlForLocation,
  parseContactLocationHash,
  type ContactLocation,
  type ContactLocationId,
} from '../../lib/contact-locations';
import { apiClient } from '../../lib/api-client';
import { getErrorMessage } from '@/lib/types/errors';
import {
  FOOTER_CONTACT_MAIL_ICON_SRC,
  FOOTER_CONTACT_PHONE_ICON_SRC,
} from '../../components/footer-social.constants';

const CONTACT_PAGE_PHONE_ICON_CLASS =
  'mt-0.5 h-[13px] w-auto shrink-0 translate-y-[4px]';
const CONTACT_PAGE_MAIL_ICON_CLASS =
  'mt-0.5 h-[12px] w-auto shrink-0 translate-y-[3px]';
/** Contact block dividers — aligned to content width. */
const CONTACT_DIVIDER_BASE_CLASS =
  'ml-0 block h-px shrink-0 self-start bg-[var(--app-border)]';
const CONTACT_DIVIDER_CLASS = `${CONTACT_DIVIDER_BASE_CLASS} w-full max-w-sm`;
const CONTACT_EMAILS = ['marcogrouparmenia@mail.ru', 'marcofurniture@mail.ru'] as const;

const CONTACT_FORM_FIELD_CLASS =
  'w-full !h-11 !rounded-full !border !border-[var(--app-border)] !bg-[var(--app-surface-muted)] !px-4 !py-0 !text-sm !text-[var(--app-text)] placeholder:!text-[var(--app-text-soft)] focus:!border-marco-yellow/55 focus:!ring-2 focus:!ring-marco-yellow/30 dark:!border-[var(--app-border-strong)] sm:!text-base';

type ContactMapAddressStripProps = {
  locations: readonly ContactLocation[];
  activeId: ContactLocationId;
  onSelect: (id: ContactLocationId) => void;
  sectionTitle: string;
};

function ContactMapAddressStrip({
  locations,
  activeId,
  onSelect,
  sectionTitle,
}: ContactMapAddressStripProps) {
  return (
    <div className="border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-5 sm:px-6">
      <div className="marco-header-container">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-soft)]">
          {sectionTitle}
        </p>
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="tablist"
          aria-label={sectionTitle}
        >
          {locations.map((loc) => {
            const active = activeId === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(loc.id)}
                className={`flex min-h-[3.25rem] items-start gap-2.5 rounded-2xl border px-4 py-3 text-left text-sm font-medium leading-snug transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marco-yellow/80 sm:text-[15px] ${
                  active
                    ? 'border-marco-yellow bg-marco-yellow/12 text-[var(--app-text)] shadow-sm ring-1 ring-marco-yellow/35 dark:bg-marco-yellow/14 dark:ring-marco-yellow/45'
                    : 'border-[var(--app-border)] bg-[var(--app-surface-muted)]/80 text-[var(--app-text)] hover:border-marco-yellow/45 hover:bg-marco-yellow/[0.06] hover:shadow-sm dark:border-[var(--app-border-strong)] dark:bg-[var(--app-surface-muted)]/50 dark:hover:border-marco-yellow/40 dark:hover:bg-marco-yellow/[0.08]'
                }`}
              >
                <MapPin
                  className={`mt-0.5 h-[18px] w-[18px] shrink-0 stroke-[2] ${
                    active ? 'text-marco-yellow' : 'text-[var(--app-text-soft)]'
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">{loc.address}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const { t, lang } = useTranslation();
  const contactLocations = useMemo(() => getContactLocations(lang), [lang]);
  const [mapFocusId, setMapFocusId] = useState<ContactLocationId | null>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncFromHash = () => {
      setMapFocusId(parseContactLocationHash(window.location.hash));
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (!parseContactLocationHash(window.location.hash)) {
      return;
    }
    const el = mapSectionRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const headerOffset = 88;
    const visibleEnough =
      rect.top >= headerOffset - 32 && rect.top < window.innerHeight * 0.92;
    if (visibleEnough) {
      return;
    }
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [mapFocusId]);

  const mapLocation =
    (mapFocusId ? contactLocations.find((l) => l.id === mapFocusId) : null) ??
    contactLocations[0];

  const activeMapId: ContactLocationId =
    mapFocusId ?? contactLocations[0]?.id ?? 'yerevan';

  const selectMapLocation = (id: ContactLocationId) => {
    window.location.hash = `loc-${id}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await apiClient.post('/api/v1/contact', {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      }, {
        skipAuth: true, // Contact form doesn't require authentication
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      
      alert(t('contact.form.submitSuccess') || 'Ձեր հաղորդագրությունը հաջողությամբ ուղարկվեց');
    } catch (error: unknown) {
      console.error('Error submitting contact form:', error);
      alert(t('contact.form.submitError') || 'Սխալ: ' + (getErrorMessage(error) || 'Չհաջողվեց ուղարկել հաղորդագրությունը'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="marco-header-container py-10 md:py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:items-start md:gap-12 lg:gap-16">
          <div className="flex w-full flex-col md:max-w-lg">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-soft)]">
              {t('contact.writeToUs.title')}
            </p>
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">
              {t('contact.pageTitle')}
            </h1>
            <div className="w-full max-w-md">
              {contactLocations.map((location, idx) => (
                <div
                  key={location.address}
                  id={`contact-loc-${location.id}`}
                  className={`space-y-2 rounded-xl border border-transparent px-3 py-2 transition-colors ${
                    idx === contactLocations.length - 1 ? 'pb-0' : 'pb-4'
                  } ${
                    mapFocusId !== null && mapFocusId === location.id
                      ? 'border-marco-yellow/35 bg-marco-yellow/10 dark:bg-marco-yellow/[0.12]'
                      : ''
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
                  {idx < contactLocations.length - 1 && (
                    <div className={CONTACT_DIVIDER_CLASS} aria-hidden />
                  )}
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

          <div className="flex w-full justify-center md:justify-end">
            <Card className="w-full max-w-md border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm dark:border-[var(--app-border-strong)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)] sm:p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-3"
                aria-label={t('contact.form.title')}
              >
                <div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    aria-label={t('contact.form.name')}
                    value={formData.name}
                    onChange={handleChange}
                    className={CONTACT_FORM_FIELD_CLASS}
                    placeholder={t('contact.form.name').replace(/\*/gu, '').trim()}
                  />
                </div>
                <div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    aria-label={t('contact.form.email')}
                    value={formData.email}
                    onChange={handleChange}
                    className={CONTACT_FORM_FIELD_CLASS}
                    placeholder={t('contact.form.email').replace(/\*/gu, '').trim()}
                  />
                </div>
                <div>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    aria-label={t('contact.form.subject')}
                    value={formData.subject}
                    onChange={handleChange}
                    className={CONTACT_FORM_FIELD_CLASS}
                    placeholder={t('contact.form.subject').replace(/\*/gu, '').trim()}
                  />
                </div>
                <div>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    aria-label={t('contact.form.message')}
                    className={`${CONTACT_FORM_FIELD_CLASS} !h-auto min-h-[108px] !rounded-2xl !py-2.5`}
                    placeholder={t('contact.form.message')}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full !h-11 !rounded-full !border-0 !bg-marco-yellow !py-0 text-sm font-semibold uppercase tracking-wide !text-marco-black hover:!brightness-95 focus:!ring-2 focus:!ring-marco-yellow/50 sm:!text-base"
                  disabled={submitting}
                >
                  {submitting ? (t('contact.form.submitting') || 'Ուղարկվում է...') : t('contact.form.submit')}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>

      <div
        ref={mapSectionRef}
        id="contact-page-map"
        className="w-full scroll-mt-24 bg-[var(--app-bg-muted)]"
      >
        <ContactMapAddressStrip
          locations={contactLocations}
          activeId={activeMapId}
          onSelect={selectMapLocation}
          sectionTitle={t('contact.mapSectionTitle')}
        />
        <div className="h-[min(480px,62vh)] min-h-[300px] w-full">
          {mapLocation ? (
            <iframe
              key={mapLocation.id}
              title={mapLocation.address}
              src={mapsEmbedUrlForLocation(mapLocation)}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
