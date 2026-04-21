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

/** Slightly larger than footer + nudged down to align with `text-xl` headings. */
const CONTACT_PAGE_PHONE_ICON_CLASS =
  'mt-0.5 h-[18px] w-auto shrink-0 translate-y-[5px]';
const CONTACT_PAGE_MAIL_ICON_CLASS =
  'mt-0.5 h-[16px] w-auto shrink-0 translate-y-[5px]';

const CONTACT_LINK_YELLOW_CLASS =
  'font-medium text-marco-yellow transition-colors hover:text-marco-black hover:underline';

export default function ContactPage() {
  const { t } = useTranslation();
  const phoneRaw = t('contact.phone');
  const telHref = `tel:${phoneRaw.replace(/\s/g, '')}`;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side: Contact Information */}
          <div className="space-y-8">
            {/* Call to Us — icons match Footer contacts column */}
            <div>
              <div className="mb-3 flex items-start gap-3">
                <img
                  src={FOOTER_CONTACT_PHONE_ICON_SRC}
                  alt=""
                  width={22}
                  height={18}
                  className={CONTACT_PAGE_PHONE_ICON_CLASS}
                  aria-hidden
                />
                <h3 className="text-xl font-semibold text-gray-900">{t('contact.callToUs.title')}</h3>
              </div>
              <p className="mb-2 text-gray-600">{t('contact.callToUs.description')}</p>
              <a href={telHref} className={CONTACT_LINK_YELLOW_CLASS}>
                {phoneRaw}
              </a>
            </div>

            {/* Write to Us */}
            <div>
              <div className="mb-3 flex items-start gap-3">
                <img
                  src={FOOTER_CONTACT_MAIL_ICON_SRC}
                  alt=""
                  width={28}
                  height={20}
                  className={CONTACT_PAGE_MAIL_ICON_CLASS}
                  aria-hidden
                />
                <h3 className="text-xl font-semibold text-gray-900">{t('contact.writeToUs.title')}</h3>
              </div>
              <p className="mb-2 text-gray-600">{t('contact.writeToUs.description')}</p>
              <a href={`mailto:${t('contact.email')}`} className={CONTACT_LINK_YELLOW_CLASS}>
                {t('contact.writeToUs.emailLabel')} {t('contact.email')}
              </a>
            </div>

            {/* Headquarter */}
            <div>
              <div className="mb-3 flex items-start gap-3">
                <MapPin
                  className="mt-0 h-6 w-6 shrink-0 -translate-x-px translate-y-[6px] self-start text-marco-yellow"
                  strokeWidth={2}
                  aria-hidden
                />
                <h3 className="text-xl font-semibold text-gray-900">{t('contact.headquarter.title')}</h3>
              </div>
              <div className="mb-2 space-y-1 text-gray-600">
                <p>{t('contact.headquarter.hours.weekdays')}</p>
                <p>{t('contact.headquarter.hours.saturday')}</p>
              </div>
              <p className="font-medium whitespace-pre-line text-marco-yellow">{t('contact.address')}</p>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('contact.form.name')}
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full !rounded-full !px-5 !py-3"
                  placeholder={t('contact.form.namePlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('contact.form.email')}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full !rounded-full !px-5 !py-3"
                  placeholder={t('contact.form.emailPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('contact.form.subject')}
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full !rounded-full !px-5 !py-3"
                  placeholder={t('contact.form.subjectPlaceholder')}
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                  {t('contact.form.message')}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border border-gray-300 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder={t('contact.form.messagePlaceholder')}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                className="w-full !rounded-full !bg-marco-black !text-white hover:!brightness-95 focus:!ring-marco-black !py-3 font-semibold uppercase tracking-wide"
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
