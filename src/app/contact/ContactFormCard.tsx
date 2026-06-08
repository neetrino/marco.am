'use client';

import { Button, Card, Input } from '@shop/ui';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/types/errors';
import {
  contactFormPlaceholder,
  type ContactFormCopy,
} from './contact-page-copy';

const CONTACT_FORM_FIELD_CLASS =
  'w-full !h-11 !rounded-xl !border !border-[var(--app-border)] !bg-[var(--app-surface-muted)] !px-4 !py-0 !text-sm !text-[var(--app-text)] placeholder:!text-[var(--app-text-soft)] focus:!border-marco-yellow/55 focus:!ring-2 focus:!ring-marco-yellow/30 dark:!border-[var(--app-border-strong)] sm:!text-base';

type ContactFormCardProps = {
  readonly copy: ContactFormCopy;
};

/** Contact form — client island; labels come from server copy for instant SSR shell. */
export function ContactFormCard({ copy }: ContactFormCardProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post(
        '/api/v1/contact',
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
        { skipAuth: true },
      );
      setFormData({ name: '', email: '', subject: '', message: '' });
      alert(copy.submitSuccess);
    } catch (error: unknown) {
      alert(`${copy.submitError} ${getErrorMessage(error) ?? ''}`.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <div className="flex w-full justify-center md:justify-end">
      <Card className="w-full max-w-md border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm dark:border-[var(--app-border-strong)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.28)] sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-3" aria-label={copy.title}>
          <div>
            <Input
              id="name"
              name="name"
              type="text"
              required
              aria-label={copy.name}
              value={formData.name}
              onChange={handleChange}
              className={CONTACT_FORM_FIELD_CLASS}
              placeholder={contactFormPlaceholder(copy.name)}
            />
          </div>
          <div>
            <Input
              id="email"
              name="email"
              type="email"
              required
              aria-label={copy.email}
              value={formData.email}
              onChange={handleChange}
              className={CONTACT_FORM_FIELD_CLASS}
              placeholder={contactFormPlaceholder(copy.email)}
            />
          </div>
          <div>
            <Input
              id="subject"
              name="subject"
              type="text"
              required
              aria-label={copy.subject}
              value={formData.subject}
              onChange={handleChange}
              className={CONTACT_FORM_FIELD_CLASS}
              placeholder={contactFormPlaceholder(copy.subject)}
            />
          </div>
          <div>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              aria-label={copy.message}
              className={`${CONTACT_FORM_FIELD_CLASS} !h-auto min-h-[108px] !py-2.5`}
              placeholder={copy.message}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full !h-11 !rounded-full !border-0 !bg-marco-yellow !py-0 text-sm font-semibold uppercase tracking-wide !text-marco-black hover:!brightness-95 focus:!ring-2 focus:!ring-marco-yellow/50 sm:!text-base"
            disabled={submitting}
          >
            {submitting ? copy.submitting : copy.submit}
          </Button>
        </form>
      </Card>
    </div>
  );
}
