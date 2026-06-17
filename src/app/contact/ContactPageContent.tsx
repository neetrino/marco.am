import { getContactLocations } from '@/lib/contact-locations';
import { getServerLanguage } from '@/lib/language-server';
import { buildContactPageCopy } from './contact-page-copy';
import { ContactFormCard } from './ContactFormCard';
import { ContactInfoColumn } from './ContactInfoColumn';
import { ContactMapSection } from './ContactMapSection';

/** Contact page — server i18n + static shell; form/map hydrate as client islands. */
export async function ContactPageContent() {
  const language = await getServerLanguage();
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
