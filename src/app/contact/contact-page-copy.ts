import { t } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/language';

export type ContactFormCopy = {
  readonly title: string;
  readonly name: string;
  readonly email: string;
  readonly subject: string;
  readonly message: string;
  readonly submit: string;
  readonly submitting: string;
  readonly submitSuccess: string;
  readonly submitError: string;
};

export type ContactPageCopy = {
  readonly writeToUsTitle: string;
  readonly pageTitle: string;
  readonly mapSectionTitle: string;
  readonly form: ContactFormCopy;
};

export function buildContactPageCopy(language: LanguageCode): ContactPageCopy {
  return {
    writeToUsTitle: t(language, 'contact.writeToUs.title'),
    pageTitle: t(language, 'contact.pageTitle'),
    mapSectionTitle: t(language, 'contact.mapSectionTitle'),
    form: {
      title: t(language, 'contact.form.title'),
      name: t(language, 'contact.form.name'),
      email: t(language, 'contact.form.email'),
      subject: t(language, 'contact.form.subject'),
      message: t(language, 'contact.form.message'),
      submit: t(language, 'contact.form.submit'),
      submitting: t(language, 'contact.form.submitting'),
      submitSuccess: t(language, 'contact.form.submitSuccess'),
      submitError: t(language, 'contact.form.submitError'),
    },
  };
}

export function contactFormPlaceholder(label: string): string {
  return label.replace(/\*/gu, '').trim();
}
