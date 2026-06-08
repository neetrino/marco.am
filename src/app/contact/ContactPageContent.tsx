import { getContactLocations } from '@/lib/contact-locations';
import type { LanguageCode } from '@/lib/language';
import { buildContactPageCopy } from './contact-page-copy';
import { ContactFormCard } from './ContactFormCard';
import { ContactInfoColumn } from './ContactInfoColumn';
import { ContactMapSection } from './ContactMapSection';

type ContactPageContentProps = {
  readonly language: LanguageCode;
};

/** Contact page — server shell + client islands (form, map). */
export function ContactPageContent({ language }: ContactPageContentProps) {
  const copy = buildContactPageCopy(language);
  const locations = getContactLocations(language);

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
