'use client';

import { getContactLocations } from '@/lib/contact-locations';
import { useTranslation } from '@/lib/i18n-client';
import { buildContactPageCopy } from './contact-page-copy';
import { ContactFormCard } from './ContactFormCard';
import { ContactInfoColumn } from './ContactInfoColumn';
import { ContactMapSection } from './ContactMapSection';

/** Contact page — static shell prerendered in the default language; localized client-side. */
export function ContactPageContent() {
  const { lang } = useTranslation();
  const copy = buildContactPageCopy(lang);
  const locations = getContactLocations(lang);

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
