import { AboutPageContent } from './AboutPageContent';
import { getServerLanguage } from '@/lib/language-server';

/**
 * About page — server-rendered i18n copy streams with the route (no client fetch).
 */
export default async function AboutPage() {
  const language = await getServerLanguage();
  return <AboutPageContent language={language} />;
}
