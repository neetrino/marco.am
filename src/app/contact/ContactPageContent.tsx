'use client';

import { useMemo } from 'react';

import { getContactLocations } from '@/lib/contact-locations';
import { useTranslation } from '@/lib/i18n-client';
import { buildContactPageCopy } from './contact-page-copy';
import { ContactFormCard } from './ContactFormCard';
import { ContactInfoColumn } from './ContactInfoColumn';
import { ContactMapSection } from './ContactMapSection';

/** Contact page — client i18n for instant navigation; form/map hydrate as islands. */
export function ContactPageContent() {
  const { lang } = useTranslation();
  const copy = useMemo(() => buildContactPageCopy(lang), [lang]);
  const locations = useMemo(() => getContactLocations(lang), [lang]);

  return (
    <div className="bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="marco-header-container py-10 md:py-14">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2 md:items-start md:gap-12 lg:gap-16">
          <ContactInfoColumn
            writeToUsTitle={copy.writeToUsTitle}
            pageTitle={copy.pageTitle}
            locations={locations}
          />
          <ContactFormCard copy={copy.form} />
        </div>
      </div>

      <ContactMapSection locations={locations} mapSectionTitle={copy.mapSectionTitle} />
    </div>
  );
}
