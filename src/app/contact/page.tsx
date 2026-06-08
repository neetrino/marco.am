import { ContactPageContent } from './ContactPageContent';
import { getServerLanguage } from '@/lib/language-server';

/**
 * Contact page — server-rendered store info streams with the route; form/map hydrate as islands.
 */
export default async function ContactPage() {
  const language = await getServerLanguage();
  return <ContactPageContent language={language} />;
}
