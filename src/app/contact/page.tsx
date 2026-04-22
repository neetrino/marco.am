'use client';

import { Button, Input } from '@shop/ui';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useTranslation } from '../../lib/i18n-client';
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
/** Ровные разделители контактных блоков: первые одинаковые, последний короче. */
const CONTACT_DIVIDER_BASE_CLASS = 'ml-0 block h-px shrink-0 self-start bg-black/15';
const CONTACT_DIVIDER_CLASS =
  `${CONTACT_DIVIDER_BASE_CLASS} w-[17.5rem] sm:w-[20rem]`;
const CONTACT_LOCATIONS = [
  {
    address: 'ք. Երևան Ալեք Մանուկյան 23',
    phones: ['+374 93 52 04 06', '+374 98 19 04 06', '011 52 04 06'],
  },
  {
    address: 'Արգավանդի Օրբելականյան 1',
    phones: ['+374 93 58 04 09', '+374 41 34 04 06', '+374 77 64 04 06'],
  },
  {
    address: 'Գ. Փարաքար Մերկուր Մաճառի 1',
    phones: ['+374 77 51 04 06'],
  },
] as const;

const CONTACT_EMAILS = ['marcogrouparmenia@mail.ru', 'marcofurniture@mail.ru'] as const;

export default function ContactPage() {
  const { t, lang } = useTranslation();
  const contactLocations = [
    {
      address:
        lang === 'hy'
          ? 'Ք․ Երևան Ալեք Մանուկյան 23'
          : lang === 'ru'
            ? 'г. Ереван, Алек Манукян 23'
            : '23 Alek Manukyan St, Yerevan',
      phones: ['+374 93 52 04 06', '+374 98 19 04 06', '011 52 04 06'],
    },
    {
      address:
        lang === 'hy'
          ? 'Արգավանդ Օդանավակայան 1'
          : lang === 'ru'
            ? 'Аргаванд, Аэропорт 1'
            : '1 Airport St, Argavand',
      phones: ['+374 93 58 04 09', '+374 41 34 04 06', '+374 77 64 04 06'],
    },
    {
      address:
        lang === 'hy'
          ? 'Գ. Փարաքար Մեսրոպ Մաշտոցի 1'
          : lang === 'ru'
            ? 'с. Паракар, Месроп Маштоц 1'
            : '1 Mesrop Mashtots St, Parakar',
      phones: ['+374 77 51 04 06'],
    },
  ] as const;
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
    <div className="bg-white">
      {/* Top Section: Contact Info and Form */}
      <div className="marco-header-container pt-12 pb-16">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(320px,380px)_minmax(320px,380px)] md:justify-center md:items-center md:gap-8 lg:grid-cols-[420px_420px] lg:gap-12">
          {/* Left Side: Contact Information */}
          <div className="flex w-full flex-col items-center self-start space-y-3.5 md:items-start">
            <h2 className="mb-8 w-full self-start text-3xl font-bold text-gray-900 lg:-ml-[181px]">
              {t('contact.pageTitle')}
            </h2>
            <div className="mx-auto w-fit max-w-[320px] self-center sm:max-w-[340px] md:mx-0 md:w-full md:self-auto">
              {contactLocations.map((location, idx) => (
                <div
                  key={location.address}
                  className={`space-y-2 ${idx === contactLocations.length - 1 ? 'pb-0' : 'pb-4'}`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin
                      className={`mt-0.5 h-[18px] w-[18px] shrink-0 text-marco-yellow ${
                        idx === 0 ? 'translate-y-[3px]' : 'translate-y-[2px]'
                      }`}
                      strokeWidth={2}
                      aria-hidden
                    />
                    <p className="text-sm font-medium leading-snug text-marco-black sm:text-base">
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
                          className="text-sm font-semibold leading-snug text-marco-black transition-opacity hover:opacity-80 sm:text-base"
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
                      className="break-all text-xs font-semibold leading-snug text-marco-black transition-opacity hover:opacity-80 sm:text-sm"
                    >
                      {email}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Contact Form — ниже и по центру колонки относительно блока «ԿԱՊ ՄԵԶ ՀԵՏ» */}
          <div className="flex w-full max-w-[420px] flex-col items-center self-center justify-self-center lg:translate-y-[40px]">
            <form
              onSubmit={handleSubmit}
              className="mx-auto w-full max-w-[420px] space-y-2.5"
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
                  className="w-full !h-10 !rounded-full !border-transparent !bg-[#efefef] !px-4 !py-0 !text-sm !text-marco-black placeholder:!text-[#8f8f8f] focus:!ring-2 focus:!ring-[#d4d4d4] sm:!text-base"
                  placeholder={t('contact.form.name').replace('*', '').trim()}
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
                  className="w-full !h-10 !rounded-full !border-transparent !bg-[#efefef] !px-4 !py-0 !text-sm !text-marco-black placeholder:!text-[#8f8f8f] focus:!ring-2 focus:!ring-[#d4d4d4] sm:!text-base"
                  placeholder={t('contact.form.email').replace('*', '').trim()}
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
                  className="w-full !h-10 !rounded-full !border-transparent !bg-[#efefef] !px-4 !py-0 !text-sm !text-marco-black placeholder:!text-[#8f8f8f] focus:!ring-2 focus:!ring-[#d4d4d4] sm:!text-base"
                  placeholder={t('contact.form.subject').replace('*', '').trim()}
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
                  className="w-full min-h-[108px] resize-none rounded-[20px] border-transparent bg-[#efefef] px-4 py-2.5 text-sm text-marco-black focus:outline-none focus:ring-2 focus:ring-[#d4d4d4] placeholder:text-[#8f8f8f] sm:text-base"
                  placeholder={t('contact.form.message')}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full !h-10 !rounded-full !border-0 !bg-marco-black !py-0 text-sm font-semibold uppercase tracking-wide !text-white hover:!brightness-95 focus:!ring-marco-black sm:!text-base"
                disabled={submitting}
              >
                {submitting ? (t('contact.form.submitting') || 'Ուղարկվում է...') : t('contact.form.submit')}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Section: Map */}
      <div className="w-full h-[500px] bg-gray-100">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.1234567890123!2d44.5150!3d40.1812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x406aa2dab8fc8b5b%3A0x3d1479ab4e9b8c5e!2sAbovyan%20St%2C%20Yerevan%2C%20Armenia!5e0!3m2!1sen!2sam!4v1234567890123!5m2!1sen!2sam"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
